package handler_report

import (
	"net/http"

	global_dto "permen_api/dto"
	"permen_api/helper"
	response_helper "permen_api/helper/response"

	"github.com/gin-gonic/gin"
)

func (h *ReportHandler) GetStockReport(c *gin.Context) {
	data, err := h.service.GetStockReport()
	if err != nil {
		c.Error(err)
		return
	}
	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Laporan stok",
		Data:    data,
	})
}

func (h *ReportHandler) ExportStockReport(c *gin.Context) {
	buf, err := h.service.ExportStockReport()
	if err != nil {
		c.Error(err)
		return
	}
	c.Header("Content-Disposition", "attachment; filename=laporan-stok.xlsx")
	c.Data(http.StatusOK, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buf.Bytes())
}
