package handler_sync

import (
	"strconv"

	global_dto "permen_api/dto"
	dto_sync "permen_api/domain/sync/dto"
	service_sync "permen_api/domain/sync/service"
	"permen_api/errors"
	"permen_api/helper"
	response_helper "permen_api/helper/response"

	"github.com/gin-gonic/gin"
)

type SyncHandler struct {
	service service_sync.SyncService
}

func NewSyncHandler(service service_sync.SyncService) *SyncHandler {
	return &SyncHandler{service: service}
}

// POST /api/sync/push
func (h *SyncHandler) PushSync(c *gin.Context) {
	var req dto_sync.PushSyncRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.Error(&errors.BadRequestError{Message: err.Error()})
		return
	}

	result, err := h.service.PushSync(&req)
	if err != nil {
		c.Error(err)
		return
	}

	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Push sync berhasil diproses",
		Data:    result,
	})
}

// GET /api/sync/conflicts
func (h *SyncHandler) GetConflicts(c *gin.Context) {
	filter := &dto_sync.ConflictFilter{
		Status: c.Query("status"),
		Page:   parseIntQuery(c.Query("page"), 1),
		Limit:  parseIntQuery(c.Query("limit"), 20),
	}

	result, err := h.service.GetConflicts(filter)
	if err != nil {
		c.Error(err)
		return
	}

	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Daftar konflik sync",
		Data:    result,
	})
}

// POST /api/sync/conflicts/:id/resolve
func (h *SyncHandler) ResolveConflict(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.Error(&errors.BadRequestError{Message: "ID tidak valid"})
		return
	}

	var req dto_sync.ResolveConflictRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.Error(&errors.BadRequestError{Message: err.Error()})
		return
	}

	userID := helper.GetUserID(c)

	if err := h.service.ResolveConflict(id, userID, req.Resolution); err != nil {
		c.Error(err)
		return
	}

	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Konflik berhasil diselesaikan",
	})
}

// GET /api/sync/queue
func (h *SyncHandler) GetQueue(c *gin.Context) {
	filter := &dto_sync.QueueFilter{
		DeviceID:   c.Query("device_id"),
		Status:     c.Query("status"),
		EntityType: c.Query("entity_type"),
		Page:       parseIntQuery(c.Query("page"), 1),
		Limit:      parseIntQuery(c.Query("limit"), 20),
	}

	result, err := h.service.GetQueue(filter)
	if err != nil {
		c.Error(err)
		return
	}

	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Antrian sync",
		Data:    result,
	})
}

// GET /api/sync/history
func (h *SyncHandler) GetHistory(c *gin.Context) {
	filter := &dto_sync.HistoryFilter{
		DeviceID:   c.Query("device_id"),
		EntityType: c.Query("entity_type"),
		DateFrom:   c.Query("date_from"),
		DateTo:     c.Query("date_to"),
		Page:       parseIntQuery(c.Query("page"), 1),
		Limit:      parseIntQuery(c.Query("limit"), 20),
	}

	result, err := h.service.GetHistory(filter)
	if err != nil {
		c.Error(err)
		return
	}

	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Riwayat sync",
		Data:    result,
	})
}

func parseIntQuery(val string, def int) int {
	if v, err := strconv.Atoi(val); err == nil && v > 0 {
		return v
	}
	return def
}
