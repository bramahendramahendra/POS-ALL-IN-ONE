package handler_payment_status

import (
	service_payment_status "pos_api/domain/payment_status/service"
	global_dto "pos_api/dto"
	"pos_api/helper"
	response_helper "pos_api/helper/response"

	"github.com/gin-gonic/gin"
)

type PaymentStatusHandler struct {
	service service_payment_status.PaymentStatusService
}

func NewPaymentStatusHandler(service service_payment_status.PaymentStatusService) *PaymentStatusHandler {
	return &PaymentStatusHandler{service: service}
}

func (h *PaymentStatusHandler) GetAll(c *gin.Context) {
	items, err := h.service.GetAll()
	if err != nil {
		c.Error(err)
		return
	}
	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Daftar status pembayaran",
		Data:    items,
	})
}
