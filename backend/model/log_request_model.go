package model

import "time"

type LogRequestModel struct {
	Id           string     `gorm:"primaryKey;column:id"`
	Method       string     `gorm:"column:method"`
	Endpoint     string     `gorm:"column:endpoint"`
	StatusCode   *int       `gorm:"column:status_code"`
	RequestBody  string     `gorm:"column:request_body"`
	ResponseBody *string    `gorm:"column:response_body"`
	UserId       *int       `gorm:"column:user_id"`
	DurationMs   *int64     `gorm:"column:duration_ms"`
	IpAddress    *string    `gorm:"column:ip_address"`
	ErrorMessage *string    `gorm:"column:error_message"`
	CreatedAt    time.Time  `gorm:"column:created_at"`
}
