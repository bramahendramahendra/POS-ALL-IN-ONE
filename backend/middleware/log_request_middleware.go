package middleware

import (
	"bytes"
	"context"
	"pos_api/helper"
	request_helper "pos_api/helper/request"
	time_helper "pos_api/helper/time"
	"pos_api/model"
	"pos_api/repository"
	"time"

	"github.com/gin-gonic/gin"
)

type bodyLogWriter struct {
	gin.ResponseWriter
	body *bytes.Buffer
}

func (w bodyLogWriter) Write(b []byte) (int, error) {
	if w.Header().Get("Strict-Transport-Security") == "" {
		w.Header().Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
	}
	w.body.Write(b)
	return w.ResponseWriter.Write(b)
}

func (w bodyLogWriter) WriteString(s string) (int, error) {
	if w.Header().Get("Strict-Transport-Security") == "" {
		w.Header().Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
	}
	w.body.WriteString(s)
	return w.ResponseWriter.WriteString(s)
}

type ginContextKeyType struct{}

var ginContextKey = ginContextKeyType{}

func LogRequestMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx := context.WithValue(c.Request.Context(), ginContextKey, c)
		c.Request = c.Request.WithContext(ctx)

		startTime := time_helper.GetTimeWithFormat()
		reqId := helper.GenerateUniqueId()
		c.Set("start_time", startTime)
		c.Set("req_id", reqId)

		reqBodyStr, _ := request_helper.ReadRequestBody(c)
		c.Set("req_body_str", reqBodyStr)

		blw := &bodyLogWriter{body: bytes.NewBufferString(""), ResponseWriter: c.Writer}
		c.Writer = blw
		c.Set("body_log_writer", blw)

		c.Header("Strict-Transport-Security", "max-age=31536000; includeSubDomains")

		start := time.Now()
		c.Next()
		durationMs := time.Since(start).Milliseconds()

		go saveLogRequest(c, reqId, reqBodyStr, blw, durationMs)
	}
}

func saveLogRequest(c *gin.Context, reqId, reqBodyStr string, blw *bodyLogWriter, durationMs int64) {
	method := c.Request.Method
	endpoint := c.Request.RequestURI
	statusCode := c.Writer.Status()
	resBodyStr := blw.body.String()
	ipAddress := c.ClientIP()
	createdAt := time.Now()

	var userId *int
	if id, exists := c.Get("user_id"); exists {
		if idInt, ok := id.(int); ok {
			userId = &idInt
		}
	}

	var errorMessage *string
	if statusCode >= 400 {
		if len(c.Errors) > 0 {
			msg := c.Errors.Last().Error()
			errorMessage = &msg
		} else if resBodyStr != "" {
			errorMessage = &resBodyStr
		}
	}

	logData := model.LogRequestModel{
		Id:           reqId,
		Method:       method,
		Endpoint:     endpoint,
		StatusCode:   &statusCode,
		RequestBody:  reqBodyStr,
		ResponseBody: &resBodyStr,
		UserId:       userId,
		DurationMs:   &durationMs,
		IpAddress:    &ipAddress,
		ErrorMessage: errorMessage,
		CreatedAt:    createdAt,
	}

	_ = repository.LogRequestRepo.InsertLogRequest(&logData)
}
