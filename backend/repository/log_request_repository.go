package repository

import (
	"permen_api/model"

	"gorm.io/gorm"
)

const (
	insertLogRequest = `INSERT INTO log_request (request_id,request_header,request_body,response_header,response_body,status_code, response_message, insert_time) VALUES(?,?,?,?,?,?,?,?)`
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
	return lr.Db.Exec(insertLogRequest, data.RequestId, data.RequestHeader, data.RequestBody, data.ResponseHeader, data.ResponseBody, data.StatusCode, data.ResponseMessage, data.InsertTime).Error
}
