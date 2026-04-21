package middleware

import (
	"bytes"
	"context"
	"permen_api/errors"
	"permen_api/helper"
	error_helper "permen_api/helper/error"
	request_helper "permen_api/helper/request"
	time_helper "permen_api/helper/time"
	"permen_api/model"
	"permen_api/repository"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

type bodyLogWriter struct {
	gin.ResponseWriter
	body *bytes.Buffer
}

func (w bodyLogWriter) Write(b []byte) (int, error) {
	// Ensure HSTS header is set on every write
	if w.Header().Get("Strict-Transport-Security") == "" {
		w.Header().Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
	}
	w.body.Write(b)
	return w.ResponseWriter.Write(b)
}

func (w bodyLogWriter) WriteString(s string) (int, error) {
	// Ensure HSTS header is set on every write
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
		scope := "Log request middleware"
		c.Set("start_time", startTime)
		c.Set("req_id", reqId)

		reqHeaderStr, err := helper.ReadhttpHeader(&c.Request.Header)
		if err != nil {
			errData := error_helper.SetError(c, scope, err.Error(), error_helper.GetStackTrace(1), nil)
			c.Error(&errors.InternalServerError{Message: errData})
			c.Abort()
			return
		}
		reqBodyStr, err := request_helper.ReadRequestBody(c)
		if err != nil {
			errData := error_helper.SetError(c, scope, err.Error(), error_helper.GetStackTrace(1), nil)
			c.Error(&errors.InternalServerError{Message: errData})
			c.Abort()
			return
		}

		c.Set("req_header_str", reqHeaderStr)
		c.Set("req_body_str", reqBodyStr)
		bodyLogWriter := &bodyLogWriter{body: bytes.NewBufferString(""), ResponseWriter: c.Writer}

		c.Writer = bodyLogWriter
		c.Set("body_log_writer", bodyLogWriter)

		// Set HSTS header after writer is wrapped to ensure it's applied
		c.Header("Strict-Transport-Security", "max-age=31536000; includeSubDomains")

		c.Next()

		// if err := CreateLogRequest(c, scope); err != nil {
		// 	c.Error(err)
		// 	c.Abort()
		// 	return
		// }
	}
}

func CreateLogRequest(c *gin.Context, scope string) error {
	reqContextData := request_helper.GetRequestContextData(c)
	reqId := reqContextData["req_id"]
	reqHeaderStr := reqContextData["req_header_str"]
	reqBodyStr := reqContextData["req_body_str"]

	resHeader := c.Writer.Header()
	resHeaderStr, err := helper.ReadhttpHeader(&resHeader)
	if err != nil {
		errData := error_helper.SetError(c, scope, err.Error(), error_helper.GetStackTrace(1), nil)
		return &errors.InternalServerError{Message: errData}
	}

	blwAny, exists := c.Get("body_log_writer")
	if !exists {
		return &errors.InternalServerError{Message: "body_log_writer not found in context"}
	}
	blw, ok := blwAny.(*bodyLogWriter)
	if !ok {
		return &errors.InternalServerError{Message: "body_log_writer type assertion failed"}
	}
	resBodyStr := blw.body.String()
	resBody, err := helper.ConvertStringToMap(resBodyStr)
	if err != nil {
		errData := error_helper.SetError(c, scope, err.Error(), error_helper.GetStackTrace(1), nil)
		return &errors.InternalServerError{Message: errData}
	}
	statusCode := strconv.Itoa(c.Writer.Status())
	var resMessage string
	if message, okMessage := resBody["message"]; okMessage {
		if msgStr, ok := message.(string); ok {
			resMessage = msgStr
		}
	}

	logData := model.LogRequestModel{
		RequestId:       reqId,
		RequestHeader:   reqHeaderStr,
		RequestBody:     reqBodyStr,
		ResponseHeader:  &resHeaderStr,
		ResponseBody:    &resBodyStr,
		StatusCode:      &statusCode,
		ResponseMessage: &resMessage,
		InsertTime:      time.Now(),
	}
	if err := repository.LogRequestRepo.InsertLogRequest(&logData); err != nil {
		errData := error_helper.SetError(c, scope, err.Error(), error_helper.GetStackTrace(1), nil)
		return &errors.InternalServerError{Message: errData}
	}

	return nil
}
