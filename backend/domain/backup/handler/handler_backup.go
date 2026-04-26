package handler_backup

import (
	"path/filepath"
	"strings"

	service_backup "permen_api/domain/backup/service"
	"permen_api/errors"
	"permen_api/helper"
	response_helper "permen_api/helper/response"
	global_dto "permen_api/dto"

	"github.com/gin-gonic/gin"
)

type BackupHandler struct {
	service service_backup.BackupService
}

func NewBackupHandler(service service_backup.BackupService) *BackupHandler {
	return &BackupHandler{service: service}
}

// POST /api/backup
func (h *BackupHandler) Create(c *gin.Context) {
	info, err := h.service.CreateBackup()
	if err != nil {
		c.Error(err)
		return
	}

	response_helper.WrapResponse(c, 201, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Backup berhasil dibuat",
		Data:    info,
	})
}

// GET /api/backup/list
func (h *BackupHandler) GetList(c *gin.Context) {
	result, err := h.service.GetList()
	if err != nil {
		c.Error(err)
		return
	}

	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Daftar backup",
		Data:    result,
	})
}

// GET /api/backup/download/:filename
func (h *BackupHandler) Download(c *gin.Context) {
	filename := c.Param("filename")

	// Cegah path traversal
	if strings.Contains(filename, "/") || strings.Contains(filename, "\\") || strings.Contains(filename, "..") {
		c.Error(&errors.BadRequestError{Message: "Nama file tidak valid"})
		return
	}
	if !strings.HasSuffix(filename, ".sql") {
		c.Error(&errors.BadRequestError{Message: "Hanya file .sql yang dapat diunduh"})
		return
	}

	filePath := filepath.Join("backups", filepath.Base(filename))
	c.FileAttachment(filePath, filename)
}

// POST /api/restore
func (h *BackupHandler) Restore(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.Error(&errors.BadRequestError{Message: "File SQL wajib disertakan"})
		return
	}

	if !strings.HasSuffix(strings.ToLower(file.Filename), ".sql") {
		c.Error(&errors.BadRequestError{Message: "Hanya file .sql yang diizinkan"})
		return
	}

	if restoreErr := h.service.RestoreBackup(file); restoreErr != nil {
		c.Error(restoreErr)
		return
	}

	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Restore berhasil dilakukan",
	})
}
