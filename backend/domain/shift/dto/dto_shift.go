package dto_shift

type ShiftRequest struct {
	Name      string `json:"name" validate:"required"`
	StartTime string `json:"start_time" validate:"required"`
	EndTime   string `json:"end_time" validate:"required"`
}

type ShiftResponse struct {
	ID        int    `json:"id"`
	Name      string `json:"name"`
	StartTime string `json:"start_time"`
	EndTime   string `json:"end_time"`
	IsActive  bool   `json:"is_active"`
}

type ShiftActiveResponse struct {
	ID        int    `json:"id"`
	Name      string `json:"name"`
	StartTime string `json:"start_time"`
	EndTime   string `json:"end_time"`
}

type ShiftSummaryResponse struct {
	ShiftID           int     `json:"shift_id"`
	ShiftName         string  `json:"shift_name"`
	TotalTransactions int     `json:"total_transactions"`
	TotalSales        float64 `json:"total_sales"`
	TotalCash         float64 `json:"total_cash"`
	TotalNonCash      float64 `json:"total_non_cash"`
}
