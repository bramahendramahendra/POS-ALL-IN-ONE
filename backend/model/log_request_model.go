package model

import "time"

type LogRequestModel struct {
	RequestId       string    `gorm:"primaryKey,column:request_id"`
	RequestHeader   string    `gorm:"column:request_header"`
	RequestBody     string    `gorm:"column:request_body"`
	ResponseHeader  *string   `gorm:"column:response_header"`
	ResponseBody    *string   `gorm:"column:response_body"`
	StatusCode      *string   `gorm:"column:status_code"`
	ResponseMessage *string   `gorm:"column:response_message"`
	InsertTime      time.Time `gorm:"column:insert_time"`
}
