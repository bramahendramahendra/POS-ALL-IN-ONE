package global_dto

import (
	"encoding/json"
	"reflect"
	"testing"
)

func TestPaginate_Initialization(t *testing.T) {
	tests := []struct {
		name       string
		page       int
		perPage    int
		total      int
		totalPages int
	}{
		{
			name:       "basic pagination",
			page:       1,
			perPage:    10,
			total:      100,
			totalPages: 10,
		},
		{
			name:       "zero values",
			page:       0,
			perPage:    0,
			total:      0,
			totalPages: 0,
		},
		{
			name:       "single page",
			page:       1,
			perPage:    50,
			total:      25,
			totalPages: 1,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			p := Paginate{
				Page:       tt.page,
				PerPage:    tt.perPage,
				Total:      tt.total,
				TotalPages: tt.totalPages,
			}

			if p.Page != tt.page {
				t.Errorf("Page = %v, want %v", p.Page, tt.page)
			}
			if p.PerPage != tt.perPage {
				t.Errorf("PerPage = %v, want %v", p.PerPage, tt.perPage)
			}
			if p.Total != tt.total {
				t.Errorf("Total = %v, want %v", p.Total, tt.total)
			}
			if p.TotalPages != tt.totalPages {
				t.Errorf("TotalPages = %v, want %v", p.TotalPages, tt.totalPages)
			}
		})
	}
}

func TestPaginate_JSONTags(t *testing.T) {
	p := Paginate{
		Page:       2,
		PerPage:    20,
		Total:      50,
		TotalPages: 3,
	}

	data, err := json.Marshal(p)
	if err != nil {
		t.Fatalf("Failed to marshal Paginate: %v", err)
	}

	var result map[string]interface{}
	if err := json.Unmarshal(data, &result); err != nil {
		t.Fatalf("Failed to unmarshal JSON: %v", err)
	}

	expectedKeys := []string{"page", "per_page", "total", "total_pages"}
	for _, key := range expectedKeys {
		if _, exists := result[key]; !exists {
			t.Errorf("Expected JSON key %q not found", key)
		}
	}
}

func TestResponseData_Initialization(t *testing.T) {
	tests := []struct {
		name     string
		records  any
		paginate *Paginate
	}{
		{
			name:     "with records and pagination",
			records:  []string{"item1", "item2"},
			paginate: &Paginate{Page: 1, PerPage: 10, Total: 2, TotalPages: 1},
		},
		{
			name:     "with nil pagination",
			records:  map[string]string{"key": "value"},
			paginate: nil,
		},
		{
			name:     "with nil records",
			records:  nil,
			paginate: &Paginate{Page: 1, PerPage: 10, Total: 0, TotalPages: 0},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			rd := ResponseData{
				Records:  tt.records,
				Paginate: tt.paginate,
			}

			if !reflect.DeepEqual(rd.Records, tt.records) {
				t.Errorf("Records = %v, want %v", rd.Records, tt.records)
			}
			if rd.Paginate != tt.paginate {
				t.Errorf("Paginate = %v, want %v", rd.Paginate, tt.paginate)
			}
		})
	}
}

func TestResponseParams_Initialization(t *testing.T) {
	tests := []struct {
		name       string
		code       string
		status     bool
		message    string
		data       any
		traceId    any
		errors     any
		pagination any
	}{
		{
			name:       "success response params",
			code:       "00",
			status:     true,
			message:    "Success",
			data:       map[string]string{"id": "123"},
			traceId:    "trace-123",
			errors:     nil,
			pagination: nil,
		},
		{
			name:       "error response params",
			code:       "40",
			status:     false,
			message:    "Bad Request",
			data:       nil,
			traceId:    "trace-456",
			errors:     []string{"field required"},
			pagination: nil,
		},
		{
			name:       "all fields empty",
			code:       "",
			status:     false,
			message:    "",
			data:       nil,
			traceId:    nil,
			errors:     nil,
			pagination: nil,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			rp := ResponseParams{
				Code:       tt.code,
				Status:     tt.status,
				Message:    tt.message,
				Data:       tt.data,
				TraceId:    tt.traceId,
				Errors:     tt.errors,
				Pagination: tt.pagination,
			}

			if rp.Code != tt.code {
				t.Errorf("Code = %v, want %v", rp.Code, tt.code)
			}
			if rp.Status != tt.status {
				t.Errorf("Status = %v, want %v", rp.Status, tt.status)
			}
			if rp.Message != tt.message {
				t.Errorf("Message = %v, want %v", rp.Message, tt.message)
			}
			if !reflect.DeepEqual(rp.Data, tt.data) {
				t.Errorf("Data = %v, want %v", rp.Data, tt.data)
			}
			if rp.TraceId != tt.traceId {
				t.Errorf("TraceId = %v, want %v", rp.TraceId, tt.traceId)
			}
			if !reflect.DeepEqual(rp.Errors, tt.errors) {
				t.Errorf("Errors = %v, want %v", rp.Errors, tt.errors)
			}
			if !reflect.DeepEqual(rp.Pagination, tt.pagination) {
				t.Errorf("Pagination = %v, want %v", rp.Pagination, tt.pagination)
			}
		})
	}
}

func TestJsonResponse_Initialization(t *testing.T) {
	tests := []struct {
		name       string
		code       string
		status     bool
		traceId    any
		message    string
		data       any
		pagination any
		errors     any
	}{
		{
			name:       "success response",
			code:       "00",
			status:     true,
			traceId:    "trace-abc",
			message:    "Operation successful",
			data:       []int{1, 2, 3},
			pagination: nil,
			errors:     nil,
		},
		{
			name:       "error response with errors",
			code:       "40",
			status:     false,
			traceId:    nil,
			message:    "Validation failed",
			data:       nil,
			pagination: nil,
			errors:     []string{"name required", "email invalid"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			jr := JsonResponse{
				Code:       tt.code,
				Status:     tt.status,
				TraceId:    tt.traceId,
				Message:    tt.message,
				Data:       tt.data,
				Pagination: tt.pagination,
				Errors:     tt.errors,
			}

			if jr.Code != tt.code {
				t.Errorf("Code = %v, want %v", jr.Code, tt.code)
			}
			if jr.Status != tt.status {
				t.Errorf("Status = %v, want %v", jr.Status, tt.status)
			}
			if jr.TraceId != tt.traceId {
				t.Errorf("TraceId = %v, want %v", jr.TraceId, tt.traceId)
			}
			if jr.Message != tt.message {
				t.Errorf("Message = %v, want %v", jr.Message, tt.message)
			}
			if !reflect.DeepEqual(jr.Data, tt.data) {
				t.Errorf("Data = %v, want %v", jr.Data, tt.data)
			}
			if !reflect.DeepEqual(jr.Pagination, tt.pagination) {
				t.Errorf("Pagination = %v, want %v", jr.Pagination, tt.pagination)
			}
			if !reflect.DeepEqual(jr.Errors, tt.errors) {
				t.Errorf("Errors = %v, want %v", jr.Errors, tt.errors)
			}
		})
	}
}

func TestJsonResponse_JSONTags(t *testing.T) {
	jr := JsonResponse{
		Code:       "00",
		Status:     true,
		TraceId:    "trace-123",
		Message:    "Success",
		Data:       "test data",
		Pagination: map[string]int{"page": 1},
		Errors:     []string{"error1"},
	}

	data, err := json.Marshal(jr)
	if err != nil {
		t.Fatalf("Failed to marshal JsonResponse: %v", err)
	}

	var result map[string]interface{}
	if err := json.Unmarshal(data, &result); err != nil {
		t.Fatalf("Failed to unmarshal JSON: %v", err)
	}

	expectedKeys := []string{"code", "status", "trace_id", "message", "data", "pagination", "errors"}
	for _, key := range expectedKeys {
		if _, exists := result[key]; !exists {
			t.Errorf("Expected JSON key %q not found", key)
		}
	}
}

func TestJsonResponse_OmitEmpty(t *testing.T) {
	jr := JsonResponse{
		Code:       "00",
		Status:     true,
		TraceId:    nil,
		Message:    "Success",
		Data:       "test",
		Pagination: nil,
		Errors:     nil,
	}

	data, err := json.Marshal(jr)
	if err != nil {
		t.Fatalf("Failed to marshal JsonResponse: %v", err)
	}

	var result map[string]interface{}
	if err := json.Unmarshal(data, &result); err != nil {
		t.Fatalf("Failed to unmarshal JSON: %v", err)
	}

	omitEmptyKeys := []string{"trace_id", "pagination", "errors"}
	for _, key := range omitEmptyKeys {
		if _, exists := result[key]; exists {
			t.Errorf("Expected JSON key %q to be omitted when nil", key)
		}
	}
}

func TestValidationErrorParams_Initialization(t *testing.T) {
	tests := []struct {
		name    string
		field   string
		message string
	}{
		{
			name:    "basic validation error",
			field:   "email",
			message: "invalid email format",
		},
		{
			name:    "empty field and message",
			field:   "",
			message: "",
		},
		{
			name:    "required field error",
			field:   "username",
			message: "username is required",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			vep := ValidationErrorParams{
				Field:   tt.field,
				Message: tt.message,
			}

			if vep.Field != tt.field {
				t.Errorf("Field = %v, want %v", vep.Field, tt.field)
			}
			if vep.Message != tt.message {
				t.Errorf("Message = %v, want %v", vep.Message, tt.message)
			}
		})
	}
}

func TestPagination_Initialization(t *testing.T) {
	tests := []struct {
		name     string
		status   bool
		code     int
		message  string
		data     any
		metadata any
	}{
		{
			name:     "success pagination",
			status:   true,
			code:     200,
			message:  "Data retrieved",
			data:     []string{"a", "b", "c"},
			metadata: map[string]int{"total": 3},
		},
		{
			name:     "empty pagination",
			status:   false,
			code:     404,
			message:  "No data found",
			data:     nil,
			metadata: nil,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			p := Pagination{
				Status:   tt.status,
				Code:     tt.code,
				Message:  tt.message,
				Data:     tt.data,
				Metadata: tt.metadata,
			}

			if p.Status != tt.status {
				t.Errorf("Status = %v, want %v", p.Status, tt.status)
			}
			if p.Code != tt.code {
				t.Errorf("Code = %v, want %v", p.Code, tt.code)
			}
			if p.Message != tt.message {
				t.Errorf("Message = %v, want %v", p.Message, tt.message)
			}
			if !reflect.DeepEqual(p.Data, tt.data) {
				t.Errorf("Data = %v, want %v", p.Data, tt.data)
			}
			if !reflect.DeepEqual(p.Metadata, tt.metadata) {
				t.Errorf("Metadata = %v, want %v", p.Metadata, tt.metadata)
			}
		})
	}
}

func TestPagination_JSONTags(t *testing.T) {
	p := Pagination{
		Status:   true,
		Code:     200,
		Message:  "Success",
		Data:     "test",
		Metadata: "meta",
	}

	data, err := json.Marshal(p)
	if err != nil {
		t.Fatalf("Failed to marshal Pagination: %v", err)
	}

	var result map[string]interface{}
	if err := json.Unmarshal(data, &result); err != nil {
		t.Fatalf("Failed to unmarshal JSON: %v", err)
	}

	expectedKeys := []string{"status", "code", "message", "data", "metadata"}
	for _, key := range expectedKeys {
		if _, exists := result[key]; !exists {
			t.Errorf("Expected JSON key %q not found", key)
		}
	}
}

func TestPaginationWrapper_Initialization(t *testing.T) {
	tests := []struct {
		name      string
		page      int
		totalData int
	}{
		{
			name:      "first page",
			page:      1,
			totalData: 100,
		},
		{
			name:      "middle page",
			page:      5,
			totalData: 500,
		},
		{
			name:      "zero values",
			page:      0,
			totalData: 0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			pw := PaginationWrapper{
				Page:      tt.page,
				TotalData: tt.totalData,
			}

			if pw.Page != tt.page {
				t.Errorf("Page = %v, want %v", pw.Page, tt.page)
			}
			if pw.TotalData != tt.totalData {
				t.Errorf("TotalData = %v, want %v", pw.TotalData, tt.totalData)
			}
		})
	}
}

func TestPaginationWrapper_JSONTags(t *testing.T) {
	pw := PaginationWrapper{
		Page:      3,
		TotalData: 150,
	}

	data, err := json.Marshal(pw)
	if err != nil {
		t.Fatalf("Failed to marshal PaginationWrapper: %v", err)
	}

	var result map[string]interface{}
	if err := json.Unmarshal(data, &result); err != nil {
		t.Fatalf("Failed to unmarshal JSON: %v", err)
	}

	expectedKeys := []string{"page", "total_data"}
	for _, key := range expectedKeys {
		if _, exists := result[key]; !exists {
			t.Errorf("Expected JSON key %q not found", key)
		}
	}
}
