package minio

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"math"
	"mime/multipart"
	"net/http"
	"net/url"
	"path"
	"path/filepath"
	"permen_api/config"
	"permen_api/errors"
	error_helper "permen_api/helper/error"
	log_helper "permen_api/helper/log"
	"permen_api/helper/security"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

var Client *minio.Client

func New(config *config.MinioConfig) error {
	endpoint := config.Endpoint
	accessKeyID := config.AccessKeyID
	secretAccessKey := config.SecretAccessKey
	useSSL := config.UseSSL

	minioClient, err := minio.New(endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(accessKeyID, secretAccessKey, ""),
		Secure: useSSL,
		// Transport: customTransport,
	})
	if err != nil {
		return fmt.Errorf("failed to init minio: %w", err)
	}
	Client = minioClient

	// check the bucket is exist
	ctx := context.Background()
	exist, err := Client.BucketExists(ctx, config.BucketName)
	if err != nil {
		return fmt.Errorf("failed to check bucket existence: %w", err)
	}
	if !exist {
		return fmt.Errorf("bucket %s does not exist", config.BucketName)
	}

	fmt.Println("MinIO client initialized successfully")
	return nil
}

// Upload (put) file to MinIO
func PutObject(c *gin.Context, bucketName, objectName string, object *multipart.FileHeader) (minio.UploadInfo, error) {
	src, err := object.Open()
	if err != nil {
		return minio.UploadInfo{}, fmt.Errorf("failed to open file: %w", err)
	}
	defer src.Close()

	putInfo, err := Client.PutObject(c, bucketName, objectName, src, object.Size, minio.PutObjectOptions{
		ContentType: object.Header.Get("Content-Type"),
	})
	if err != nil {
		return minio.UploadInfo{}, fmt.Errorf("failed to upload file: %w", err)
	}
	return putInfo, nil
}

func PutObjectFromBytes(c *gin.Context, bucketName, objectName string, data []byte, contentType string) (minio.UploadInfo, error) {
	reader := bytes.NewReader(data)
	fmt.Println("Object Name : ", objectName)

	putInfo, err := Client.PutObject(
		c,
		bucketName,
		objectName,
		reader,
		int64(len(data)),
		minio.PutObjectOptions{
			ContentType: contentType,
		},
	)
	if err != nil {
		return minio.UploadInfo{}, fmt.Errorf("failed to upload file: %w", err)
	}
	return putInfo, nil
}

// Get presigned URL that forces download
func GetObjectLink(c *gin.Context, bucketName, objectName string) (string, error) {
	reqParams := make(url.Values)
	filename := path.Base(objectName)
	reqParams.Set("response-content-disposition", "attachment; filename=\""+filename+"\"")

	url, err := Client.PresignedGetObject(c, bucketName, objectName, config.Minio.PresignedURLExpire, reqParams)
	if err != nil {
		return "", fmt.Errorf("failed to get object link: %w", err)
	}
	return url.String(), nil
}

// Remove an object from MinIO
func RemoveObject(c *gin.Context, bucketName, objectName string) error {
	ctx := c.Request.Context()
	err := Client.RemoveObject(ctx, bucketName, objectName, minio.RemoveObjectOptions{})
	if err != nil {
		return fmt.Errorf("failed to remove object %s: %w", objectName, err)
	}
	return nil
}

// Update object: remove old one, upload new one
func UpdateObject(c *gin.Context, bucketName, oldObjectName, newObjectName string, newFile *multipart.FileHeader) (minio.UploadInfo, error) {
	if oldObjectName != "" {
		if err := RemoveObject(c, bucketName, oldObjectName); err != nil {
			return minio.UploadInfo{}, fmt.Errorf("failed to remove old object: %w", err)
		}
	}

	putInfo, err := PutObject(c, bucketName, newObjectName, newFile)
	if err != nil {
		return minio.UploadInfo{}, fmt.Errorf("failed to upload new object: %w", err)
	}
	return putInfo, nil
}

type StreamOpts struct {
	// "attachment" (force download) or "inline" (preview if browser supports)
	Disposition string
	// Suggested filename (defaults to base of objectName)
	Filename string
}

func ResolveDisposition(v string) string {
	switch strings.ToLower(v) {
	case "inline":
		return "inline"
	default:
		return "attachment"
	}
}

// StreamObject streams a MinIO object directly to the HTTP response.
func StreamObject(c *gin.Context, bucketName, objectName string, opts StreamOpts) error {
	scope := "Stream object minio"
	if opts.Disposition == "" {
		opts.Disposition = "attachment"
	}
	if opts.Filename == "" {
		opts.Filename = filepath.Base(objectName)
	}

	// Stat for size & content-type
	info, err := Client.StatObject(c, bucketName, objectName, minio.StatObjectOptions{})
	if err != nil {
		// c.Status(http.StatusNotFound)
		// return fmt.Errorf("object not found: %w", err)
		errMessage := fmt.Sprintf("object not found: %s", err.Error())
		log_helper.SetLog(c, "warn", scope, errMessage, error_helper.GetStackTrace(1), nil)
		return &errors.BadRequestError{Message: errMessage}
	}

	// Security: Validate Range header using helper function
	start, end, isRange, err := minioRangeValidation(c.GetHeader("Range"))
	if err != nil {
		// c.Status(http.StatusBadRequest)
		// return fmt.Errorf("range validation failed: %w", err)
		errMessage := fmt.Sprintf("range validation failed: %s", err.Error())
		log_helper.SetLog(c, "warn", scope, errMessage, error_helper.GetStackTrace(1), nil)
		return &errors.BadRequestError{Message: errMessage}

	}

	// Set default end if not specified in range
	if end == -1 {
		end = info.Size - 1
	}

	// Validate against file size
	if start >= info.Size || end >= info.Size || start > end {
		c.Header("Content-Range", fmt.Sprintf("bytes */%d", info.Size))
		c.Status(http.StatusRequestedRangeNotSatisfiable)
		return nil
	}

	status := http.StatusOK
	if isRange {
		status = http.StatusPartialContent
	}

	getOpts := minio.GetObjectOptions{}
	if status == http.StatusPartialContent {
		getOpts.SetRange(start, end)
	}
	obj, err := Client.GetObject(c, bucketName, objectName, getOpts)
	if err != nil {
		// c.Status(http.StatusInternalServerError)
		// return fmt.Errorf("get object: %w", err)
		errMessage := fmt.Sprintf("get object: %s", err.Error())
		errData := error_helper.SetError(c, scope, errMessage, error_helper.GetStackTrace(1), nil)
		return &errors.InternalServerError{Message: errData}
	}
	defer obj.Close()

	// Security: Calculate length with comprehensive overflow protection
	var length int64

	// Validate range relationship
	if end < start {
		// c.Status(http.StatusRequestedRangeNotSatisfiable)
		// return fmt.Errorf("invalid range: end < start")
		errMessage := "invalid range: end < start"
		log_helper.SetLog(c, "warn", scope, errMessage, error_helper.GetStackTrace(1), nil)
		return &errors.BadRequestError{Message: errMessage}
	}

	// Comprehensive overflow checks before any arithmetic
	if start < 0 || end < 0 {
		// c.Status(http.StatusRequestedRangeNotSatisfiable)
		// return fmt.Errorf("negative range values not allowed")
		errMessage := "negative range values not allowed"
		log_helper.SetLog(c, "warn", scope, errMessage, error_helper.GetStackTrace(1), nil)
		return &errors.BadRequestError{Message: errMessage}
	}

	if start >= math.MaxInt64/2 || end >= math.MaxInt64/2 {
		// c.Status(http.StatusRequestedRangeNotSatisfiable)
		// return fmt.Errorf("range values too large")
		errMessage := "range values too large"
		log_helper.SetLog(c, "warn", scope, errMessage, error_helper.GetStackTrace(1), nil)
		return &errors.BadRequestError{Message: errMessage}
	}

	// Check if subtraction would be safe (end - start)
	if end-start > math.MaxInt64-2 {
		// c.Status(http.StatusRequestedRangeNotSatisfiable)
		// return fmt.Errorf("range span too large")
		errMessage := "range span too large"
		log_helper.SetLog(c, "warn", scope, errMessage, error_helper.GetStackTrace(1), nil)
		return &errors.BadRequestError{Message: errMessage}
	}

	// Safe arithmetic: length = end - start + 1
	length = end - start + 1

	// Final validation of calculated length
	if length <= 0 || length > math.MaxInt64/2 {
		// c.Status(http.StatusRequestedRangeNotSatisfiable)
		// return fmt.Errorf("invalid calculated length")
		errMessage := "invalid calculated length"
		log_helper.SetLog(c, "warn", scope, errMessage, error_helper.GetStackTrace(1), nil)
		return &errors.BadRequestError{Message: errMessage}
	}

	// Headers
	if info.ContentType != "" {
		c.Header("Content-Type", info.ContentType)
	} else {
		// Fallback sniff
		c.Header("Content-Type", "application/octet-stream")
	}
	c.Header("Accept-Ranges", "bytes")
	c.Header("Content-Length", strconv.FormatInt(length, 10))
	c.Header("Content-Disposition", fmt.Sprintf(`%s; filename="%s"`, opts.Disposition, sanitizeFilename(opts.Filename)))
	if status == http.StatusPartialContent {
		c.Header("Content-Range", fmt.Sprintf("bytes %d-%d/%d", start, end, info.Size))
	}

	c.Status(status)
	_, copyErr := io.Copy(c.Writer, obj)
	return copyErr
}

// minioRangeValidation validates and safely extracts Range header values
func minioRangeValidation(rangeHeader string) (start, end int64, isRange bool, err error) {
	// Default values
	start = 0
	end = -1 // Will be set to file size - 1 by caller
	isRange = false

	// Empty range header is valid (means full file)
	if rangeHeader == "" {
		return start, end, isRange, nil
	}

	// Security: Validate Range header size to prevent resource exhaustion
	if len(rangeHeader) > security.MaxHeaderSize {
		return 0, 0, false, fmt.Errorf("range header exceeds maximum size")
	}

	// Security: Validate Range header content to prevent malicious input
	if strings.Contains(rangeHeader, "..") ||
		strings.ContainsAny(rangeHeader, "+-*/()[]{}") ||
		len(strings.Fields(rangeHeader)) > 10 {
		return 0, 0, false, fmt.Errorf("invalid range header content")
	}

	// Must be bytes range
	if !strings.HasPrefix(rangeHeader, "bytes=") {
		return 0, 0, false, fmt.Errorf("unsupported range type")
	}

	// Parse bytes=start-end
	parts := strings.Split(strings.TrimPrefix(rangeHeader, "bytes="), "-")
	if len(parts) != 2 {
		return 0, 0, false, fmt.Errorf("invalid range header format")
	}

	// Parse start with comprehensive overflow protection
	if parts[0] != "" {
		if len(parts[0]) > 19 { // int64 max has 19 digits
			return 0, 0, false, fmt.Errorf("start range value too long")
		}

		if s, parseErr := strconv.ParseInt(parts[0], 10, 64); parseErr == nil {
			if s < 0 || s >= math.MaxInt64/2 {
				return 0, 0, false, fmt.Errorf("start range value out of bounds")
			}
			start = s
		} else {
			return 0, 0, false, fmt.Errorf("invalid start range value")
		}
	}

	// Parse end with comprehensive overflow protection
	if parts[1] != "" {
		if len(parts[1]) > 19 { // int64 max has 19 digits
			return 0, 0, false, fmt.Errorf("end range value too long")
		}

		if e, parseErr := strconv.ParseInt(parts[1], 10, 64); parseErr == nil {
			if e < 0 || e >= math.MaxInt64/2 {
				return 0, 0, false, fmt.Errorf("end range value out of bounds")
			}
			end = e
		} else {
			return 0, 0, false, fmt.Errorf("invalid end range value")
		}
	}

	// Validate range relationship
	if end != -1 && start > end {
		return 0, 0, false, fmt.Errorf("start range greater than end range")
	}

	// Check if subtraction would be safe
	if end != -1 && (end-start) > math.MaxInt64-2 {
		return 0, 0, false, fmt.Errorf("range span too large")
	}

	return start, end, true, nil
}

func sanitizeFilename(name string) string {
	// Very basic sanitization to avoid header injection
	name = strings.ReplaceAll(name, "\n", "_")
	name = strings.ReplaceAll(name, "\r", "_")
	return name
}
