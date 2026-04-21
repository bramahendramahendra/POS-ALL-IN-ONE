package middleware

import (
	"fmt"
	"net/http"
	global_dto "permen_api/dto"
	"permen_api/errors"
	"permen_api/helper"
	error_helper "permen_api/helper/error"
	response_helper "permen_api/helper/response"
	"permen_api/pkg/logger"
	"permen_api/validation"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

func ErrorHandlerMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		errMessage500 := "Internal Server Error"
		defer panicHandler(c, errMessage500)

		c.Next()

		if len(c.Errors) > 0 {
			err := c.Errors.Last().Err

			var code, responseMessage string
			status := false
			var httpCode int
			var traceId any
			actualMessage := err.Error()
			var error any

			switch e := err.(type) {
			case *errors.NotFoundError:
				code = helper.StatusNotFound
				httpCode = http.StatusOK
				status = false
				responseMessage = actualMessage
			case *errors.MethodNotAllowedError:
				code = helper.StatusMethodNotAllowed
				httpCode = http.StatusMethodNotAllowed
				responseMessage = actualMessage
			case *errors.BadRequestError:
				code = helper.StatusBadRequest
				httpCode = http.StatusBadRequest
				responseMessage = actualMessage
			case *errors.UnauthenticatedError:
				code = helper.StatusUnauthorized
				httpCode = http.StatusUnauthorized
				responseMessage = actualMessage
			case *errors.UnauthorizededError:
				code = helper.StatusForbidden
				httpCode = http.StatusForbidden
				responseMessage = actualMessage
			case *errors.ValidationError:
				code = helper.StatusUnprocessableEntity
				httpCode = http.StatusUnprocessableEntity
				responseMessage = "Invalid Request"
				errValidation := error_helper.GetErrorValidation(c, e.Error())
				error = errValidation
			case validator.ValidationErrors:
				// var validationErrs []global_dto.ValidationErrorParams
				validationErrs := make(map[string]string)
				code = helper.StatusUnprocessableEntity
				httpCode = http.StatusUnprocessableEntity
				responseMessage = "Invalid Request"
				// errs := err.(validator.ValidationErrors)
				for _, edata := range e {
					// validationErrs = append(validationErrs, global_dto.ValidationErrorParams{
					//     	Field: e.Field(),
					//     Message: e.Translate(validation.ErrTrans),
					// })
					errValidationMessage := strings.ReplaceAll(edata.Translate(validation.ErrTrans), "_", " ")
					validationErrs[edata.Field()] = errValidationMessage
				}
				error = validationErrs
			default:
				code = helper.StatusInternalServerError
				httpCode = http.StatusInternalServerError
				responseMessage = errMessage500
				errData := error_helper.GetErrorData(c, err.Error())
				traceId = errData.RequestId
				logger.Log.Error(errData.Message, errData.Context, errData.Scope, errData.RequestId, errData.Stacktrace, errData.StartTime, errData.EndTime, errData.Data)
			}

			response_helper.WrapResponse(c, httpCode, "json", &global_dto.ResponseParams{
				Code:    code,
				Status:  status,
				Message: responseMessage,
				Errors:  error,
				TraceId: traceId,
			})
			c.Abort()
		}
	}
}

func panicHandler(c *gin.Context, errMessage string) {
	if r := recover(); r != nil {
		var traceId, errObj string

		if value, ok := r.(string); ok {
			if !strings.Contains(value, "RequestId") {
				errObj = error_helper.SetError(c, "Error Panic Handler", value, error_helper.GetStackTrace(1), nil)
			} else {
				errObj = value
			}
		} else {
			errMessage := fmt.Sprintf("%v", r)
			errObj = error_helper.SetError(c, "Error Panic Handler", errMessage, error_helper.GetStackTrace(1), nil)
		}

		errData := error_helper.GetErrorData(c, errObj)
		logger.Log.Error(errData.Message, errData.Context, errData.Scope, errData.RequestId, errData.Stacktrace, errData.StartTime, errData.EndTime, errData.Data)
		traceId = errData.RequestId
		response_helper.WrapResponse(c, http.StatusInternalServerError, "json", &global_dto.ResponseParams{
			Code:    helper.StatusInternalServerError,
			Message: errMessage,
			Status:  false,
			TraceId: traceId,
		})
		c.Abort()
	}
}
