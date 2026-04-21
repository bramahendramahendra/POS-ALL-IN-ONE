package global_dto

type Paginate struct {
	Page       int `json:"page"`
	PerPage    int `json:"per_page"`
	Total      int `json:"total"`
	TotalPages int `json:"total_pages"`
}

type ResponseData struct {
	Records  any       `json:"records"`
	Paginate *Paginate `json:"paginate"`
}

type ResponseParams struct {
	Code       string
	Status     bool
	Message    string
	Data       any
	TraceId    any
	Errors     any
	Pagination any
}

type JsonResponse struct {
	Code       string `json:"code"`
	Status     bool   `json:"status"`
	TraceId    any    `json:"trace_id,omitempty"`
	Message    string `json:"message"`
	Data       any    `json:"data"`
	Pagination any    `json:"pagination,omitempty"`
	Errors     any    `json:"errors,omitempty"`
}

type ValidationErrorParams struct {
	Field   string
	Message string
}

type Pagination struct {
	Status   bool   `json:"status"`
	Code     int    `json:"code"`
	Message  string `json:"message"`
	Data     any    `json:"data"`
	Metadata any    `json:"metadata"`
}

type PaginationWrapper struct {
	Page      int `json:"page"`
	TotalData int `json:"total_data"`
}
