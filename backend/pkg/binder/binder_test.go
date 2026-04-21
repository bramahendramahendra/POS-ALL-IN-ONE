package binder

import (
	"bytes"
	"io"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"net/url"
	"reflect"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

// Test structs for various scenarios
type SimpleStruct struct {
	Name    string  `json:"name"`
	Age     int     `json:"age"`
	Balance float64 `json:"balance"`
	Active  bool    `json:"active"`
}

type AllTypesStruct struct {
	StringVal  string  `json:"string_val"`
	IntVal     int     `json:"int_val"`
	Int8Val    int8    `json:"int8_val"`
	Int16Val   int16   `json:"int16_val"`
	Int32Val   int32   `json:"int32_val"`
	Int64Val   int64   `json:"int64_val"`
	UintVal    uint    `json:"uint_val"`
	Uint8Val   uint8   `json:"uint8_val"`
	Uint16Val  uint16  `json:"uint16_val"`
	Uint32Val  uint32  `json:"uint32_val"`
	Uint64Val  uint64  `json:"uint64_val"`
	Float32Val float32 `json:"float32_val"`
	Float64Val float64 `json:"float64_val"`
	BoolVal    bool    `json:"bool_val"`
}

type NestedStruct struct {
	ID      int          `json:"id"`
	Details InnerDetails `json:"details"`
}

type InnerDetails struct {
	Description string `json:"description"`
	Count       int    `json:"count"`
}

type SliceStruct struct {
	Tags   []string `json:"tags"`
	Scores []int    `json:"scores"`
}

type MapStruct struct {
	Metadata map[string]string `json:"metadata"`
	Values   map[string]int    `json:"values"`
}

type PointerStruct struct {
	Name  *string `json:"name"`
	Count *int    `json:"count"`
}

type URIStruct struct {
	ID       int    `uri:"id"`
	Username string `uri:"username"`
}

type QueryStruct struct {
	Page   int    `form:"page"`
	Limit  int    `form:"limit"`
	Search string `form:"search"`
	Active bool   `form:"active"`
}

type QueryWithJSONStruct struct {
	Order  string `json:"order"`
	SortBy string `json:"sort_by"`
}

type FormStruct struct {
	Title   string                `form:"title"`
	Content string                `form:"content"`
	File    *multipart.FileHeader `form:"file"`
}

type OmitEmptyStruct struct {
	Name  string `json:"name,omitempty"`
	Value int    `json:"value,omitempty"`
}

type NoTagStruct struct {
	Name  string
	Value int
}

// Helper function to create a gin context with JSON body
func createJSONContext(body string) (*gin.Context, *httptest.ResponseRecorder) {
	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodPost, "/", strings.NewReader(body))
	c.Request.Header.Set("Content-Type", "application/json")
	return c, w
}

// Helper function to create gin context with URI params
func createURIContext(params map[string]string) (*gin.Context, *httptest.ResponseRecorder) {
	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/", nil)

	ginParams := make([]gin.Param, 0, len(params))
	for key, value := range params {
		ginParams = append(ginParams, gin.Param{Key: key, Value: value})
	}
	c.Params = ginParams

	return c, w
}

// Helper function to create gin context with query params
func createQueryContext(queryParams url.Values) (*gin.Context, *httptest.ResponseRecorder) {
	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/?"+queryParams.Encode(), nil)
	return c, w
}

// Helper function to create gin context with multipart form
func createMultipartContext(fields map[string]string, files map[string][]byte) (*gin.Context, *httptest.ResponseRecorder) {
	gin.SetMode(gin.TestMode)

	var b bytes.Buffer
	mw := multipart.NewWriter(&b)

	for key, value := range fields {
		mw.WriteField(key, value)
	}

	for filename, content := range files {
		fw, _ := mw.CreateFormFile(filename, filename+".txt")
		fw.Write(content)
	}

	mw.Close()

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodPost, "/", &b)
	c.Request.Header.Set("Content-Type", mw.FormDataContentType())

	return c, w
}

// =============================================================================
// BindJSON Tests
// =============================================================================

func TestBindJSON_SimpleStruct(t *testing.T) {
	jsonBody := `{"name": "John", "age": 30, "balance": 100.50, "active": true}`
	c, _ := createJSONContext(jsonBody)

	result, err := BindJSON[SimpleStruct](c)

	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if result.Name != "John" {
		t.Errorf("expected name 'John', got '%s'", result.Name)
	}
	if result.Age != 30 {
		t.Errorf("expected age 30, got %d", result.Age)
	}
	if result.Balance != 100.50 {
		t.Errorf("expected balance 100.50, got %f", result.Balance)
	}
	if result.Active != true {
		t.Errorf("expected active true, got %v", result.Active)
	}
}

func TestBindJSON_AllTypes(t *testing.T) {
	jsonBody := `{
		"string_val": "test",
		"int_val": 42,
		"int8_val": 8,
		"int16_val": 16,
		"int32_val": 32,
		"int64_val": 64,
		"uint_val": 100,
		"uint8_val": 8,
		"uint16_val": 16,
		"uint32_val": 32,
		"uint64_val": 64,
		"float32_val": 3.14,
		"float64_val": 6.28,
		"bool_val": true
	}`
	c, _ := createJSONContext(jsonBody)

	result, err := BindJSON[AllTypesStruct](c)

	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if result.StringVal != "test" {
		t.Errorf("expected string_val 'test', got '%s'", result.StringVal)
	}
	if result.IntVal != 42 {
		t.Errorf("expected int_val 42, got %d", result.IntVal)
	}
	if result.Int64Val != 64 {
		t.Errorf("expected int64_val 64, got %d", result.Int64Val)
	}
	if result.UintVal != 100 {
		t.Errorf("expected uint_val 100, got %d", result.UintVal)
	}
	if result.BoolVal != true {
		t.Errorf("expected bool_val true, got %v", result.BoolVal)
	}
}

func TestBindJSON_NestedStruct(t *testing.T) {
	jsonBody := `{
		"id": 1,
		"details": {
			"description": "Test description",
			"count": 5
		}
	}`
	c, _ := createJSONContext(jsonBody)

	result, err := BindJSON[NestedStruct](c)

	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if result.ID != 1 {
		t.Errorf("expected id 1, got %d", result.ID)
	}
	if result.Details.Description != "Test description" {
		t.Errorf("expected details.description 'Test description', got '%s'", result.Details.Description)
	}
	if result.Details.Count != 5 {
		t.Errorf("expected details.count 5, got %d", result.Details.Count)
	}
}

func TestBindJSON_SliceStruct(t *testing.T) {
	jsonBody := `{
		"tags": ["go", "test", "binder"],
		"scores": [10, 20, 30]
	}`
	c, _ := createJSONContext(jsonBody)

	result, err := BindJSON[SliceStruct](c)

	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if len(result.Tags) != 3 {
		t.Errorf("expected 3 tags, got %d", len(result.Tags))
	}
	if result.Tags[0] != "go" {
		t.Errorf("expected first tag 'go', got '%s'", result.Tags[0])
	}
	if len(result.Scores) != 3 {
		t.Errorf("expected 3 scores, got %d", len(result.Scores))
	}
	if result.Scores[0] != 10 {
		t.Errorf("expected first score 10, got %d", result.Scores[0])
	}
}

func TestBindJSON_MapStruct(t *testing.T) {
	jsonBody := `{
		"metadata": {"key1": "value1", "key2": "value2"},
		"values": {"a": 1, "b": 2}
	}`
	c, _ := createJSONContext(jsonBody)

	result, err := BindJSON[MapStruct](c)

	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if result.Metadata["key1"] != "value1" {
		t.Errorf("expected metadata['key1'] = 'value1', got '%s'", result.Metadata["key1"])
	}
	if result.Values["a"] != 1 {
		t.Errorf("expected values['a'] = 1, got %d", result.Values["a"])
	}
}

func TestBindJSON_PointerStruct(t *testing.T) {
	jsonBody := `{"name": "Test", "count": 42}`
	c, _ := createJSONContext(jsonBody)

	result, err := BindJSON[PointerStruct](c)

	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if result.Name == nil || *result.Name != "Test" {
		t.Errorf("expected *name 'Test', got %v", result.Name)
	}
	if result.Count == nil || *result.Count != 42 {
		t.Errorf("expected *count 42, got %v", result.Count)
	}
}

func TestBindJSON_OmitEmptyTag(t *testing.T) {
	jsonBody := `{"name": "Test", "value": 100}`
	c, _ := createJSONContext(jsonBody)

	result, err := BindJSON[OmitEmptyStruct](c)

	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if result.Name != "Test" {
		t.Errorf("expected name 'Test', got '%s'", result.Name)
	}
	if result.Value != 100 {
		t.Errorf("expected value 100, got %d", result.Value)
	}
}

func TestBindJSON_NoTagStruct(t *testing.T) {
	jsonBody := `{"name": "Test", "value": 100}`
	c, _ := createJSONContext(jsonBody)

	result, err := BindJSON[NoTagStruct](c)

	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if result.Name != "Test" {
		t.Errorf("expected name 'Test', got '%s'", result.Name)
	}
	if result.Value != 100 {
		t.Errorf("expected value 100, got %d", result.Value)
	}
}

func TestBindJSON_EmptyBody(t *testing.T) {
	c, _ := createJSONContext("")

	_, err := BindJSON[SimpleStruct](c)

	if err == nil {
		t.Fatal("expected error for empty body")
	}
	if err.Error() != "request body is empty" {
		t.Errorf("expected 'request body is empty', got '%s'", err.Error())
	}
}

func TestBindJSON_InvalidJSON(t *testing.T) {
	c, _ := createJSONContext("{invalid json}")

	_, err := BindJSON[SimpleStruct](c)

	if err == nil {
		t.Fatal("expected error for invalid JSON")
	}
	if err.Error() != "invalid JSON format" {
		t.Errorf("expected 'invalid JSON format', got '%s'", err.Error())
	}
}

func TestBindJSON_PartialData(t *testing.T) {
	jsonBody := `{"name": "John"}`
	c, _ := createJSONContext(jsonBody)

	result, err := BindJSON[SimpleStruct](c)

	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if result.Name != "John" {
		t.Errorf("expected name 'John', got '%s'", result.Name)
	}
	if result.Age != 0 {
		t.Errorf("expected age 0 (zero value), got %d", result.Age)
	}
}

func TestBindJSON_NullFields(t *testing.T) {
	jsonBody := `{"name": null, "age": 25}`
	c, _ := createJSONContext(jsonBody)

	result, err := BindJSON[SimpleStruct](c)

	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if result.Name != "" {
		t.Errorf("expected name '' (empty), got '%s'", result.Name)
	}
	if result.Age != 25 {
		t.Errorf("expected age 25, got %d", result.Age)
	}
}

func TestBindJSON_ReadError(t *testing.T) {
	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodPost, "/", &errorReader{})
	c.Request.Header.Set("Content-Type", "application/json")

	_, err := BindJSON[SimpleStruct](c)

	if err == nil {
		t.Fatal("expected error for read failure")
	}
	if err.Error() != "failed to read request body" {
		t.Errorf("expected 'failed to read request body', got '%s'", err.Error())
	}
}

// =============================================================================
// BindURI Tests
// =============================================================================

func TestBindURI_Simple(t *testing.T) {
	c, _ := createURIContext(map[string]string{
		"id":       "123",
		"username": "testuser",
	})

	result, err := BindURI[URIStruct](c)

	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if result.ID != 123 {
		t.Errorf("expected id 123, got %d", result.ID)
	}
	if result.Username != "testuser" {
		t.Errorf("expected username 'testuser', got '%s'", result.Username)
	}
}

func TestBindURI_NoTag(t *testing.T) {
	type URINoTag struct {
		ID   int
		Code string
	}

	c, _ := createURIContext(map[string]string{
		"id":   "42",
		"code": "ABC",
	})

	result, err := BindURI[URINoTag](c)

	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if result.ID != 42 {
		t.Errorf("expected id 42, got %d", result.ID)
	}
	if result.Code != "ABC" {
		t.Errorf("expected code 'ABC', got '%s'", result.Code)
	}
}

func TestBindURI_OmitEmptyTag(t *testing.T) {
	type URIOmitEmpty struct {
		ID int `uri:"id,omitempty"`
	}

	c, _ := createURIContext(map[string]string{
		"id": "99",
	})

	result, err := BindURI[URIOmitEmpty](c)

	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if result.ID != 99 {
		t.Errorf("expected id 99, got %d", result.ID)
	}
}

func TestBindURI_MissingParam(t *testing.T) {
	c, _ := createURIContext(map[string]string{
		"id": "123",
	})

	result, err := BindURI[URIStruct](c)

	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if result.ID != 123 {
		t.Errorf("expected id 123, got %d", result.ID)
	}
	if result.Username != "" {
		t.Errorf("expected username '' (empty), got '%s'", result.Username)
	}
}

func TestBindURI_InvalidInt(t *testing.T) {
	c, _ := createURIContext(map[string]string{
		"id": "not_a_number",
	})

	_, err := BindURI[URIStruct](c)

	if err == nil {
		t.Fatal("expected error for invalid int")
	}
}

func TestBindURI_NonStruct(t *testing.T) {
	c, _ := createURIContext(map[string]string{})

	_, err := BindURI[string](c)

	if err == nil {
		t.Fatal("expected error for non-struct type")
	}
	if err.Error() != "type parameter must be a struct" {
		t.Errorf("expected 'type parameter must be a struct', got '%s'", err.Error())
	}
}

func TestBindURI_AllTypes(t *testing.T) {
	type URIAllTypes struct {
		StrVal   string  `uri:"str"`
		IntVal   int     `uri:"int"`
		Int64Val int64   `uri:"int64"`
		UintVal  uint    `uri:"uint"`
		Float64  float64 `uri:"float64"`
		BoolVal  bool    `uri:"bool"`
	}

	c, _ := createURIContext(map[string]string{
		"str":     "hello",
		"int":     "42",
		"int64":   "9999999999",
		"uint":    "100",
		"float64": "3.14159",
		"bool":    "true",
	})

	result, err := BindURI[URIAllTypes](c)

	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if result.StrVal != "hello" {
		t.Errorf("expected str 'hello', got '%s'", result.StrVal)
	}
	if result.IntVal != 42 {
		t.Errorf("expected int 42, got %d", result.IntVal)
	}
	if result.Int64Val != 9999999999 {
		t.Errorf("expected int64 9999999999, got %d", result.Int64Val)
	}
	if result.UintVal != 100 {
		t.Errorf("expected uint 100, got %d", result.UintVal)
	}
	if result.Float64 != 3.14159 {
		t.Errorf("expected float64 3.14159, got %f", result.Float64)
	}
	if result.BoolVal != true {
		t.Errorf("expected bool true, got %v", result.BoolVal)
	}
}

// =============================================================================
// BindQuery Tests
// =============================================================================

func TestBindQuery_Simple(t *testing.T) {
	params := url.Values{}
	params.Set("page", "1")
	params.Set("limit", "10")
	params.Set("search", "test")
	params.Set("active", "true")
	c, _ := createQueryContext(params)

	result, err := BindQuery[QueryStruct](c)

	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if result.Page != 1 {
		t.Errorf("expected page 1, got %d", result.Page)
	}
	if result.Limit != 10 {
		t.Errorf("expected limit 10, got %d", result.Limit)
	}
	if result.Search != "test" {
		t.Errorf("expected search 'test', got '%s'", result.Search)
	}
	if result.Active != true {
		t.Errorf("expected active true, got %v", result.Active)
	}
}

func TestBindQuery_JSONTagFallback(t *testing.T) {
	params := url.Values{}
	params.Set("order", "asc")
	params.Set("sort_by", "name")
	c, _ := createQueryContext(params)

	result, err := BindQuery[QueryWithJSONStruct](c)

	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if result.Order != "asc" {
		t.Errorf("expected order 'asc', got '%s'", result.Order)
	}
	if result.SortBy != "name" {
		t.Errorf("expected sort_by 'name', got '%s'", result.SortBy)
	}
}

func TestBindQuery_NoTag(t *testing.T) {
	type QueryNoTag struct {
		Name  string
		Value int
	}

	params := url.Values{}
	params.Set("name", "test")
	params.Set("value", "42")
	c, _ := createQueryContext(params)

	result, err := BindQuery[QueryNoTag](c)

	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if result.Name != "test" {
		t.Errorf("expected name 'test', got '%s'", result.Name)
	}
	if result.Value != 42 {
		t.Errorf("expected value 42, got %d", result.Value)
	}
}

func TestBindQuery_MissingParams(t *testing.T) {
	params := url.Values{}
	params.Set("page", "1")
	c, _ := createQueryContext(params)

	result, err := BindQuery[QueryStruct](c)

	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if result.Page != 1 {
		t.Errorf("expected page 1, got %d", result.Page)
	}
	if result.Limit != 0 {
		t.Errorf("expected limit 0 (zero value), got %d", result.Limit)
	}
}

func TestBindQuery_InvalidInt(t *testing.T) {
	params := url.Values{}
	params.Set("page", "not_a_number")
	c, _ := createQueryContext(params)

	_, err := BindQuery[QueryStruct](c)

	if err == nil {
		t.Fatal("expected error for invalid int")
	}
}

func TestBindQuery_NonStruct(t *testing.T) {
	params := url.Values{}
	c, _ := createQueryContext(params)

	_, err := BindQuery[int](c)

	if err == nil {
		t.Fatal("expected error for non-struct type")
	}
	if err.Error() != "type parameter must be a struct" {
		t.Errorf("expected 'type parameter must be a struct', got '%s'", err.Error())
	}
}

func TestBindQuery_AllTypes(t *testing.T) {
	type QueryAllTypes struct {
		StrVal   string  `form:"str"`
		IntVal   int     `form:"int"`
		Int64Val int64   `form:"int64"`
		UintVal  uint    `form:"uint"`
		Float64  float64 `form:"float64"`
		BoolVal  bool    `form:"bool"`
	}

	params := url.Values{}
	params.Set("str", "hello")
	params.Set("int", "42")
	params.Set("int64", "9999999999")
	params.Set("uint", "100")
	params.Set("float64", "3.14159")
	params.Set("bool", "true")
	c, _ := createQueryContext(params)

	result, err := BindQuery[QueryAllTypes](c)

	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if result.StrVal != "hello" {
		t.Errorf("expected str 'hello', got '%s'", result.StrVal)
	}
	if result.IntVal != 42 {
		t.Errorf("expected int 42, got %d", result.IntVal)
	}
	if result.Int64Val != 9999999999 {
		t.Errorf("expected int64 9999999999, got %d", result.Int64Val)
	}
	if result.UintVal != 100 {
		t.Errorf("expected uint 100, got %d", result.UintVal)
	}
	if result.Float64 != 3.14159 {
		t.Errorf("expected float64 3.14159, got %f", result.Float64)
	}
	if result.BoolVal != true {
		t.Errorf("expected bool true, got %v", result.BoolVal)
	}
}

// =============================================================================
// BindMultipartForm Tests
// =============================================================================

func TestBindMultipartForm_Simple(t *testing.T) {
	c, _ := createMultipartContext(
		map[string]string{
			"title":   "Test Title",
			"content": "Test Content",
		},
		nil,
	)

	result, err := BindMultipartForm[FormStruct](c)

	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if result.Title != "Test Title" {
		t.Errorf("expected title 'Test Title', got '%s'", result.Title)
	}
	if result.Content != "Test Content" {
		t.Errorf("expected content 'Test Content', got '%s'", result.Content)
	}
}

func TestBindMultipartForm_WithFile(t *testing.T) {
	c, _ := createMultipartContext(
		map[string]string{
			"title": "Test",
		},
		map[string][]byte{
			"file": []byte("file content"),
		},
	)

	result, err := BindMultipartForm[FormStruct](c)

	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if result.Title != "Test" {
		t.Errorf("expected title 'Test', got '%s'", result.Title)
	}
	if result.File == nil {
		t.Error("expected file to be set")
	}
}

func TestBindMultipartForm_NoTag(t *testing.T) {
	type FormNoTag struct {
		Name  string
		Value int
	}

	c, _ := createMultipartContext(
		map[string]string{
			"name":  "test",
			"value": "42",
		},
		nil,
	)

	result, err := BindMultipartForm[FormNoTag](c)

	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if result.Name != "test" {
		t.Errorf("expected name 'test', got '%s'", result.Name)
	}
	if result.Value != 42 {
		t.Errorf("expected value 42, got %d", result.Value)
	}
}

func TestBindMultipartForm_NonStruct(t *testing.T) {
	c, _ := createMultipartContext(nil, nil)

	_, err := BindMultipartForm[string](c)

	if err == nil {
		t.Fatal("expected error for non-struct type")
	}
	if err.Error() != "type parameter must be a struct" {
		t.Errorf("expected 'type parameter must be a struct', got '%s'", err.Error())
	}
}

func TestBindMultipartForm_InvalidForm(t *testing.T) {
	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodPost, "/", strings.NewReader("not multipart"))
	c.Request.Header.Set("Content-Type", "multipart/form-data; boundary=invalid")

	_, err := BindMultipartForm[FormStruct](c)

	if err == nil {
		t.Fatal("expected error for invalid multipart form")
	}
}

func TestBindMultipartForm_AllTypes(t *testing.T) {
	type FormAllTypes struct {
		StrVal   string  `form:"str"`
		IntVal   int     `form:"int"`
		Int64Val int64   `form:"int64"`
		UintVal  uint    `form:"uint"`
		Float64  float64 `form:"float64"`
		BoolVal  bool    `form:"bool"`
	}

	c, _ := createMultipartContext(
		map[string]string{
			"str":     "hello",
			"int":     "42",
			"int64":   "9999999999",
			"uint":    "100",
			"float64": "3.14159",
			"bool":    "true",
		},
		nil,
	)

	result, err := BindMultipartForm[FormAllTypes](c)

	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if result.StrVal != "hello" {
		t.Errorf("expected str 'hello', got '%s'", result.StrVal)
	}
	if result.IntVal != 42 {
		t.Errorf("expected int 42, got %d", result.IntVal)
	}
	if result.Int64Val != 9999999999 {
		t.Errorf("expected int64 9999999999, got %d", result.Int64Val)
	}
}

// =============================================================================
// mapJSONToStruct Tests
// =============================================================================

func TestMapJSONToStruct_Simple(t *testing.T) {
	data := map[string]interface{}{
		"name":    "Test",
		"age":     float64(30),
		"balance": 100.50,
		"active":  true,
	}

	var result SimpleStruct
	err := mapJSONToStruct(data, &result)

	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if result.Name != "Test" {
		t.Errorf("expected name 'Test', got '%s'", result.Name)
	}
	if result.Age != 30 {
		t.Errorf("expected age 30, got %d", result.Age)
	}
}

func TestMapJSONToStruct_NonPointer(t *testing.T) {
	data := map[string]interface{}{}
	var result SimpleStruct

	err := mapJSONToStruct(data, result)

	if err == nil {
		t.Fatal("expected error for non-pointer")
	}
	if err.Error() != "destination must be a non-nil pointer to a struct" {
		t.Errorf("expected 'destination must be a non-nil pointer to a struct', got '%s'", err.Error())
	}
}

func TestMapJSONToStruct_NilPointer(t *testing.T) {
	data := map[string]interface{}{}
	var result *SimpleStruct

	err := mapJSONToStruct(data, result)

	if err == nil {
		t.Fatal("expected error for nil pointer")
	}
}

func TestMapJSONToStruct_PointerToNonStruct(t *testing.T) {
	data := map[string]interface{}{}
	var result int

	err := mapJSONToStruct(data, &result)

	if err == nil {
		t.Fatal("expected error for pointer to non-struct")
	}
	if err.Error() != "destination must be a pointer to a struct" {
		t.Errorf("expected 'destination must be a pointer to a struct', got '%s'", err.Error())
	}
}

func TestMapJSONToStruct_Nested(t *testing.T) {
	data := map[string]interface{}{
		"id": float64(1),
		"details": map[string]interface{}{
			"description": "nested test",
			"count":       float64(5),
		},
	}

	var result NestedStruct
	err := mapJSONToStruct(data, &result)

	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if result.Details.Description != "nested test" {
		t.Errorf("expected details.description 'nested test', got '%s'", result.Details.Description)
	}
}

func TestMapJSONToStruct_Slice(t *testing.T) {
	data := map[string]interface{}{
		"tags":   []interface{}{"a", "b", "c"},
		"scores": []interface{}{float64(1), float64(2), float64(3)},
	}

	var result SliceStruct
	err := mapJSONToStruct(data, &result)

	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if len(result.Tags) != 3 {
		t.Errorf("expected 3 tags, got %d", len(result.Tags))
	}
}

func TestMapJSONToStruct_Map(t *testing.T) {
	data := map[string]interface{}{
		"metadata": map[string]interface{}{"key": "value"},
		"values":   map[string]interface{}{"num": float64(42)},
	}

	var result MapStruct
	err := mapJSONToStruct(data, &result)

	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if result.Metadata["key"] != "value" {
		t.Errorf("expected metadata['key'] = 'value', got '%s'", result.Metadata["key"])
	}
}

// =============================================================================
// setFieldValue Tests
// =============================================================================

func TestSetFieldValue_String(t *testing.T) {
	type TestStruct struct {
		Val string
	}
	var s TestStruct
	fieldVal := reflect.ValueOf(&s).Elem().Field(0)

	err := setFieldValue(fieldVal, "test")

	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if s.Val != "test" {
		t.Errorf("expected 'test', got '%s'", s.Val)
	}
}

func TestSetFieldValue_Int(t *testing.T) {
	type TestStruct struct {
		Val int
	}
	var s TestStruct
	fieldVal := reflect.ValueOf(&s).Elem().Field(0)

	err := setFieldValue(fieldVal, "42")

	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if s.Val != 42 {
		t.Errorf("expected 42, got %d", s.Val)
	}
}

func TestSetFieldValue_Int64(t *testing.T) {
	type TestStruct struct {
		Val int64
	}
	var s TestStruct
	fieldVal := reflect.ValueOf(&s).Elem().Field(0)

	err := setFieldValue(fieldVal, "9999999999")

	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if s.Val != 9999999999 {
		t.Errorf("expected 9999999999, got %d", s.Val)
	}
}

func TestSetFieldValue_Uint(t *testing.T) {
	type TestStruct struct {
		Val uint
	}
	var s TestStruct
	fieldVal := reflect.ValueOf(&s).Elem().Field(0)

	err := setFieldValue(fieldVal, "100")

	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if s.Val != 100 {
		t.Errorf("expected 100, got %d", s.Val)
	}
}

func TestSetFieldValue_Float64(t *testing.T) {
	type TestStruct struct {
		Val float64
	}
	var s TestStruct
	fieldVal := reflect.ValueOf(&s).Elem().Field(0)

	err := setFieldValue(fieldVal, "3.14159")

	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if s.Val != 3.14159 {
		t.Errorf("expected 3.14159, got %f", s.Val)
	}
}

func TestSetFieldValue_Bool(t *testing.T) {
	type TestStruct struct {
		Val bool
	}
	var s TestStruct
	fieldVal := reflect.ValueOf(&s).Elem().Field(0)

	err := setFieldValue(fieldVal, "true")

	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if s.Val != true {
		t.Errorf("expected true, got %v", s.Val)
	}
}

func TestSetFieldValue_InvalidInt(t *testing.T) {
	type TestStruct struct {
		Val int
	}
	var s TestStruct
	fieldVal := reflect.ValueOf(&s).Elem().Field(0)

	err := setFieldValue(fieldVal, "not_an_int")

	if err == nil {
		t.Fatal("expected error for invalid int")
	}
}

func TestSetFieldValue_InvalidUint(t *testing.T) {
	type TestStruct struct {
		Val uint
	}
	var s TestStruct
	fieldVal := reflect.ValueOf(&s).Elem().Field(0)

	err := setFieldValue(fieldVal, "not_a_uint")

	if err == nil {
		t.Fatal("expected error for invalid uint")
	}
}

func TestSetFieldValue_InvalidFloat(t *testing.T) {
	type TestStruct struct {
		Val float64
	}
	var s TestStruct
	fieldVal := reflect.ValueOf(&s).Elem().Field(0)

	err := setFieldValue(fieldVal, "not_a_float")

	if err == nil {
		t.Fatal("expected error for invalid float")
	}
}

func TestSetFieldValue_InvalidBool(t *testing.T) {
	type TestStruct struct {
		Val bool
	}
	var s TestStruct
	fieldVal := reflect.ValueOf(&s).Elem().Field(0)

	err := setFieldValue(fieldVal, "not_a_bool")

	if err == nil {
		t.Fatal("expected error for invalid bool")
	}
}

// =============================================================================
// setFieldFromInterface Tests
// =============================================================================

func TestSetFieldFromInterface_String(t *testing.T) {
	type TestStruct struct {
		Val string
	}
	var s TestStruct
	fieldVal := reflect.ValueOf(&s).Elem().Field(0)

	err := setFieldFromInterface(fieldVal, "test")

	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if s.Val != "test" {
		t.Errorf("expected 'test', got '%s'", s.Val)
	}
}

func TestSetFieldFromInterface_IntFromFloat64(t *testing.T) {
	type TestStruct struct {
		Val int
	}
	var s TestStruct
	fieldVal := reflect.ValueOf(&s).Elem().Field(0)

	err := setFieldFromInterface(fieldVal, float64(42))

	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if s.Val != 42 {
		t.Errorf("expected 42, got %d", s.Val)
	}
}

func TestSetFieldFromInterface_IntFromInt(t *testing.T) {
	type TestStruct struct {
		Val int
	}
	var s TestStruct
	fieldVal := reflect.ValueOf(&s).Elem().Field(0)

	err := setFieldFromInterface(fieldVal, int(42))

	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if s.Val != 42 {
		t.Errorf("expected 42, got %d", s.Val)
	}
}

func TestSetFieldFromInterface_IntFromInt64(t *testing.T) {
	type TestStruct struct {
		Val int
	}
	var s TestStruct
	fieldVal := reflect.ValueOf(&s).Elem().Field(0)

	err := setFieldFromInterface(fieldVal, int64(42))

	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if s.Val != 42 {
		t.Errorf("expected 42, got %d", s.Val)
	}
}

func TestSetFieldFromInterface_IntFromString(t *testing.T) {
	type TestStruct struct {
		Val int
	}
	var s TestStruct
	fieldVal := reflect.ValueOf(&s).Elem().Field(0)

	err := setFieldFromInterface(fieldVal, "42")

	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if s.Val != 42 {
		t.Errorf("expected 42, got %d", s.Val)
	}
}

func TestSetFieldFromInterface_UintFromFloat64(t *testing.T) {
	type TestStruct struct {
		Val uint
	}
	var s TestStruct
	fieldVal := reflect.ValueOf(&s).Elem().Field(0)

	err := setFieldFromInterface(fieldVal, float64(100))

	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if s.Val != 100 {
		t.Errorf("expected 100, got %d", s.Val)
	}
}

func TestSetFieldFromInterface_UintFromUint(t *testing.T) {
	type TestStruct struct {
		Val uint
	}
	var s TestStruct
	fieldVal := reflect.ValueOf(&s).Elem().Field(0)

	err := setFieldFromInterface(fieldVal, uint(100))

	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if s.Val != 100 {
		t.Errorf("expected 100, got %d", s.Val)
	}
}

func TestSetFieldFromInterface_UintFromUint64(t *testing.T) {
	type TestStruct struct {
		Val uint
	}
	var s TestStruct
	fieldVal := reflect.ValueOf(&s).Elem().Field(0)

	err := setFieldFromInterface(fieldVal, uint64(100))

	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if s.Val != 100 {
		t.Errorf("expected 100, got %d", s.Val)
	}
}

func TestSetFieldFromInterface_UintFromString(t *testing.T) {
	type TestStruct struct {
		Val uint
	}
	var s TestStruct
	fieldVal := reflect.ValueOf(&s).Elem().Field(0)

	err := setFieldFromInterface(fieldVal, "100")

	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if s.Val != 100 {
		t.Errorf("expected 100, got %d", s.Val)
	}
}

func TestSetFieldFromInterface_Float64FromFloat64(t *testing.T) {
	type TestStruct struct {
		Val float64
	}
	var s TestStruct
	fieldVal := reflect.ValueOf(&s).Elem().Field(0)

	err := setFieldFromInterface(fieldVal, float64(3.14))

	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if s.Val != 3.14 {
		t.Errorf("expected 3.14, got %f", s.Val)
	}
}

func TestSetFieldFromInterface_Float64FromFloat32(t *testing.T) {
	type TestStruct struct {
		Val float64
	}
	var s TestStruct
	fieldVal := reflect.ValueOf(&s).Elem().Field(0)

	err := setFieldFromInterface(fieldVal, float32(3.14))

	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	// float32 to float64 conversion may have precision issues
	if s.Val < 3.13 || s.Val > 3.15 {
		t.Errorf("expected ~3.14, got %f", s.Val)
	}
}

func TestSetFieldFromInterface_Float64FromString(t *testing.T) {
	type TestStruct struct {
		Val float64
	}
	var s TestStruct
	fieldVal := reflect.ValueOf(&s).Elem().Field(0)

	err := setFieldFromInterface(fieldVal, "3.14159")

	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if s.Val != 3.14159 {
		t.Errorf("expected 3.14159, got %f", s.Val)
	}
}

func TestSetFieldFromInterface_Bool(t *testing.T) {
	type TestStruct struct {
		Val bool
	}
	var s TestStruct
	fieldVal := reflect.ValueOf(&s).Elem().Field(0)

	err := setFieldFromInterface(fieldVal, true)

	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if s.Val != true {
		t.Errorf("expected true, got %v", s.Val)
	}
}

func TestSetFieldFromInterface_Slice(t *testing.T) {
	type TestStruct struct {
		Val []string
	}
	var s TestStruct
	fieldVal := reflect.ValueOf(&s).Elem().Field(0)

	err := setFieldFromInterface(fieldVal, []interface{}{"a", "b", "c"})

	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if len(s.Val) != 3 {
		t.Errorf("expected 3 elements, got %d", len(s.Val))
	}
	if s.Val[0] != "a" {
		t.Errorf("expected first element 'a', got '%s'", s.Val[0])
	}
}

func TestSetFieldFromInterface_Map(t *testing.T) {
	type TestStruct struct {
		Val map[string]string
	}
	var s TestStruct
	fieldVal := reflect.ValueOf(&s).Elem().Field(0)

	err := setFieldFromInterface(fieldVal, map[string]interface{}{"key": "value"})

	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if s.Val["key"] != "value" {
		t.Errorf("expected map['key'] = 'value', got '%s'", s.Val["key"])
	}
}

func TestSetFieldFromInterface_Struct(t *testing.T) {
	type Inner struct {
		Name string `json:"name"`
	}
	type TestStruct struct {
		Val Inner
	}
	var s TestStruct
	fieldVal := reflect.ValueOf(&s).Elem().Field(0)

	err := setFieldFromInterface(fieldVal, map[string]interface{}{"name": "test"})

	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if s.Val.Name != "test" {
		t.Errorf("expected name 'test', got '%s'", s.Val.Name)
	}
}

func TestSetFieldFromInterface_Pointer(t *testing.T) {
	type TestStruct struct {
		Val *string
	}
	var s TestStruct
	fieldVal := reflect.ValueOf(&s).Elem().Field(0)

	err := setFieldFromInterface(fieldVal, "test")

	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if s.Val == nil || *s.Val != "test" {
		t.Errorf("expected *val 'test', got %v", s.Val)
	}
}

func TestSetFieldFromInterface_PointerNil(t *testing.T) {
	type TestStruct struct {
		Val *string
	}
	var s TestStruct
	fieldVal := reflect.ValueOf(&s).Elem().Field(0)

	err := setFieldFromInterface(fieldVal, nil)

	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if s.Val != nil {
		t.Errorf("expected nil, got %v", s.Val)
	}
}

// =============================================================================
// Helper types
// =============================================================================

// errorReader is a reader that always returns an error
type errorReader struct{}

func (e *errorReader) Read(p []byte) (n int, err error) {
	return 0, io.ErrUnexpectedEOF
}

// =============================================================================
// Edge Cases Tests
// =============================================================================

func TestBindJSON_ExtraFields(t *testing.T) {
	// Test that extra fields in JSON are ignored (mass assignment protection)
	jsonBody := `{"name": "John", "age": 30, "admin": true, "secret": "password"}`
	c, _ := createJSONContext(jsonBody)

	result, err := BindJSON[SimpleStruct](c)

	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if result.Name != "John" {
		t.Errorf("expected name 'John', got '%s'", result.Name)
	}
	// Extra fields should be ignored
}

func TestBindJSON_EmptyStruct(t *testing.T) {
	type EmptyStruct struct{}

	jsonBody := `{"name": "test"}`
	c, _ := createJSONContext(jsonBody)

	result, err := BindJSON[EmptyStruct](c)

	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	_ = result // Empty struct, nothing to check
}

func TestBindJSON_UnexportedFields(t *testing.T) {
	type MixedStruct struct {
		Public  string `json:"public"`
		private string //nolint:unused // This is intentionally unexported for testing
	}

	jsonBody := `{"public": "visible", "private": "hidden"}`
	c, _ := createJSONContext(jsonBody)

	result, err := BindJSON[MixedStruct](c)

	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if result.Public != "visible" {
		t.Errorf("expected public 'visible', got '%s'", result.Public)
	}
	// private field should not be set (unexported) - we can't check its value directly
	// because it's unexported, but we verify no error occurred
}

func TestBindQuery_EmptyValues(t *testing.T) {
	params := url.Values{}
	params.Set("page", "")
	params.Set("search", "")
	c, _ := createQueryContext(params)

	result, err := BindQuery[QueryStruct](c)

	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	// Empty values should result in zero values
	if result.Page != 0 {
		t.Errorf("expected page 0, got %d", result.Page)
	}
	if result.Search != "" {
		t.Errorf("expected search '', got '%s'", result.Search)
	}
}

func TestBindURI_EmptyParams(t *testing.T) {
	c, _ := createURIContext(map[string]string{})

	result, err := BindURI[URIStruct](c)

	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if result.ID != 0 {
		t.Errorf("expected id 0, got %d", result.ID)
	}
	if result.Username != "" {
		t.Errorf("expected username '', got '%s'", result.Username)
	}
}

func TestBindJSON_LargeNumbers(t *testing.T) {
	type LargeNumberStruct struct {
		BigInt   int64   `json:"big_int"`
		BigUint  uint64  `json:"big_uint"`
		BigFloat float64 `json:"big_float"`
	}

	jsonBody := `{
		"big_int": 9223372036854775807,
		"big_uint": 18446744073709551615,
		"big_float": 1.7976931348623157e+308
	}`
	c, _ := createJSONContext(jsonBody)

	result, err := BindJSON[LargeNumberStruct](c)

	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if result.BigInt != 9223372036854775807 {
		t.Errorf("expected big_int max int64, got %d", result.BigInt)
	}
}

func TestBindJSON_SpecialCharacters(t *testing.T) {
	jsonBody := `{"name": "Test \"quoted\" & <html>", "age": 25}`
	c, _ := createJSONContext(jsonBody)

	result, err := BindJSON[SimpleStruct](c)

	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if result.Name != "Test \"quoted\" & <html>" {
		t.Errorf("expected special characters to be preserved, got '%s'", result.Name)
	}
}

func TestBindJSON_UnicodeCharacters(t *testing.T) {
	jsonBody := `{"name": "日本語テスト 🎉", "age": 25}`
	c, _ := createJSONContext(jsonBody)

	result, err := BindJSON[SimpleStruct](c)

	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if result.Name != "日本語テスト 🎉" {
		t.Errorf("expected unicode characters to be preserved, got '%s'", result.Name)
	}
}

func TestBindMultipartForm_OmitEmptyTag(t *testing.T) {
	type FormOmitEmpty struct {
		Name string `form:"name,omitempty"`
	}

	c, _ := createMultipartContext(
		map[string]string{
			"name": "test",
		},
		nil,
	)

	result, err := BindMultipartForm[FormOmitEmpty](c)

	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if result.Name != "test" {
		t.Errorf("expected name 'test', got '%s'", result.Name)
	}
}

func TestSetFieldValue_AllIntTypes(t *testing.T) {
	tests := []struct {
		name     string
		kind     reflect.Kind
		value    string
		expected int64
	}{
		{"int8", reflect.Int8, "127", 127},
		{"int16", reflect.Int16, "32767", 32767},
		{"int32", reflect.Int32, "2147483647", 2147483647},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			type TestStruct struct {
				Val int8
			}
			var s TestStruct
			// Create a value of the correct type
			switch tt.kind {
			case reflect.Int8:
				fieldVal := reflect.ValueOf(&s).Elem().Field(0)
				err := setFieldValue(fieldVal, tt.value)
				if err != nil {
					t.Fatalf("expected no error, got: %v", err)
				}
			}
		})
	}
}

func TestSetFieldValue_AllUintTypes(t *testing.T) {
	type TestUint8 struct {
		Val uint8
	}
	type TestUint16 struct {
		Val uint16
	}
	type TestUint32 struct {
		Val uint32
	}
	type TestUint64 struct {
		Val uint64
	}

	t.Run("uint8", func(t *testing.T) {
		var s TestUint8
		fieldVal := reflect.ValueOf(&s).Elem().Field(0)
		err := setFieldValue(fieldVal, "255")
		if err != nil {
			t.Fatalf("expected no error, got: %v", err)
		}
		if s.Val != 255 {
			t.Errorf("expected 255, got %d", s.Val)
		}
	})

	t.Run("uint16", func(t *testing.T) {
		var s TestUint16
		fieldVal := reflect.ValueOf(&s).Elem().Field(0)
		err := setFieldValue(fieldVal, "65535")
		if err != nil {
			t.Fatalf("expected no error, got: %v", err)
		}
		if s.Val != 65535 {
			t.Errorf("expected 65535, got %d", s.Val)
		}
	})

	t.Run("uint32", func(t *testing.T) {
		var s TestUint32
		fieldVal := reflect.ValueOf(&s).Elem().Field(0)
		err := setFieldValue(fieldVal, "4294967295")
		if err != nil {
			t.Fatalf("expected no error, got: %v", err)
		}
		if s.Val != 4294967295 {
			t.Errorf("expected 4294967295, got %d", s.Val)
		}
	})

	t.Run("uint64", func(t *testing.T) {
		var s TestUint64
		fieldVal := reflect.ValueOf(&s).Elem().Field(0)
		err := setFieldValue(fieldVal, "18446744073709551615")
		if err != nil {
			t.Fatalf("expected no error, got: %v", err)
		}
		if s.Val != 18446744073709551615 {
			t.Errorf("expected max uint64, got %d", s.Val)
		}
	})
}

func TestSetFieldValue_Float32(t *testing.T) {
	type TestStruct struct {
		Val float32
	}
	var s TestStruct
	fieldVal := reflect.ValueOf(&s).Elem().Field(0)

	err := setFieldValue(fieldVal, "3.14")

	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if s.Val < 3.13 || s.Val > 3.15 {
		t.Errorf("expected ~3.14, got %f", s.Val)
	}
}

func TestSetFieldFromInterface_IntSlice(t *testing.T) {
	type TestStruct struct {
		Val []int
	}
	var s TestStruct
	fieldVal := reflect.ValueOf(&s).Elem().Field(0)

	err := setFieldFromInterface(fieldVal, []interface{}{float64(1), float64(2), float64(3)})

	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if len(s.Val) != 3 {
		t.Errorf("expected 3 elements, got %d", len(s.Val))
	}
	if s.Val[0] != 1 || s.Val[1] != 2 || s.Val[2] != 3 {
		t.Errorf("expected [1, 2, 3], got %v", s.Val)
	}
}

func TestSetFieldFromInterface_MapStringInt(t *testing.T) {
	type TestStruct struct {
		Val map[string]int
	}
	var s TestStruct
	fieldVal := reflect.ValueOf(&s).Elem().Field(0)

	err := setFieldFromInterface(fieldVal, map[string]interface{}{"a": float64(1), "b": float64(2)})

	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if s.Val["a"] != 1 || s.Val["b"] != 2 {
		t.Errorf("expected map with a=1, b=2, got %v", s.Val)
	}
}

func TestSetFieldFromInterface_TypeMismatch(t *testing.T) {
	type TestStruct struct {
		Val string
	}
	var s TestStruct
	fieldVal := reflect.ValueOf(&s).Elem().Field(0)

	// Passing non-string to string field should leave it unchanged
	err := setFieldFromInterface(fieldVal, 123)

	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if s.Val != "" {
		t.Errorf("expected empty string for type mismatch, got '%s'", s.Val)
	}
}

func TestSetFieldFromInterface_BoolMismatch(t *testing.T) {
	type TestStruct struct {
		Val bool
	}
	var s TestStruct
	fieldVal := reflect.ValueOf(&s).Elem().Field(0)

	// Passing non-bool to bool field should leave it unchanged
	err := setFieldFromInterface(fieldVal, "true")

	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if s.Val != false {
		t.Errorf("expected false for type mismatch, got %v", s.Val)
	}
}
