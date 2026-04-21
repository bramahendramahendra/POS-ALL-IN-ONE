package dto

type (
	CreateUserIntegrationRequest struct {
		Username string `json:"username" validate:"required,alphanum"`
		Creds    string `json:"creds" validate:"required"`
	}

	GetUserIntegrationByUsernameRequest struct {
		Username string `uri:"username" validate:"required,alphanum"`
	}

	UserIntegrationResponse struct {
		Username    string `gorm:"column:username"`
		Credentials string `gorm:"column:credentials"`
		ChannelName string `gorm:"column:channel_name"`
		CreatedBy   string `gorm:"column:created_by"`
		IsActive    bool   `gorm:"column:is_active"`
	}

	CreateUserIntegrationResponse struct {
		Username string `json:"username"`
	}

	// Sample Integration with ESB (same way if u want to connect to BRIGate)
	InquiryCASAVARequest struct {
		AccountNo string `json:"accountNo" validate:"required"`
	}
)
