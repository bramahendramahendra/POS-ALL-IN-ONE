package handler_dashboard

import (
	"strconv"
	"time"

	dto_dashboard "pos_api/domain/dashboard/dto"
	service_dashboard "pos_api/domain/dashboard/service"
	global_dto "pos_api/dto"
	"pos_api/helper"
	response_helper "pos_api/helper/response"

	"github.com/gin-gonic/gin"
)

type DashboardHandler struct {
	service service_dashboard.DashboardService
}

func NewDashboardHandler(service service_dashboard.DashboardService) *DashboardHandler {
	return &DashboardHandler{service: service}
}

// GET /api/dashboard/stats
func (h *DashboardHandler) GetStats(c *gin.Context) {
	date := c.Query("date")
	result, err := h.service.GetStats(date)
	if err != nil {
		c.Error(err)
		return
	}
	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Success",
		Data:    result,
	})
}

// GET /api/dashboard/sales-trend
func (h *DashboardHandler) GetSalesTrend(c *gin.Context) {
	period := c.DefaultQuery("period", "7days")
	result, err := h.service.GetSalesTrend(period)
	if err != nil {
		c.Error(err)
		return
	}
	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Success",
		Data:    result,
	})
}

// GET /api/dashboard/top-products
func (h *DashboardHandler) GetTopProducts(c *gin.Context) {
	now := time.Now()
	startDate := c.DefaultQuery("start_date", now.AddDate(0, -1, 0).Format("2006-01-02"))
	endDate := c.DefaultQuery("end_date", now.Format("2006-01-02"))
	sortBy := c.DefaultQuery("sort_by", "quantity")
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	if limit <= 0 {
		limit = 10
	}

	filter := dto_dashboard.DateRangeFilter{
		StartDate: startDate,
		EndDate:   endDate,
		SortBy:    sortBy,
		Limit:     limit,
	}

	result, err := h.service.GetTopProducts(filter)
	if err != nil {
		c.Error(err)
		return
	}
	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Success",
		Data:    result,
	})
}

// GET /api/dashboard/top-categories
func (h *DashboardHandler) GetTopCategories(c *gin.Context) {
	now := time.Now()
	startDate := c.DefaultQuery("start_date", now.AddDate(0, -1, 0).Format("2006-01-02"))
	endDate := c.DefaultQuery("end_date", now.Format("2006-01-02"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "5"))
	if limit <= 0 {
		limit = 5
	}

	filter := dto_dashboard.DateRangeFilter{
		StartDate: startDate,
		EndDate:   endDate,
		Limit:     limit,
	}

	result, err := h.service.GetTopCategories(filter)
	if err != nil {
		c.Error(err)
		return
	}
	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Success",
		Data:    result,
	})
}

// GET /api/dashboard/summary-extra
func (h *DashboardHandler) GetSummaryExtra(c *gin.Context) {
	period := c.DefaultQuery("period", "today")
	result, err := h.service.GetSummaryExtra(period)
	if err != nil {
		c.Error(err)
		return
	}
	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Success",
		Data:    result,
	})
}

// GET /api/dashboard/payment-methods
func (h *DashboardHandler) GetPaymentMethods(c *gin.Context) {
	now := time.Now()
	startDate := c.DefaultQuery("start_date", now.AddDate(0, -1, 0).Format("2006-01-02"))
	endDate := c.DefaultQuery("end_date", now.Format("2006-01-02"))

	filter := dto_dashboard.DateRangeFilter{
		StartDate: startDate,
		EndDate:   endDate,
	}

	result, err := h.service.GetPaymentMethods(filter)
	if err != nil {
		c.Error(err)
		return
	}
	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Success",
		Data:    result,
	})
}
