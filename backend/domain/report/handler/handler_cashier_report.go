package handler_report

import (
	"net/http"

	global_dto "permen_api/dto"
	"permen_api/helper"
	response_helper "permen_api/helper/response"

	"github.com/gin-gonic/gin"
)

func (h *ReportHandler) GetCashierReport(c *gin.Context) {
	params := parseFilterParams(c)
	data, err := h.service.GetCashierReport(params)
	if err != nil {
		c.Error(err)
		return
	}
	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Laporan kasir",
		Data:    data,
	})
}

func (h *ReportHandler) ExportCashierReport(c *gin.Context) {
	params := parseFilterParams(c)
	buf, err := h.service.ExportCashierReport(params)
	if err != nil {
		c.Error(err)
		return
	}
	c.Header("Content-Disposition", "attachment; filename=laporan-kasir.xlsx")
	c.Data(http.StatusOK, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buf.Bytes())
}
