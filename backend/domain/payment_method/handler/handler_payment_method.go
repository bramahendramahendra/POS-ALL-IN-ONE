package handler_payment_method

import (
	service_payment_method "pos_api/domain/payment_method/service"
	global_dto "pos_api/dto"
	"pos_api/helper"
	response_helper "pos_api/helper/response"

	"github.com/gin-gonic/gin"
)

type PaymentMethodHandler struct {
	service service_payment_method.PaymentMethodService
}

func NewPaymentMethodHandler(service service_payment_method.PaymentMethodService) *PaymentMethodHandler {
	return &PaymentMethodHandler{service: service}
}

func (h *PaymentMethodHandler) GetAll(c *gin.Context) {
	items, err := h.service.GetAll()
	if err != nil {
		c.Error(err)
		return
	}
	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Daftar metode pembayaran",
		Data:    items,
	})
}
