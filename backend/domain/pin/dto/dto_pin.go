package dto_pin

type SetPinRequest struct {
	Pin string `json:"pin" validate:"required,numeric,min=4,max=6"`
}

type ChangePinRequest struct {
	OldPin string `json:"old_pin" validate:"required,numeric,min=4,max=6"`
	NewPin string `json:"new_pin" validate:"required,numeric,min=4,max=6"`
}

type VerifyPinRequest struct {
	Pin string `json:"pin" validate:"required,numeric,min=4,max=6"`
}

type VerifyPinResponse struct {
	Valid bool `json:"valid"`
}

type HasPinResponse struct {
	HasPin bool `json:"has_pin"`
}
