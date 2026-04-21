package handler

import (
	dto "permen_api/domain/sample/dto"
	service "permen_api/domain/sample/service"
	globalDTO "permen_api/dto"
	errors "permen_api/errors"
	response_helper "permen_api/helper/response"
	binder "permen_api/pkg/binder"
	validator "permen_api/validation"

	"github.com/gin-gonic/gin"
)

type SampleHandler struct {
	service service.UserIntegrationServiceInterface
}

func NewSampleHandler(service service.UserIntegrationServiceInterface) *SampleHandler {
	return &SampleHandler{service: service}
}

func (h *SampleHandler) CreateUserIntegration(c *gin.Context) {
	req, err := binder.BindJSON[dto.CreateUserIntegrationRequest](c)
	if err != nil {
		c.Error(&errors.BadRequestError{Message: err.Error()})
		return
	}

	if err := validator.Validate.Struct(req); err != nil {
		c.Error(err)
		return
	}

	data, err := h.service.CreateUserIntegration(&req)
	if err != nil {
		c.Error(err)
		return
	}

	response_helper.WrapResponse(c, 200, "json", &globalDTO.ResponseParams{
		Code:    "00",
		Status:  true,
		Message: "User integration created successfully",
		Data:    data,
	})
}

func (h *SampleHandler) GetUserIntegrationByUsername(c *gin.Context) {
	req, err := binder.BindURI[dto.GetUserIntegrationByUsernameRequest](c)
	if err != nil {
		c.Error(&errors.BadRequestError{Message: err.Error()})
		return
	}

	data, err := h.service.GetUserIntegrationByUsername(req.Username)
	if err != nil {
		c.Error(err)
		return
	}

	response_helper.WrapResponse(c, 200, "json", &globalDTO.ResponseParams{
		Code:    "00",
		Status:  true,
		Message: "User integration retrieved successfully",
		Data:    data,
	})
}

func (h *SampleHandler) GetAllUserIntegrations(c *gin.Context) {
	data, err := h.service.GetAllUserIntegrations()
	if err != nil {
		c.Error(err)
		return
	}

	response_helper.WrapResponse(c, 200, "json", &globalDTO.ResponseParams{
		Code:    "00",
		Status:  true,
		Message: "All user integrations retrieved successfully",
		Data:    data,
	})
}

func (h *SampleHandler) InquiryCASAVA(c *gin.Context) {
	req, err := binder.BindJSON[dto.InquiryCASAVARequest](c)
	if err != nil {
		c.Error(&errors.BadRequestError{Message: err.Error()})
		return
	}

	if err := validator.Validate.Struct(req); err != nil {
		c.Error(err)
		return
	}

	data, err := h.service.InquiryAccountCASAVA(c, req.AccountNo)
	if err != nil {
		errMessage := err.Error()
		if data.ResponseMessage != "" {
			errMessage = data.ResponseMessage
		}
		c.Error(&errors.BadRequestError{Message: errMessage})
		return
	}

	response_helper.WrapResponse(c, 200, "json", &globalDTO.ResponseParams{
		Code:    "00",
		Status:  true,
		Message: "CASAVA inquiry successful",
		Data:    data,
	})
}
