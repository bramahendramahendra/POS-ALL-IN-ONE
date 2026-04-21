package global_dto

import (
	"encoding/json"
	"testing"
)

func TestErrorData(t *testing.T) {
	t.Run("struct initialization with values", func(t *testing.T) {
		errData := ErrorData{
			Context:    "UserService",
			Scope:      "CreateUser",
			RequestId:  "req-123-456",
			Message:    "Failed to create user",
			StartTime:  "2024-01-01T10:00:00Z",
			EndTime:    "2024-01-01T10:00:01Z",
			Data:       map[string]string{"userId": "user123"},
			Stacktrace: "goroutine 1 [running]:\nmain.main()\n\t/app/main.go:10",
		}

		if errData.Context != "UserService" {
			t.Errorf("Context mismatch: got %v, want 'UserService'", errData.Context)
		}
		if errData.Scope != "CreateUser" {
			t.Errorf("Scope mismatch: got %v, want 'CreateUser'", errData.Scope)
		}
		if errData.RequestId != "req-123-456" {
			t.Errorf("RequestId mismatch: got %v, want 'req-123-456'", errData.RequestId)
		}
		if errData.Message != "Failed to create user" {
			t.Errorf("Message mismatch: got %v, want 'Failed to create user'", errData.Message)
		}
		if errData.StartTime != "2024-01-01T10:00:00Z" {
			t.Errorf("StartTime mismatch: got %v, want '2024-01-01T10:00:00Z'", errData.StartTime)
		}
		if errData.EndTime != "2024-01-01T10:00:01Z" {
			t.Errorf("EndTime mismatch: got %v, want '2024-01-01T10:00:01Z'", errData.EndTime)
		}
	})

	t.Run("struct initialization with zero values", func(t *testing.T) {
		errData := ErrorData{}

		if errData.Context != "" {
			t.Errorf("expected Context to be empty, got %v", errData.Context)
		}
		if errData.Scope != "" {
			t.Errorf("expected Scope to be empty, got %v", errData.Scope)
		}
		if errData.RequestId != "" {
			t.Errorf("expected RequestId to be empty, got %v", errData.RequestId)
		}
		if errData.Message != "" {
			t.Errorf("expected Message to be empty, got %v", errData.Message)
		}
		if errData.Data != nil {
			t.Errorf("expected Data to be nil, got %v", errData.Data)
		}
		if errData.Stacktrace != "" {
			t.Errorf("expected Stacktrace to be empty, got %v", errData.Stacktrace)
		}
	})

	t.Run("json marshal and unmarshal", func(t *testing.T) {
		errData := ErrorData{
			Context:    "TestContext",
			Scope:      "TestScope",
			RequestId:  "test-req-id",
			Message:    "Test error message",
			StartTime:  "2024-01-01T00:00:00Z",
			EndTime:    "2024-01-01T00:00:05Z",
			Data:       "some error data",
			Stacktrace: "stack trace here",
		}

		data, err := json.Marshal(errData)
		if err != nil {
			t.Fatalf("failed to marshal: %v", err)
		}

		var decoded ErrorData
		if err := json.Unmarshal(data, &decoded); err != nil {
			t.Fatalf("failed to unmarshal: %v", err)
		}

		if decoded.Context != errData.Context {
			t.Errorf("Context mismatch: got %v, want %v", decoded.Context, errData.Context)
		}
		if decoded.Scope != errData.Scope {
			t.Errorf("Scope mismatch: got %v, want %v", decoded.Scope, errData.Scope)
		}
		if decoded.RequestId != errData.RequestId {
			t.Errorf("RequestId mismatch: got %v, want %v", decoded.RequestId, errData.RequestId)
		}
		if decoded.Message != errData.Message {
			t.Errorf("Message mismatch: got %v, want %v", decoded.Message, errData.Message)
		}
	})

	t.Run("Data field with various types", func(t *testing.T) {
		t.Run("string data", func(t *testing.T) {
			errData := ErrorData{
				Data: "error details string",
			}
			if errData.Data != "error details string" {
				t.Error("string Data mismatch")
			}
		})

		t.Run("map data", func(t *testing.T) {
			errData := ErrorData{
				Data: map[string]interface{}{
					"code":    500,
					"details": "Internal server error",
				},
			}
			dataMap, ok := errData.Data.(map[string]interface{})
			if !ok {
				t.Fatal("expected Data to be a map")
			}
			if dataMap["code"] != 500 {
				t.Error("map Data code mismatch")
			}
		})

		t.Run("slice data", func(t *testing.T) {
			errData := ErrorData{
				Data: []string{"error1", "error2", "error3"},
			}
			dataSlice, ok := errData.Data.([]string)
			if !ok {
				t.Fatal("expected Data to be a slice")
			}
			if len(dataSlice) != 3 {
				t.Errorf("expected 3 items, got %d", len(dataSlice))
			}
		})

		t.Run("nil data", func(t *testing.T) {
			errData := ErrorData{
				Data: nil,
			}
			if errData.Data != nil {
				t.Error("expected Data to be nil")
			}
		})
	})

	t.Run("multiline stacktrace", func(t *testing.T) {
		stacktrace := "goroutine 1 [running]:\nmain.main()\n\t/app/main.go:10 +0x20"

		errData := ErrorData{
			Stacktrace: stacktrace,
		}

		if errData.Stacktrace != stacktrace {
			t.Error("multiline stacktrace mismatch")
		}

		data, err := json.Marshal(errData)
		if err != nil {
			t.Fatalf("failed to marshal: %v", err)
		}

		var decoded ErrorData
		if err := json.Unmarshal(data, &decoded); err != nil {
			t.Fatalf("failed to unmarshal: %v", err)
		}

		if decoded.Stacktrace != stacktrace {
			t.Error("stacktrace not preserved after JSON round-trip")
		}
	})

	t.Run("special characters in message", func(t *testing.T) {
		errData := ErrorData{
			Message: `Error: "file not found" at path '/tmp/test.txt' & more`,
		}

		data, err := json.Marshal(errData)
		if err != nil {
			t.Fatalf("failed to marshal: %v", err)
		}

		var decoded ErrorData
		if err := json.Unmarshal(data, &decoded); err != nil {
			t.Fatalf("failed to unmarshal: %v", err)
		}

		if decoded.Message != errData.Message {
			t.Errorf("Message with special chars mismatch: got %v, want %v", decoded.Message, errData.Message)
		}
	})

	t.Run("unicode in fields", func(t *testing.T) {
		errData := ErrorData{
			Context:   "数据处理",
			Scope:     "ユーザー作成",
			Message:   "오류가 발생했습니다",
			RequestId: "req-abc-123",
		}

		data, err := json.Marshal(errData)
		if err != nil {
			t.Fatalf("failed to marshal: %v", err)
		}

		var decoded ErrorData
		if err := json.Unmarshal(data, &decoded); err != nil {
			t.Fatalf("failed to unmarshal: %v", err)
		}

		if decoded.Context != errData.Context {
			t.Errorf("Unicode Context mismatch")
		}
		if decoded.Scope != errData.Scope {
			t.Errorf("Unicode Scope mismatch")
		}
		if decoded.Message != errData.Message {
			t.Errorf("Unicode Message mismatch")
		}
	})

	t.Run("time format strings", func(t *testing.T) {
		errData := ErrorData{
			StartTime: "2024-12-25T14:30:00.123Z",
			EndTime:   "2024-12-25T14:30:05.456Z",
		}

		if errData.StartTime != "2024-12-25T14:30:00.123Z" {
			t.Error("StartTime format mismatch")
		}
		if errData.EndTime != "2024-12-25T14:30:05.456Z" {
			t.Error("EndTime format mismatch")
		}
	})

	t.Run("empty error with only message", func(t *testing.T) {
		errData := ErrorData{
			Message: "Simple error message",
		}

		if errData.Message != "Simple error message" {
			t.Error("Message mismatch")
		}
		if errData.Context != "" {
			t.Error("expected Context to be empty")
		}
	})

	t.Run("long requestId", func(t *testing.T) {
		errData := ErrorData{
			RequestId: "req-12345678-1234-1234-1234-123456789012-extra-long-suffix",
		}

		if errData.RequestId != "req-12345678-1234-1234-1234-123456789012-extra-long-suffix" {
			t.Error("long RequestId mismatch")
		}
	})
}

func TestErrorDataJSONFields(t *testing.T) {
	t.Run("fields without json tags use Go field names", func(t *testing.T) {
		errData := ErrorData{
			Context:   "ctx",
			Scope:     "scope",
			RequestId: "id",
			Message:   "msg",
		}

		data, err := json.Marshal(errData)
		if err != nil {
			t.Fatalf("failed to marshal: %v", err)
		}

		var m map[string]interface{}
		if err := json.Unmarshal(data, &m); err != nil {
			t.Fatalf("failed to unmarshal to map: %v", err)
		}

		expectedFields := []string{"Context", "Scope", "RequestId", "Message", "StartTime", "EndTime", "Data", "Stacktrace"}
		for _, field := range expectedFields {
			if _, ok := m[field]; !ok {
				t.Errorf("expected '%s' field in JSON", field)
			}
		}
	})
}

func TestErrorDataCopy(t *testing.T) {
	t.Run("copying struct creates independent copy", func(t *testing.T) {
		original := ErrorData{
			Context:   "original",
			Message:   "original message",
			RequestId: "req-001",
		}

		copied := original
		copied.Context = "copied"
		copied.Message = "copied message"

		if original.Context != "original" {
			t.Error("original Context was modified")
		}
		if original.Message != "original message" {
			t.Error("original Message was modified")
		}
	})
}
