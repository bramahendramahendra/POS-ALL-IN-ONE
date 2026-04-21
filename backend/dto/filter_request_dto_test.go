package global_dto

import (
	"encoding/json"
	"testing"
)

func TestFilterRequestParams(t *testing.T) {
	t.Run("struct initialization with values", func(t *testing.T) {
		params := FilterRequestParams{
			Page:   1,
			Limit:  10,
			Offset: 0,
			Search: "test search",
			Other: map[string]any{
				"sort":  "created_at",
				"order": "desc",
			},
		}

		if params.Page != 1 {
			t.Errorf("Page mismatch: got %v, want 1", params.Page)
		}
		if params.Limit != 10 {
			t.Errorf("Limit mismatch: got %v, want 10", params.Limit)
		}
		if params.Offset != 0 {
			t.Errorf("Offset mismatch: got %v, want 0", params.Offset)
		}
		if params.Search != "test search" {
			t.Errorf("Search mismatch: got %v, want 'test search'", params.Search)
		}
		if params.Other["sort"] != "created_at" {
			t.Errorf("Other['sort'] mismatch: got %v, want 'created_at'", params.Other["sort"])
		}
	})

	t.Run("struct initialization with zero values", func(t *testing.T) {
		params := FilterRequestParams{}

		if params.Page != 0 {
			t.Errorf("expected Page to be 0, got %v", params.Page)
		}
		if params.Limit != 0 {
			t.Errorf("expected Limit to be 0, got %v", params.Limit)
		}
		if params.Offset != 0 {
			t.Errorf("expected Offset to be 0, got %v", params.Offset)
		}
		if params.Search != "" {
			t.Errorf("expected Search to be empty, got %v", params.Search)
		}
		if params.Other != nil {
			t.Errorf("expected Other to be nil, got %v", params.Other)
		}
	})

	t.Run("json marshal and unmarshal", func(t *testing.T) {
		params := FilterRequestParams{
			Page:   2,
			Limit:  25,
			Offset: 25,
			Search: "query",
			Other: map[string]any{
				"status": "active",
			},
		}

		data, err := json.Marshal(params)
		if err != nil {
			t.Fatalf("failed to marshal: %v", err)
		}

		var decoded FilterRequestParams
		if err := json.Unmarshal(data, &decoded); err != nil {
			t.Fatalf("failed to unmarshal: %v", err)
		}

		if decoded.Page != params.Page {
			t.Errorf("Page mismatch: got %v, want %v", decoded.Page, params.Page)
		}
		if decoded.Limit != params.Limit {
			t.Errorf("Limit mismatch: got %v, want %v", decoded.Limit, params.Limit)
		}
		if decoded.Offset != params.Offset {
			t.Errorf("Offset mismatch: got %v, want %v", decoded.Offset, params.Offset)
		}
		if decoded.Search != params.Search {
			t.Errorf("Search mismatch: got %v, want %v", decoded.Search, params.Search)
		}
	})

	t.Run("Other map with various types", func(t *testing.T) {
		params := FilterRequestParams{
			Other: map[string]any{
				"string_val": "hello",
				"int_val":    42,
				"float_val":  3.14,
				"bool_val":   true,
				"nil_val":    nil,
			},
		}

		if params.Other["string_val"] != "hello" {
			t.Errorf("string_val mismatch")
		}
		if params.Other["int_val"] != 42 {
			t.Errorf("int_val mismatch")
		}
		if params.Other["float_val"] != 3.14 {
			t.Errorf("float_val mismatch")
		}
		if params.Other["bool_val"] != true {
			t.Errorf("bool_val mismatch")
		}
		if params.Other["nil_val"] != nil {
			t.Errorf("nil_val mismatch")
		}
	})

	t.Run("negative page and limit values", func(t *testing.T) {
		params := FilterRequestParams{
			Page:   -1,
			Limit:  -10,
			Offset: -5,
		}

		if params.Page != -1 {
			t.Errorf("Page mismatch: got %v, want -1", params.Page)
		}
		if params.Limit != -10 {
			t.Errorf("Limit mismatch: got %v, want -10", params.Limit)
		}
	})

	t.Run("large pagination values", func(t *testing.T) {
		params := FilterRequestParams{
			Page:   999999,
			Limit:  1000,
			Offset: 999000,
		}

		if params.Page != 999999 {
			t.Errorf("Page mismatch: got %v, want 999999", params.Page)
		}
		if params.Limit != 1000 {
			t.Errorf("Limit mismatch: got %v, want 1000", params.Limit)
		}
		if params.Offset != 999000 {
			t.Errorf("Offset mismatch: got %v, want 999000", params.Offset)
		}
	})

	t.Run("search with special characters", func(t *testing.T) {
		params := FilterRequestParams{
			Search: "test@#$%^&*()_+-=[]{}|;':,./<>?",
		}

		if params.Search != "test@#$%^&*()_+-=[]{}|;':,./<>?" {
			t.Errorf("Search with special characters mismatch")
		}
	})

	t.Run("search with unicode", func(t *testing.T) {
		params := FilterRequestParams{
			Search: "测试 てすと 테스트",
		}

		if params.Search != "测试 てすと 테스트" {
			t.Errorf("Search with unicode mismatch")
		}
	})

	t.Run("Other map modification", func(t *testing.T) {
		params := FilterRequestParams{
			Other: make(map[string]any),
		}

		params.Other["new_key"] = "new_value"
		params.Other["another_key"] = 123

		if params.Other["new_key"] != "new_value" {
			t.Errorf("new_key mismatch")
		}
		if params.Other["another_key"] != 123 {
			t.Errorf("another_key mismatch")
		}
	})

	t.Run("empty search string", func(t *testing.T) {
		params := FilterRequestParams{
			Page:   1,
			Limit:  10,
			Search: "",
		}

		if params.Search != "" {
			t.Errorf("expected empty Search, got %v", params.Search)
		}
	})

	t.Run("calculateOffset helper concept", func(t *testing.T) {
		page := 3
		limit := 10
		expectedOffset := (page - 1) * limit

		params := FilterRequestParams{
			Page:   page,
			Limit:  limit,
			Offset: expectedOffset,
		}

		if params.Offset != 20 {
			t.Errorf("Offset calculation mismatch: got %v, want 20", params.Offset)
		}
	})
}

func TestFilterRequestParamsJSONFields(t *testing.T) {
	t.Run("fields without json tags use Go field names", func(t *testing.T) {
		params := FilterRequestParams{
			Page:   1,
			Limit:  10,
			Offset: 0,
			Search: "test",
		}

		data, err := json.Marshal(params)
		if err != nil {
			t.Fatalf("failed to marshal: %v", err)
		}

		var m map[string]interface{}
		if err := json.Unmarshal(data, &m); err != nil {
			t.Fatalf("failed to unmarshal to map: %v", err)
		}

		expectedFields := []string{"Page", "Limit", "Offset", "Search", "Other"}
		for _, field := range expectedFields {
			if _, ok := m[field]; !ok {
				t.Errorf("expected '%s' field in JSON", field)
			}
		}
	})
}
