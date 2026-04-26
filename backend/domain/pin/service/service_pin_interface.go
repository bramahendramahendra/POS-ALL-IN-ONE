package service_pin

type PinService interface {
	HasPin(userID int) (bool, error)
	SetPin(userID int, pin string) error
	VerifyPin(userID int, pin string) (bool, error)
	ChangePin(userID int, oldPin, newPin string) error
}
