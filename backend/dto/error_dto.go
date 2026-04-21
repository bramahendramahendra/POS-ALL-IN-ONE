package global_dto

type ErrorData struct {
	Context    string
	Scope      string
	RequestId  string
	Message    string
	StartTime  string
	EndTime    string
	Data       any
	Stacktrace string
}
