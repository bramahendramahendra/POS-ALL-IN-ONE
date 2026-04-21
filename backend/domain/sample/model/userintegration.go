package model

type (
	UserIntegration struct {
		Username    string `gorm:"column:username"`
		Credentials string `gorm:"column:credentials"`
		ChannelName string `gorm:"column:channel_name"`
		CreatedBy   string `gorm:"column:created_by"`
		IsActive    bool   `gorm:"column:is_active"`
	}
)
