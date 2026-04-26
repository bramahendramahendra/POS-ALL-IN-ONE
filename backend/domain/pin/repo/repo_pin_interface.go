package repo_pin

type PinRepo interface {
	GetPinHash(userID int) (string, error)
	SetPinHash(userID int, pinHash string) error
	ClearPinHash(userID int) error
}
