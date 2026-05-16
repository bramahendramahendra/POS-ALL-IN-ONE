package repository

import (
	"pos_api/model"

	"gorm.io/gorm"
)

const (
	insertLogRequest = `INSERT INTO log_requests (id, method, endpoint, status_code, request_body, response_body, user_id, duration_ms, ip_address, error_message, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
)

var (
	LogRequestRepo LogRequestRepository
)

type LogRequestRepository interface {
	InsertLogRequest(data *model.LogRequestModel) error
}

type logRequestRepository struct {
	Db *gorm.DB
}

func NewLogRequestRepository(db *gorm.DB) *logRequestRepository {
	return &logRequestRepository{
		Db: db,
	}
}

func (lr *logRequestRepository) InsertLogRequest(data *model.LogRequestModel) error {
	return lr.Db.Exec(insertLogRequest,
		data.Id,
		data.Method,
		data.Endpoint,
		data.StatusCode,
		data.RequestBody,
		data.ResponseBody,
		data.UserId,
		data.DurationMs,
		data.IpAddress,
		data.ErrorMessage,
		data.CreatedAt,
	).Error
}
