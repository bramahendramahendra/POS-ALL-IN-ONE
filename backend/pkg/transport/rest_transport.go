package transport

import (
	"bytes"
	"context"
	"crypto/tls"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"net"
	"net/http"
	"net/url"
	config "permen_api/config"
	"permen_api/helper"
	log_helper "permen_api/helper/log"
	"strings"
	"syscall"
	"time"

	"gorm.io/gorm"
)

var (
	BrigateRestClient     *RestClient
	EsbRestClient         *RestClient
	ESBMonolithRestClient *RestClient
)

// RestClient is a generic, flexible, robust REST API request helper.
type RestClient struct {
	BaseURL    string
	HTTPClient *http.Client
	Headers    map[string]string
	Timeout    time.Duration
	Debug      bool
}

// NewRestClient creates a new RestClient with optional base URL and timeout.
func NewRestClient(baseURL string, timeout time.Duration) *RestClient {
	return &RestClient{
		BaseURL: baseURL,
		HTTPClient: &http.Client{
			Transport: &http.Transport{
				TLSClientConfig: &tls.Config{
					InsecureSkipVerify: config.RestMode != nil && *config.RestMode,
				},
			},
			Timeout: timeout,
		},
		Headers: make(map[string]string),
		Timeout: timeout,
		Debug:   true,
	}
}

// RequestOptions allows flexible request customization.
type RequestOptions struct {
	Headers     map[string]string
	QueryParams map[string]string
	Body        any
	ContentType string               // e.g. "application/json"
	Files       map[string]io.Reader // for multipart/form-data
	Context     context.Context
	DbCon       *gorm.DB
	IsESB       bool // true for ESB calls, false for Brigate calls
	EnableLog   bool // enable database transaction logging
}

func (c *RestClient) Do(method, path string, opts *RequestOptions) ([]byte, int, http.Header, error) {
	var (
		bodyReader  io.Reader
		contentType string
		err         error
		reqBodyRaw  []byte // keep original JSON for debug
		logID       string // for database transaction logging
	)

	// Generate unique ID for logging if enabled
	if opts != nil && opts.EnableLog && opts.DbCon != nil {
		logID = helper.GenerateExternalId("EXT-")
	}

	// Handle multipart/form-data
	if opts != nil && len(opts.Files) > 0 {
		var b bytes.Buffer
		w := multipart.NewWriter(&b)
		for field, r := range opts.Files {
			fw, err := w.CreateFormFile(field, field)
			if err != nil {
				return nil, 0, nil, err
			}
			if _, err := io.Copy(fw, r); err != nil {
				return nil, 0, nil, err
			}
		}
		// Add other fields from Body if map[string]string
		if opts.Body != nil {
			if form, ok := opts.Body.(map[string]string); ok {
				for k, v := range form {
					_ = w.WriteField(k, v)
				}
			}
		}
		w.Close()
		bodyReader = &b
		contentType = w.FormDataContentType()
	} else if opts != nil && opts.Body != nil {
		switch b := opts.Body.(type) {
		case io.Reader:
			bodyReader = b
		case string:
			bodyReader = strings.NewReader(b)
			reqBodyRaw = []byte(b)
		default:
			// Assume JSON
			jsonBytes, err := json.Marshal(b)
			if err != nil {
				return nil, 0, nil, err
			}
			bodyReader = bytes.NewReader(jsonBytes)
			contentType = "application/json"
			reqBodyRaw = jsonBytes
		}
	}

	// Build URL
	fullURL := c.BaseURL + path
	if opts != nil && len(opts.QueryParams) > 0 {
		u, err := url.Parse(fullURL)
		if err != nil {
			return nil, 0, nil, err
		}
		q := u.Query()
		for k, v := range opts.QueryParams {
			q.Set(k, v)
		}
		u.RawQuery = q.Encode()
		fullURL = u.String()
	}

	// Create request
	req, err := http.NewRequestWithContext(context.Background(), method, fullURL, bodyReader)
	if err != nil {
		return nil, 0, nil, err
	}
	if opts != nil && opts.Context != nil {
		req = req.WithContext(opts.Context)
	}

	// Set headers
	for k, v := range c.Headers {
		req.Header.Set(k, v)
	}
	if opts != nil && opts.Headers != nil {
		for k, v := range opts.Headers {
			// Check if this is an ESB header that needs exact capitalization
			if opts.IsESB && (strings.HasPrefix(k, "X-ESB-") || strings.HasPrefix(k, "x-esb-")) {
				// Use direct map assignment to preserve exact header capitalization
				req.Header[k] = []string{v}
			} else {
				req.Header.Set(k, v)
			}
		}
	}
	if opts != nil && opts.ContentType != "" {
		req.Header.Set("Content-Type", opts.ContentType)
	} else if contentType != "" {
		req.Header.Set("Content-Type", contentType)
	}

	// 🔍 Debug: print request
	if c.Debug {
		fmt.Printf("[DEBUG] %s %s\n", method, fullURL)
		for k, v := range req.Header {
			fmt.Printf("[DEBUG] Request Header: %s=%s\n", k, strings.Join(v, ","))
		}
		if len(reqBodyRaw) > 0 {
			prettyPrintJSON("Request Body", reqBodyRaw)
		}
	}

	// Log request to database if enabled
	if opts != nil && opts.EnableLog && opts.DbCon != nil && logID != "" {
		reqHeaderBytes, _ := json.Marshal(req.Header)
		if err := log_helper.LogExternalCall(opts.DbCon, logID, reqHeaderBytes, reqBodyRaw, opts.IsESB, true); err != nil {
			if c.Debug {
				fmt.Printf("[DEBUG] Failed to log request: %v\n", err)
			}
		}
	}

	// Send request
	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		// Enhanced timeout error detection and handling
		enhancedErr := c.handleRequestError(err, fullURL)

		// Log error to database if enabled
		if opts != nil && opts.EnableLog && opts.DbCon != nil && logID != "" {
			errorMsg := fmt.Sprintf("Request failed: %v", enhancedErr)
			if logErr := log_helper.LogExternalCallWithResponse(opts.DbCon, logID, 0, nil, []byte(errorMsg), opts.IsESB); logErr != nil {
				if c.Debug {
					fmt.Printf("[DEBUG] Failed to log error response: %v\n", logErr)
				}
			}
		}

		return nil, 0, nil, enhancedErr
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, resp.StatusCode, resp.Header, err
	}

	// 🔍 Debug: print response
	if c.Debug {
		fmt.Printf("[DEBUG] Response Status: %d\n", resp.StatusCode)
		for k, v := range resp.Header {
			fmt.Printf("[DEBUG] Response Header: %s=%s\n", k, strings.Join(v, ","))
		}
		if len(respBody) > 0 {
			prettyPrintJSON("Response Body", respBody)
		}
	}

	// Log response to database if enabled
	if opts != nil && opts.EnableLog && opts.DbCon != nil && logID != "" {
		respHeaderBytes, _ := json.Marshal(resp.Header)
		if err := log_helper.LogExternalCallWithResponse(opts.DbCon, logID, resp.StatusCode, respHeaderBytes, respBody, opts.IsESB); err != nil {
			if c.Debug {
				fmt.Printf("[DEBUG] Failed to log response: %v\n", err)
			}
		}
	}

	if resp.StatusCode >= 400 {
		return respBody, resp.StatusCode, resp.Header, errors.New(string(respBody))
	}

	return respBody, resp.StatusCode, resp.Header, nil
}

// Convenience methods
func (c *RestClient) Get(path string, opts *RequestOptions) ([]byte, int, http.Header, error) {
	return c.Do(http.MethodGet, path, opts)
}

func (c *RestClient) Post(path string, opts *RequestOptions) ([]byte, int, http.Header, error) {
	return c.Do(http.MethodPost, path, opts)
}

func (c *RestClient) Put(path string, opts *RequestOptions) ([]byte, int, http.Header, error) {
	return c.Do(http.MethodPut, path, opts)
}

func (c *RestClient) Delete(path string, opts *RequestOptions) ([]byte, int, http.Header, error) {
	return c.Do(http.MethodDelete, path, opts)
}

// DoWithLogging is a convenience method that enables database transaction logging
func (c *RestClient) DoWithLogging(method, path string, opts *RequestOptions, db *gorm.DB, isESB bool) ([]byte, int, http.Header, error) {
	if opts == nil {
		opts = &RequestOptions{}
	}
	opts.DbCon = db
	opts.EnableLog = true
	opts.IsESB = isESB

	return c.Do(method, path, opts)
}

// Convenience methods with logging
func (c *RestClient) GetWithLogging(path string, opts *RequestOptions, db *gorm.DB, isESB bool) ([]byte, int, http.Header, error) {
	return c.DoWithLogging(http.MethodGet, path, opts, db, isESB)
}

func (c *RestClient) PostWithLogging(path string, opts *RequestOptions, db *gorm.DB, isESB bool) ([]byte, int, http.Header, error) {
	return c.DoWithLogging(http.MethodPost, path, opts, db, isESB)
}

func (c *RestClient) PutWithLogging(path string, opts *RequestOptions, db *gorm.DB, isESB bool) ([]byte, int, http.Header, error) {
	return c.DoWithLogging(http.MethodPut, path, opts, db, isESB)
}

func (c *RestClient) DeleteWithLogging(path string, opts *RequestOptions, db *gorm.DB, isESB bool) ([]byte, int, http.Header, error) {
	return c.DoWithLogging(http.MethodDelete, path, opts, db, isESB)
}

// handleRequestError provides enhanced error handling for HTTP requests with detailed timeout detection
func (c *RestClient) handleRequestError(err error, url string) error {
	if err == nil {
		return nil
	}

	// Check for timeout errors
	if isTimeoutError(err) {
		timeoutMsg := fmt.Sprintf("Request timeout after %v to %s: %v", c.Timeout, url, err)
		if c.Debug {
			fmt.Printf("[ERROR] %s\n", timeoutMsg)
		}
		return &TimeoutError{
			URL:     url,
			Timeout: c.Timeout,
			Err:     err,
		}
	}

	// Check for connection refused
	if isConnectionRefusedError(err) {
		connMsg := fmt.Sprintf("Connection refused to %s: %v", url, err)
		if c.Debug {
			fmt.Printf("[ERROR] %s\n", connMsg)
		}
		return &ConnectionError{
			URL: url,
			Err: err,
		}
	}

	// Check for DNS resolution errors
	if isDNSError(err) {
		dnsMsg := fmt.Sprintf("DNS resolution failed for %s: %v", url, err)
		if c.Debug {
			fmt.Printf("[ERROR] %s\n", dnsMsg)
		}
		return &DNSError{
			URL: url,
			Err: err,
		}
	}

	// Return the original error with enhanced context
	enhancedMsg := fmt.Sprintf("Request failed to %s: %v", url, err)
	if c.Debug {
		fmt.Printf("[ERROR] %s\n", enhancedMsg)
	}
	return &RequestError{
		URL: url,
		Err: err,
	}
}

// Custom error types for better error handling
type TimeoutError struct {
	URL     string
	Timeout time.Duration
	Err     error
}

func (e *TimeoutError) Error() string {
	return fmt.Sprintf("timeout after %v calling %s: %v", e.Timeout, e.URL, e.Err)
}

func (e *TimeoutError) IsTimeout() bool {
	return true
}

type ConnectionError struct {
	URL string
	Err error
}

func (e *ConnectionError) Error() string {
	return fmt.Sprintf("connection error to %s: %v", e.URL, e.Err)
}

type DNSError struct {
	URL string
	Err error
}

func (e *DNSError) Error() string {
	return fmt.Sprintf("DNS error for %s: %v", e.URL, e.Err)
}

type RequestError struct {
	URL string
	Err error
}

func (e *RequestError) Error() string {
	return fmt.Sprintf("request error to %s: %v", e.URL, e.Err)
}

// Error detection helper functions
func isTimeoutError(err error) bool {
	if err == nil {
		return false
	}

	// Check for context deadline exceeded
	if errors.Is(err, context.DeadlineExceeded) {
		return true
	}

	// Check for net.Error with timeout
	if netErr, ok := err.(net.Error); ok && netErr.Timeout() {
		return true
	}

	// Check for specific timeout patterns in error message
	errorMsg := strings.ToLower(err.Error())
	timeoutPatterns := []string{
		"timeout",
		"deadline exceeded",
		"context deadline exceeded",
		"client timeout exceeded",
		"request timeout",
	}

	for _, pattern := range timeoutPatterns {
		if strings.Contains(errorMsg, pattern) {
			return true
		}
	}

	return false
}

func isConnectionRefusedError(err error) bool {
	if err == nil {
		return false
	}

	// Check for syscall.ECONNREFUSED
	if errors.Is(err, syscall.ECONNREFUSED) {
		return true
	}

	// Check error message patterns
	errorMsg := strings.ToLower(err.Error())
	connRefusedPatterns := []string{
		"connection refused",
		"connect: connection refused",
		"no connection could be made",
	}

	for _, pattern := range connRefusedPatterns {
		if strings.Contains(errorMsg, pattern) {
			return true
		}
	}

	return false
}

func isDNSError(err error) bool {
	if err == nil {
		return false
	}

	// Check for DNS-related errors
	if _, ok := err.(*net.DNSError); ok {
		return true
	}

	// Check error message patterns
	errorMsg := strings.ToLower(err.Error())
	dnsPatterns := []string{
		"no such host",
		"dns",
		"name resolution",
		"temporary failure in name resolution",
	}

	for _, pattern := range dnsPatterns {
		if strings.Contains(errorMsg, pattern) {
			return true
		}
	}

	return false
}

// Utility functions for error type checking

// IsTimeoutError checks if the error is a timeout error
func IsTimeoutError(err error) bool {
	if err == nil {
		return false
	}

	// Check for our custom TimeoutError type
	if _, ok := err.(*TimeoutError); ok {
		return true
	}

	// Check for other timeout error types
	return isTimeoutError(err)
}

// IsConnectionError checks if the error is a connection error
func IsConnectionError(err error) bool {
	if err == nil {
		return false
	}

	// Check for our custom ConnectionError type
	if _, ok := err.(*ConnectionError); ok {
		return true
	}

	// Check for other connection error types
	return isConnectionRefusedError(err)
}

// IsDNSError checks if the error is a DNS resolution error
func IsDNSError(err error) bool {
	if err == nil {
		return false
	}

	// Check for our custom DNSError type
	if _, ok := err.(*DNSError); ok {
		return true
	}

	// Check for other DNS error types
	return isDNSError(err)
}

// GetErrorDetails returns detailed information about the error
func GetErrorDetails(err error) map[string]interface{} {
	if err == nil {
		return nil
	}

	details := map[string]interface{}{
		"error":         err.Error(),
		"type":          "unknown",
		"is_timeout":    IsTimeoutError(err),
		"is_connection": IsConnectionError(err),
		"is_dns":        IsDNSError(err),
	}

	switch e := err.(type) {
	case *TimeoutError:
		details["type"] = "timeout"
		details["url"] = e.URL
		details["timeout_duration"] = e.Timeout.String()
	case *ConnectionError:
		details["type"] = "connection"
		details["url"] = e.URL
	case *DNSError:
		details["type"] = "dns"
		details["url"] = e.URL
	case *RequestError:
		details["type"] = "request"
		details["url"] = e.URL
	}

	return details
}

func prettyPrintJSON(label string, data []byte) {
	var pretty bytes.Buffer
	if err := json.Indent(&pretty, data, "", "  "); err != nil {
		// fallback: just print raw if not valid JSON
		fmt.Printf("[DEBUG] %s: %s\n", label, string(data))
		return
	}
	fmt.Printf("[DEBUG] %s:\n%s\n", label, pretty.String())
}
