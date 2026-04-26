package handler_report

import (
	"net/http"
	"time"

	global_dto "permen_api/dto"
	dto_report "permen_api/domain/report/dto"
	service_report "permen_api/domain/report/service"
	"permen_api/helper"
	response_helper "permen_api/helper/response"

	"github.com/gin-gonic/gin"
)

type ReportHandler struct {
	service service_report.ReportService
}

func NewReportHandler(service service_report.ReportService) *ReportHandler {
	return &ReportHandler{service: service}
}

func parseFilterParams(c *gin.Context) dto_report.FilterParams {
	dateFrom := c.DefaultQuery("date_from", time.Now().Format("2006-01-02")+" 00:00:00")
	dateTo := c.DefaultQuery("date_to", time.Now().Format("2006-01-02")+" 23:59:59")
	return dto_report.FilterParams{DateFrom: dateFrom, DateTo: dateTo}
}

func (h *ReportHandler) GetSalesReport(c *gin.Context) {
	params := parseFilterParams(c)
	data, err := h.service.GetSalesReport(params)
	if err != nil {
		c.Error(err)
		return
	}
	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Laporan penjualan",
		Data:    data,
	})
}

func (h *ReportHandler) GetSalesChart(c *gin.Context) {
	params := parseFilterParams(c)
	data, err := h.service.GetSalesChart(params)
	if err != nil {
		c.Error(err)
		return
	}
	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Chart penjualan",
		Data:    data,
	})
}

func (h *ReportHandler) ExportSalesReport(c *gin.Context) {
	params := parseFilterParams(c)
	buf, err := h.service.ExportSalesReport(params)
	if err != nil {
		c.Error(err)
		return
	}
	c.Header("Content-Disposition", "attachment; filename=laporan-penjualan.xlsx")
	c.Data(http.StatusOK, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buf.Bytes())
}
