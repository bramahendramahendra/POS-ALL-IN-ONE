package request_helper

import (
	"bytes"
	"errors"
	"io"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

func ConvertParamStringToInt(c *gin.Context, paramName string) (int, error) {
	paramStr := c.Param(paramName)
	return strconv.Atoi(paramStr)
}

func ConvertQueryValueToInt(c *gin.Context, key string) (int, error) {
	value := c.Query(key)
	return strconv.Atoi(value)
}

func GetTokenParts(token string) ([]string, error) {
	tokenParts := strings.Split(token, " ")
	if len(tokenParts) != 2 || tokenParts[0] != "Bearer" {
		return nil, errors.New("invalid token format")
	}

	return tokenParts, nil
}

func ReadRequestBody(c *gin.Context) (string, error) {
	bodyBytes, err := io.ReadAll(c.Request.Body)
	if err != nil {
		return "", err
	}

	c.Request.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))
	return string(bodyBytes), nil
}

func GetRequestContextData(c *gin.Context) map[string]string {
	return map[string]string{
		"start_time":     c.GetString("start_time"),
		"req_id":         c.GetString("req_id"),
		"req_header_str": c.GetString("req_header_str"),
		"req_body_str":   c.GetString("req_body_str"),
	}
}
