package response_helper

import (
	"math"
	global_dto "permen_api/dto"

	"github.com/gin-gonic/gin"
)

func SetPagination(reqParams *global_dto.FilterRequestParams, total int64) *global_dto.Paginate {
	return &global_dto.Paginate{
		Page:       reqParams.Page,
		PerPage:    reqParams.Limit,
		Total:      int(total),
		TotalPages: int(math.Ceil(float64(total) / float64(reqParams.Limit))),
	}
}

func WrapResponse(c *gin.Context, resCode int, resType string, resData *global_dto.ResponseParams) {
	// Security: Ensure critical security headers are always set
	ensureSecurityHeaders(c)

	switch resType {
	case "json":
		setJsonResponse(c, resCode, resData)
	case "gzip":
		//
	default:
		setJsonResponse(c, resCode, resData)
	}
}

// ensureSecurityHeaders ensures critical security headers are present as a backup
func ensureSecurityHeaders(c *gin.Context) {
	// HSTS header - critical for HTTPS enforcement
	if c.GetHeader("Strict-Transport-Security") == "" {
		c.Header("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload")
	}

	// Additional critical security headers as backup
	if c.GetHeader("X-Content-Type-Options") == "" {
		c.Header("X-Content-Type-Options", "nosniff")
	}

	if c.GetHeader("X-Frame-Options") == "" {
		c.Header("X-Frame-Options", "DENY")
	}
}

func setJsonResponse(c *gin.Context, statusCode int, data *global_dto.ResponseParams) {
	// Security: Ensure HSTS header is set for all JSON responses
	// This is a backup in case middleware doesn't apply
	if c.GetHeader("Strict-Transport-Security") == "" {
		c.Header("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload")
	}

	responseData := &global_dto.JsonResponse{
		Code:       data.Code,
		Status:     data.Status,
		TraceId:    data.TraceId,
		Message:    data.Message,
		Data:       data.Data,
		Errors:     data.Errors,
		Pagination: data.Pagination,
	}
	c.JSON(statusCode, responseData)
}
