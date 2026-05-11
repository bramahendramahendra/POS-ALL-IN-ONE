package handler_sync

import (
	"strconv"

	dto_sync "pos_api/domain/sync/dto"
	service_sync "pos_api/domain/sync/service"
	global_dto "pos_api/dto"
	"pos_api/errors"
	"pos_api/helper"
	response_helper "pos_api/helper/response"

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

// GET /api/sync/conflicts/count — jumlah konflik pending untuk polling notifikasi
func (h *SyncHandler) GetConflictCount(c *gin.Context) {
	count, err := h.service.CountPendingConflicts()
	if err != nil {
		c.Error(err)
		return
	}

	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Jumlah konflik pending",
		Data:    map[string]int{"count": count},
	})
}

// GET /api/sync/conflicts?status=pending&page=1&limit=20
func (h *SyncHandler) GetConflicts(c *gin.Context) {
	filter := &dto_sync.ConflictFilter{
		Status: c.DefaultQuery("status", "pending"),
		Page:   parseIntQuery(c.DefaultQuery("page", "1"), 1),
		Limit:  parseIntQuery(c.DefaultQuery("limit", "20"), 20),
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

	if err := h.service.ResolveConflict(id, userID, req.Action); err != nil {
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

// GET /api/sync/history?device_id=&start_date=&end_date=&page=1&limit=20
func (h *SyncHandler) GetHistory(c *gin.Context) {
	filter := &dto_sync.HistoryFilter{
		DeviceID:  c.Query("device_id"),
		StartDate: c.Query("start_date"),
		EndDate:   c.Query("end_date"),
		Page:      parseIntQuery(c.Query("page"), 1),
		Limit:     parseIntQuery(c.Query("limit"), 20),
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
