package log_helper

import (
	"fmt"
	global_dto "permen_api/dto"
	request_helper "permen_api/helper/request"
	time_helper "permen_api/helper/time"
	"permen_api/pkg/logger"
	"strings"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type ()

const (
	insertLogExternalQuery = `INSERT INTO %s (id, request_header, request_body) VALUES (?, ?, ?)`
	updateLogExternalQuery = `UPDATE %s SET response_http_code = ?, response_header = ?, response_body = ? WHERE id = ?`
	tableHistoryESB        = `hst_esb_call`
	tableHistoryBrigate    = `hst_brigate_call`
)

func SetLogData(c *gin.Context, logType, context, scope, message string, stacktrace any, data any) {
	reqData := request_helper.GetRequestContextData(c)
	trackId := reqData["req_id"]
	startTime := reqData["start_time"]
	endTime := time_helper.GetEndTime(startTime)
	logType = strings.ToLower(logType)

	incomingReqData := &global_dto.IncomingRequestData{
		Method:   c.Request.Method,
		Endpoint: c.Request.Host + c.Request.RequestURI,
	}
	logData := global_dto.LogData{
		IncomingRequestData: incomingReqData,
		Context:             context,
		Scope:               scope,
		RequestId:           trackId,
		Message:             message,
		StartTime:           startTime,
		EndTime:             endTime,
		Data:                data,
	}

	switch logType {
	case "info":
		logger.Log.Info(logData.Message, logData.IncomingRequestData.Method, logData.IncomingRequestData.Endpoint, logData.Context, logData.Scope, logData.RequestId, logData.StartTime, logData.EndTime, logData.Data)
	case "warn":
		if newStacktrace, ok := stacktrace.(string); ok {
			logger.Log.Warn(logData.Message, logData.IncomingRequestData.Method, logData.IncomingRequestData.Endpoint, logData.Context, logData.Scope, logData.RequestId, newStacktrace, logData.StartTime, logData.EndTime, logData.Data)
		} else {
			logger.Log.Warn(logData.Message, logData.IncomingRequestData.Method, logData.IncomingRequestData.Endpoint, logData.Context, logData.Scope, logData.RequestId, "", logData.StartTime, logData.EndTime, logData.Data)
		}
	default:
		logger.Log.Debug(logData.Message, logData.IncomingRequestData.Method, logData.IncomingRequestData.Endpoint, logData.Context, logData.Scope, logData.RequestId, logData.StartTime, logData.EndTime, logData.Data)
	}
}

func SetLog(c *gin.Context, logType, scope, message string, stacktrace, data any) {
	SetLogData(c, logType, "Internal Log", scope, message, stacktrace, data)
}

func LogExternalCall(dbInstance *gorm.DB, id string, requestHeader, requestBody []byte, isESB, isInsert bool) error {
	targetTable := tableHistoryESB
	if !isESB {
		targetTable = tableHistoryBrigate
	}

	if isInsert {
		query := fmt.Sprintf(insertLogExternalQuery, targetTable)
		return dbInstance.Exec(query, id, string(requestHeader), string(requestBody)).Error
	} else {
		query := fmt.Sprintf(updateLogExternalQuery, targetTable)
		return dbInstance.Exec(query, string(requestHeader), string(requestBody), id).Error
	}
}

func LogExternalCallWithResponse(dbInstance *gorm.DB, id string, responseHttpCode int, responseHeader, responseBody []byte, isESB bool) error {
	targetTable := tableHistoryESB
	if !isESB {
		targetTable = tableHistoryBrigate
	}

	query := fmt.Sprintf(updateLogExternalQuery, targetTable)
	return dbInstance.Exec(query, responseHttpCode, string(responseHeader), string(responseBody), id).Error
}
