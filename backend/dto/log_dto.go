package global_dto

type IncomingRequestData struct {
	Method   string
	Endpoint string
}
type LogData struct {
	*IncomingRequestData
	Context   string
	Scope     string
	RequestId string
	Message   string
	StartTime string
	EndTime   string
	Data      any
}
