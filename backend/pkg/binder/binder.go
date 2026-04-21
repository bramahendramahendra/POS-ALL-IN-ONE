package binder

import (
	"encoding/json"
	"errors"
	"io"
	"mime/multipart"
	"reflect"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

// BindJSON manually parses JSON body and extracts only fields defined in the target struct
// This avoids mass assignment vulnerabilities by explicitly mapping allowed fields
// Usage: data, err := utils.BindJSON[dto.MyRequest](c)
func BindJSON[T any](c *gin.Context) (T, error) {
	var result T

	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		return result, errors.New("failed to read request body")
	}

	if len(body) == 0 {
		return result, errors.New("request body is empty")
	}

	var rawJSON map[string]interface{}
	if err := json.Unmarshal(body, &rawJSON); err != nil {
		return result, errors.New("invalid JSON format")
	}

	if err := mapJSONToStruct(rawJSON, &result); err != nil {
		return result, err
	}

	return result, nil
}

// BindURI extracts URI parameters and maps them to the target struct
// Uses the "uri" tag to match parameter names
// Usage: data, err := utils.BindURI[dto.MyRequest](c)
func BindURI[T any](c *gin.Context) (T, error) {
	var result T

	destVal := reflect.ValueOf(&result).Elem()
	if destVal.Kind() != reflect.Struct {
		return result, errors.New("type parameter must be a struct")
	}

	destType := destVal.Type()

	for i := 0; i < destType.NumField(); i++ {
		field := destType.Field(i)
		fieldVal := destVal.Field(i)

		if !fieldVal.CanSet() {
			continue
		}

		// Get the uri tag
		tag := field.Tag.Get("uri")
		if tag == "" {
			tag = strings.ToLower(field.Name)
		}

		// Remove options like omitempty
		if idx := strings.Index(tag, ","); idx != -1 {
			tag = tag[:idx]
		}

		// Get value from URI params
		paramValue := c.Param(tag)
		if paramValue == "" {
			continue
		}

		if err := setFieldValue(fieldVal, paramValue); err != nil {
			return result, err
		}
	}

	return result, nil
}

// BindQuery extracts query parameters and maps them to the target struct
// Uses the "form" or "json" tag to match parameter names
// Usage: data, err := utils.BindQuery[dto.MyRequest](c)
func BindQuery[T any](c *gin.Context) (T, error) {
	var result T

	destVal := reflect.ValueOf(&result).Elem()
	if destVal.Kind() != reflect.Struct {
		return result, errors.New("type parameter must be a struct")
	}

	destType := destVal.Type()

	for i := 0; i < destType.NumField(); i++ {
		field := destType.Field(i)
		fieldVal := destVal.Field(i)

		if !fieldVal.CanSet() {
			continue
		}

		// Get the form tag first, then json tag as fallback
		tag := field.Tag.Get("form")
		if tag == "" {
			tag = field.Tag.Get("json")
		}
		if tag == "" {
			tag = strings.ToLower(field.Name)
		}

		// Remove omitempty and other options
		if idx := strings.Index(tag, ","); idx != -1 {
			tag = tag[:idx]
		}

		// Get value from query params
		queryValue := c.Query(tag)
		if queryValue == "" {
			continue
		}

		if err := setFieldValue(fieldVal, queryValue); err != nil {
			return result, err
		}
	}

	return result, nil
}

// BindMultipartForm extracts multipart form data and maps them to the target struct
// Uses the "form" tag to match field names
// Supports file uploads via *multipart.FileHeader fields
// Usage: data, err := utils.BindMultipartForm[dto.MyRequest](c)
func BindMultipartForm[T any](c *gin.Context) (T, error) {
	var result T

	destVal := reflect.ValueOf(&result).Elem()
	if destVal.Kind() != reflect.Struct {
		return result, errors.New("type parameter must be a struct")
	}

	// Parse multipart form with 32MB max memory
	if err := c.Request.ParseMultipartForm(32 << 20); err != nil {
		return result, errors.New("failed to parse multipart form")
	}

	destType := destVal.Type()

	for i := 0; i < destType.NumField(); i++ {
		field := destType.Field(i)
		fieldVal := destVal.Field(i)

		if !fieldVal.CanSet() {
			continue
		}

		// Get the form tag
		tag := field.Tag.Get("form")
		if tag == "" {
			tag = strings.ToLower(field.Name)
		}

		// Remove omitempty and other options
		if idx := strings.Index(tag, ","); idx != -1 {
			tag = tag[:idx]
		}

		// Handle file upload fields
		if field.Type == reflect.TypeOf((*multipart.FileHeader)(nil)) {
			file, header, err := c.Request.FormFile(tag)
			if err == nil {
				file.Close()
				fieldVal.Set(reflect.ValueOf(header))
			}
			continue
		}

		// Handle regular form fields
		formValue := c.Request.FormValue(tag)
		if formValue == "" {
			continue
		}

		if err := setFieldValue(fieldVal, formValue); err != nil {
			return result, err
		}
	}

	return result, nil
}

// mapJSONToStruct maps JSON data to a struct using reflection
// Only fields with json tags or matching names are populated
func mapJSONToStruct(data map[string]interface{}, dest interface{}) error {
	destVal := reflect.ValueOf(dest)
	if destVal.Kind() != reflect.Ptr || destVal.IsNil() {
		return errors.New("destination must be a non-nil pointer to a struct")
	}

	destVal = destVal.Elem()
	if destVal.Kind() != reflect.Struct {
		return errors.New("destination must be a pointer to a struct")
	}

	destType := destVal.Type()

	for i := 0; i < destType.NumField(); i++ {
		field := destType.Field(i)
		fieldVal := destVal.Field(i)

		if !fieldVal.CanSet() {
			continue
		}

		// Get the json tag
		tag := field.Tag.Get("json")
		if tag == "" {
			tag = strings.ToLower(field.Name)
		}

		// Remove omitempty and other options
		if idx := strings.Index(tag, ","); idx != -1 {
			tag = tag[:idx]
		}

		// Get value from JSON
		jsonValue, exists := data[tag]
		if !exists || jsonValue == nil {
			continue
		}

		if err := setFieldFromInterface(fieldVal, jsonValue); err != nil {
			return err
		}
	}

	return nil
}

// setFieldValue sets a struct field from a string value
func setFieldValue(fieldVal reflect.Value, value string) error {
	switch fieldVal.Kind() {
	case reflect.String:
		fieldVal.SetString(value)
	case reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64:
		intVal, err := strconv.ParseInt(value, 10, 64)
		if err != nil {
			return err
		}
		fieldVal.SetInt(intVal)
	case reflect.Uint, reflect.Uint8, reflect.Uint16, reflect.Uint32, reflect.Uint64:
		uintVal, err := strconv.ParseUint(value, 10, 64)
		if err != nil {
			return err
		}
		fieldVal.SetUint(uintVal)
	case reflect.Float32, reflect.Float64:
		floatVal, err := strconv.ParseFloat(value, 64)
		if err != nil {
			return err
		}
		fieldVal.SetFloat(floatVal)
	case reflect.Bool:
		boolVal, err := strconv.ParseBool(value)
		if err != nil {
			return err
		}
		fieldVal.SetBool(boolVal)
	}
	return nil
}

// setFieldFromInterface sets a struct field from an interface{} value
func setFieldFromInterface(fieldVal reflect.Value, value interface{}) error {
	switch fieldVal.Kind() {
	case reflect.String:
		if strVal, ok := value.(string); ok {
			fieldVal.SetString(strVal)
		}
	case reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64:
		switch v := value.(type) {
		case float64:
			fieldVal.SetInt(int64(v))
		case int:
			fieldVal.SetInt(int64(v))
		case int64:
			fieldVal.SetInt(v)
		case string:
			if intVal, err := strconv.ParseInt(v, 10, 64); err == nil {
				fieldVal.SetInt(intVal)
			}
		}
	case reflect.Uint, reflect.Uint8, reflect.Uint16, reflect.Uint32, reflect.Uint64:
		switch v := value.(type) {
		case float64:
			fieldVal.SetUint(uint64(v))
		case uint:
			fieldVal.SetUint(uint64(v))
		case uint64:
			fieldVal.SetUint(v)
		case string:
			if uintVal, err := strconv.ParseUint(v, 10, 64); err == nil {
				fieldVal.SetUint(uintVal)
			}
		}
	case reflect.Float32, reflect.Float64:
		switch v := value.(type) {
		case float64:
			fieldVal.SetFloat(v)
		case float32:
			fieldVal.SetFloat(float64(v))
		case string:
			if floatVal, err := strconv.ParseFloat(v, 64); err == nil {
				fieldVal.SetFloat(floatVal)
			}
		}
	case reflect.Bool:
		if boolVal, ok := value.(bool); ok {
			fieldVal.SetBool(boolVal)
		}
	case reflect.Slice:
		if slice, ok := value.([]interface{}); ok {
			sliceType := fieldVal.Type()
			newSlice := reflect.MakeSlice(sliceType, len(slice), len(slice))
			for i, item := range slice {
				setFieldFromInterface(newSlice.Index(i), item)
			}
			fieldVal.Set(newSlice)
		}
	case reflect.Map:
		if mapVal, ok := value.(map[string]interface{}); ok {
			mapType := fieldVal.Type()
			newMap := reflect.MakeMap(mapType)
			for k, v := range mapVal {
				keyVal := reflect.ValueOf(k)
				valVal := reflect.New(mapType.Elem()).Elem()
				setFieldFromInterface(valVal, v)
				newMap.SetMapIndex(keyVal, valVal)
			}
			fieldVal.Set(newMap)
		}
	case reflect.Struct:
		if mapVal, ok := value.(map[string]interface{}); ok {
			mapJSONToStruct(mapVal, fieldVal.Addr().Interface())
		}
	case reflect.Ptr:
		if value != nil {
			ptrVal := reflect.New(fieldVal.Type().Elem())
			setFieldFromInterface(ptrVal.Elem(), value)
			fieldVal.Set(ptrVal)
		}
	}
	return nil
}
