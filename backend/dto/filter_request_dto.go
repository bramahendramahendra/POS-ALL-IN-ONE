package global_dto

type FilterRequestParams struct {
	Page   int
	Limit  int
	Offset int
	Search string
	Other  map[string]any
}
