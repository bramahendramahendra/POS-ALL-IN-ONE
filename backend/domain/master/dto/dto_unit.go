package dto_master

type CreateUnitRequest struct {
	Name         string `json:"name" validate:"required,min=1"`
	Abbreviation string `json:"abbreviation" validate:"required,min=1"`
}

type UpdateUnitRequest struct {
	Name         string `json:"name" validate:"required,min=1"`
	Abbreviation string `json:"abbreviation" validate:"required,min=1"`
}

type UnitResponse struct {
	ID           int    `json:"id"`
	Name         string `json:"name"`
	Abbreviation string `json:"abbreviation"`
	IsActive     bool   `json:"is_active"`
}

type UnitActiveResponse struct {
	ID           int    `json:"id"`
	Name         string `json:"name"`
	Abbreviation string `json:"abbreviation"`
}
