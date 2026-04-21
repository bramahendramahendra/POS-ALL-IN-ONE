package security

import (
	"fmt"
	"permen_api/helper"
	"strings"

	"github.com/gin-gonic/gin"
)

const (
	// MaxHeaderSize defines the maximum allowed size for security-sensitive headers
	MaxHeaderSize = 5024 // 1KB limit per header

	// Header name constants for consistency and security
	AuthorizationHeader = "Authorization"
	UserqHeader         = "userq"
	HilfmHeader         = "hilfm"
	BranchHeader        = "branch"
	OrgechHeader        = "orgeh"
	StellTXHeader       = "stellTX"
	KostlHeader         = "costCenter"
)

// SecureHeaderContext holds validated header information to prevent resource exhaustion
type SecureHeaderContext struct {
	UserQ   string
	Hilfm   string
	Branch  string
	Orgeh   string
	StellTX string
	Kostl   string
}

// ValidateAndGetHeaders safely retrieves and validates headers to prevent resource exhaustion attacks
func ValidateAndGetHeaders(c *gin.Context, requiredHeaders ...string) (*SecureHeaderContext, error) {
	headerCtx := &SecureHeaderContext{}

	// Define header mappings and validation rules
	headerMappings := map[string]struct {
		target   *string
		required bool
	}{
		UserqHeader:   {&headerCtx.UserQ, false},
		HilfmHeader:   {&headerCtx.Hilfm, false},
		BranchHeader:  {&headerCtx.Branch, false},
		OrgechHeader:  {&headerCtx.Orgeh, false},
		StellTXHeader: {&headerCtx.StellTX, false},
		KostlHeader:   {&headerCtx.Kostl, false},
	}

	// Create a map of required headers for quick lookup
	requiredMap := make(map[string]bool)
	for _, header := range requiredHeaders {
		requiredMap[header] = true
	}

	// Validate each header
	for headerName, mapping := range headerMappings {
		headerValue := c.GetHeader(headerName)

		// Check size limit to prevent resource exhaustion
		if len(headerValue) > MaxHeaderSize {
			return nil, fmt.Errorf("%s header exceeds maximum allowed size (%d bytes)", headerName, MaxHeaderSize)
		}

		// Check if required header is missing
		if requiredMap[headerName] && headerValue == "" {
			return nil, fmt.Errorf("%s header is required", headerName)
		}

		// Store the validated header value
		if headerName == UserqHeader {
			// For userq, store as is
			*mapping.target = headerValue
		} else {
			// For other headers, trim leading zeros
			*mapping.target = strings.TrimLeft(headerValue, "0")
		}

	}

	return headerCtx, nil
}

// GetUserInfo safely extracts user information with header validation
func GetUserInfo(c *gin.Context, requiredHeaders ...string) (pernr, name, hilfm, branch, orgeh, kostl string, err error) {
	headerCtx, err := ValidateAndGetHeaders(c, requiredHeaders...)
	if err != nil {
		return "", "", "", "", "", "", err
	}

	// Parse user header only after validation
	if headerCtx.UserQ != "" {
		pernr, name, _ = helper.ParseUserHeader(headerCtx.UserQ)
	}

	return pernr, name, headerCtx.Hilfm, headerCtx.Branch, headerCtx.Orgeh, headerCtx.Kostl, nil
}

// GetApproverInfo safely extracts approver information with header validation for general services
func GetApproverInfo(c *gin.Context, requiredHeaders ...string) (pernr, name, hilfm, branch, orgeh, jabatan string, err error) {
	headerCtx, err := ValidateAndGetHeaders(c, requiredHeaders...)
	if err != nil {
		return "", "", "", "", "", "", err
	}

	// Parse user header only after validation
	if headerCtx.UserQ != "" {
		pernr, name, _ = helper.ParseUserHeader(headerCtx.UserQ)
	}

	return pernr, name, headerCtx.Hilfm, headerCtx.Branch, headerCtx.Orgeh, headerCtx.StellTX, nil
}

// AuthenticationResult holds the result of authentication validation
type AuthenticationResult struct {
	Token        string
	Claims       map[string]interface{}
	UserqHeader  string
	HeadersToSet map[string]string
}

// ValidateAuthentication performs comprehensive authentication validation including header security
func ValidateAuthentication(c *gin.Context, jwtVerifyFunc func(string) (*map[string]interface{}, error), fillClaimsFunc func(map[string]interface{}) map[string]string) (*AuthenticationResult, error) {
	// Step 1: Validate Authorization header
	authHeader := c.GetHeader(AuthorizationHeader)

	// Security: Validate Authorization header size
	if len(authHeader) > MaxHeaderSize {
		return nil, fmt.Errorf("authorization header exceeds maximum size")
	}

	if authHeader == "" {
		return nil, fmt.Errorf("authorization header is empty")
	}

	// Security: Validate header content
	if strings.Contains(authHeader, "\n") || strings.Contains(authHeader, "\r") {
		return nil, fmt.Errorf("authorization header contains invalid characters")
	}

	// Validate Bearer token format
	if !strings.HasPrefix(authHeader, "Bearer ") {
		return nil, fmt.Errorf("invalid authorization header format")
	}

	// Extract token
	token := strings.TrimPrefix(authHeader, "Bearer ")
	if token == "" {
		return nil, fmt.Errorf("bearer token is empty")
	}

	if len(token) > MaxHeaderSize-7 { // -7 for "Bearer "
		return nil, fmt.Errorf("bearer token exceeds maximum size")
	}

	// Step 2: Verify JWT token
	claims, err := jwtVerifyFunc(token)
	if err != nil {
		return nil, fmt.Errorf("token verification failed: %w", err)
	}

	claimsPayload := *claims

	// Step 3: Build userq header
	pernr, pernrOk := claimsPayload["pernr"].(string)
	nama, namaOk := claimsPayload["nama"].(string)

	if !pernrOk || !namaOk {
		return nil, fmt.Errorf("invalid claims: missing pernr or nama")
	}

	userqHeader := pernr + " | " + nama

	// Security: Validate userq header size
	if len(userqHeader) > MaxHeaderSize {
		return nil, fmt.Errorf("user header exceeds maximum size")
	}

	// Step 4: Process additional headers from claims
	headersToSet := fillClaimsFunc(claimsPayload)

	// Security: Validate all headers to set
	for k, v := range headersToSet {
		if len(k) > MaxHeaderSize {
			return nil, fmt.Errorf("header key '%s' exceeds maximum size", k)
		}
		if len(v) > MaxHeaderSize {
			return nil, fmt.Errorf("header value for '%s' exceeds maximum size", k)
		}
		if strings.ContainsAny(k, "\n\r") || strings.ContainsAny(v, "\n\r") {
			return nil, fmt.Errorf("header contains invalid characters")
		}
	}

	return &AuthenticationResult{
		Token:        token,
		Claims:       claimsPayload,
		UserqHeader:  userqHeader,
		HeadersToSet: headersToSet,
	}, nil
}
