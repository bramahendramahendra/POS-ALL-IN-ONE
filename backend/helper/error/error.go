package error_helper

import (
	"encoding/json"
	"fmt"
	global_dto "permen_api/dto"
	"permen_api/helper"
	request_helper "permen_api/helper/request"
	time_helper "permen_api/helper/time"
	"runtime"

	"github.com/gin-gonic/gin"
)

func SetErrorData(c *gin.Context, context, scope, message, stacktrace string, data any) string {
	var trackerId, startTime string
	if c != nil {
		reqData := request_helper.GetRequestContextData(c)
		trackerId = reqData["req_id"]
		startTime = reqData["start_time"]
	} else {
		trackerId = helper.GenerateUniqueId()
		startTime = time_helper.GetTimeWithFormat()
	}
	endTime := time_helper.GetEndTime(startTime)
	errData := global_dto.ErrorData{
		Context:    context,
		Scope:      scope,
		RequestId:  trackerId,
		Message:    message,
		StartTime:  startTime,
		EndTime:    endTime,
		Data:       data,
		Stacktrace: stacktrace,
	}

	jsonData, err := json.Marshal(errData)
	if err != nil {
		errData := SetError(c, "Error Helper", "failed to set error data, (convert struct to json)", GetStackTrace(1), data)
		panic(errData)
	}

	return string(jsonData)
}

func GetErrorData(c *gin.Context, err string) *global_dto.ErrorData {
	var errData global_dto.ErrorData

	if err := json.Unmarshal([]byte(err), &errData); err != nil {
		errData := SetError(c, "Error Helper", "failed to get eror data (convert json to struct)", GetStackTrace(1), nil)
		panic(errData)
	}

	return &errData
}

func GetErrorValidation(c *gin.Context, err string) map[string]string {
	var errValidation map[string]string

	if err := json.Unmarshal([]byte(err), &errValidation); err != nil {
		errData := SetError(c, "Error Helper", "failed to get error validation data (convert json to map)", GetStackTrace(1), nil)
		panic(errData)
	}

	return errValidation
}

func GetStackTrace(skip int) string {
	file, line, function := "unknown", 0, "unknown"
	stacktrace := ""

	for i := skip; i <= skip; i++ {
		pc, f, l, ok := runtime.Caller(i)
		if !ok {
			break
		}
		if f != "" {
			file = f
		}
		if l != 0 {
			line = l
		}
		fn := runtime.FuncForPC(pc)
		if fn != nil {
			function = fn.Name()
		}
		stacktrace += fmt.Sprintf("File: %s, Line: %d, Function: %s\n", file, line, function)
	}

	return stacktrace
}

func SetError(c *gin.Context, scope, message, stacktrace string, data any) string {
	return SetErrorData(c, "Internal Error", scope, message, stacktrace, data)
}
