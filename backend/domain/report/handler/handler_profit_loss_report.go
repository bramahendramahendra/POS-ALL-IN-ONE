package handler_report

import (
	"net/http"

	global_dto "permen_api/dto"
	"permen_api/helper"
	response_helper "permen_api/helper/response"

	"github.com/gin-gonic/gin"
)

func (h *ReportHandler) GetProfitLoss(c *gin.Context) {
	params := parseFilterParams(c)
	data, err := h.service.GetProfitLoss(params)
	if err != nil {
		c.Error(err)
		return
	}
	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Laporan laba rugi",
		Data:    data,
	})
}

func (h *ReportHandler) ExportProfitLoss(c *gin.Context) {
	params := parseFilterParams(c)
	buf, err := h.service.ExportProfitLoss(params)
	if err != nil {
		c.Error(err)
		return
	}
	c.Header("Content-Disposition", "attachment; filename=laporan-laba-rugi.xlsx")
	c.Data(http.StatusOK, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buf.Bytes())
}
