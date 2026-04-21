package validation

import (
	"mime/multipart"
	"path/filepath"
	"reflect"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/go-playground/locales/id"
	ut "github.com/go-playground/universal-translator"
	"github.com/go-playground/validator/v10"
	idTranslations "github.com/go-playground/validator/v10/translations/id"
)

type (
	CallbackValidationMessage func(validator.FieldError) string
)

var (
	Validate *validator.Validate
	ErrTrans ut.Translator
)

func init() {
	Validate = validator.New(validator.WithRequiredStructEnabled())
	Validate.RegisterTagNameFunc(func(field reflect.StructField) string {
		name := strings.SplitN(field.Tag.Get("json"), ",", 2)[0]
		if name == "-" {
			return ""
		}
		return name
	})

	idn := id.New()
	uni := ut.New(idn, idn)
	errTrans, _ := uni.GetTranslator("id")
	ErrTrans = errTrans
	idTranslations.RegisterDefaultTranslations(Validate, ErrTrans)
	Validate.RegisterTranslation("nefield", ErrTrans,
		func(ut ut.Translator) error {
			return ut.Add("nefield", "{0} tidak boleh sama dengan {1}", true)
		},
		func(ut ut.Translator, fe validator.FieldError) string {
			t, _ := ut.T("nefield", fe.Field(), fe.Param())
			return t
		},
	)

	//  Add Multipart Form File Validation
	// 1. File Size - Enhanced with unit support (MB, KB, bytes)
	Validate.RegisterValidation("maxfilesize", func(f1 validator.FieldLevel) bool {
		file, ok := f1.Field().Interface().(multipart.FileHeader)
		if !ok {
			return true
		}

		param := f1.Param()
		var maxSize int64
		var err error

		// Check if parameter has unit suffix
		paramUpper := strings.ToUpper(param)
		if strings.HasSuffix(paramUpper, "MB") {
			// Parse MB (e.g., "30MB", "1.5MB")
			sizeStr := strings.TrimSuffix(paramUpper, "MB")
			size, err := strconv.ParseFloat(sizeStr, 64)
			if err != nil {
				return false
			}
			maxSize = int64(size * 1024 * 1024) // Convert MB to bytes
		} else if strings.HasSuffix(paramUpper, "KB") {
			// Parse KB (e.g., "500KB", "1024KB")
			sizeStr := strings.TrimSuffix(paramUpper, "KB")
			size, err := strconv.ParseFloat(sizeStr, 64)
			if err != nil {
				return false
			}
			maxSize = int64(size * 1024) // Convert KB to bytes
		} else {
			// Assume bytes if no unit specified (backward compatibility)
			maxSize, err = strconv.ParseInt(param, 10, 64)
			if err != nil {
				return false
			}
		}

		return file.Size <= maxSize
	})

	AddCustomErrorMessage("maxfilesize", "{0} tidak boleh lebih besar dari {1} bytes", func(fe validator.FieldError) string {
		return fe.Param()
	})

	// 2. File Extension
	Validate.RegisterValidation("fileextension", func(f1 validator.FieldLevel) bool {
		file, ok := f1.Field().Interface().(multipart.FileHeader)
		if !ok {
			return true
		}

		allowed := strings.Split(f1.Param(), ";")
		ext := strings.ToLower(filepath.Ext(file.Filename))
		for _, v := range allowed {
			if ext == "."+strings.ToLower(strings.TrimSpace(v)) {
				return true
			}
		}

		return false
	})

	AddCustomErrorMessage("fileextension", "{0} harus memiliki ekstensi {1}", func(fe validator.FieldError) string {
		return fe.Param()
	})

	//
	// 3. Alphanumeric with space
	Validate.RegisterValidation("alphanumspace", func(f1 validator.FieldLevel) bool {
		value, ok := f1.Field().Interface().(string)
		if !ok {
			return true // ignore non-string fields
		}
		if value == "" {
			return true // let "required" handle emptiness if needed
		}

		re := regexp.MustCompile(`^[A-Za-z0-9 '"-]+$`)
		return re.MatchString(value)
	})

	AddCustomErrorMessage("alphanumspace", "{0} hanya boleh mengandung huruf, angka, dan spasi", func(fe validator.FieldError) string {
		return fe.Param()
	})

	// 4. Date Format
	Validate.RegisterValidation("dateformat", func(f1 validator.FieldLevel) bool {
		dateStr := f1.Field().String()

		// Quick regex check for format
		regex := regexp.MustCompile(`^\d{4}-\d{2}-\d{2}$`)
		if !regex.MatchString(dateStr) {
			return false
		}

		// Parse with time to ensure valid date (not 2025-02-30)
		_, err := time.Parse("2006-01-02", dateStr)
		return err == nil
	})

	AddCustomErrorMessage("dateformat", "{0} hanya boleh menggunakan format YYYY-MM-DD", func(fe validator.FieldError) string {
		return fe.Param()
	})

	// 5. Date Range Validation - Generic implementation
	// Usage: validate:"date_range_end=StartDateFieldName" or validate:"date_range_start=EndDateFieldName"
	Validate.RegisterValidation("date_range_end", func(fl validator.FieldLevel) bool {
		endDate := fl.Field().String()
		if endDate == "" {
			return true // Allow empty end date
		}

		// Get parameter (start date field name) or use default
		startFieldName := fl.Param()
		if startFieldName == "" {
			// Try common field name patterns
			fieldName := fl.FieldName()
			if strings.Contains(strings.ToLower(fieldName), "akhir") || strings.Contains(strings.ToLower(fieldName), "end") {
				startFieldName = strings.Replace(fieldName, "Akhir", "Awal", 1)
				startFieldName = strings.Replace(startFieldName, "End", "Start", 1)
			}
		}

		// Get the parent struct to access start date field
		parent := fl.Parent()
		startDateField := parent.FieldByName(startFieldName)
		if !startDateField.IsValid() {
			return true // If start field not found, skip validation
		}

		startDate := startDateField.String()
		if startDate == "" {
			return true // Allow empty start date
		}

		// Parse dates for proper chronological comparison
		startTime, err1 := time.Parse("2006-01-02", startDate)
		endTime, err2 := time.Parse("2006-01-02", endDate)

		if err1 != nil || err2 != nil {
			return false // Invalid date format
		}

		// End date must be >= start date
		return endTime.After(startTime) || endTime.Equal(startTime)
	})

	AddCustomErrorMessage("date_range_end", "{0} tidak boleh lebih awal dari tanggal awal", func(fe validator.FieldError) string {
		return ""
	})

	// 6. Date Range Start Validation (reverse validation)
	// Usage: validate:"date_range_start=EndDateFieldName"
	Validate.RegisterValidation("date_range_start", func(fl validator.FieldLevel) bool {
		startDate := fl.Field().String()
		if startDate == "" {
			return true // Allow empty start date
		}

		// Get parameter (end date field name) or use default
		endFieldName := fl.Param()
		if endFieldName == "" {
			// Try common field name patterns
			fieldName := fl.FieldName()
			if strings.Contains(strings.ToLower(fieldName), "awal") || strings.Contains(strings.ToLower(fieldName), "start") {
				endFieldName = strings.Replace(fieldName, "Awal", "Akhir", 1)
				endFieldName = strings.Replace(endFieldName, "Start", "End", 1)
			}
		}

		// Get the parent struct to access end date field
		parent := fl.Parent()
		endDateField := parent.FieldByName(endFieldName)
		if !endDateField.IsValid() {
			return true // If end field not found, skip validation
		}

		endDate := endDateField.String()
		if endDate == "" {
			return true // Allow empty end date
		}

		// Parse dates for proper chronological comparison
		startTime, err1 := time.Parse("2006-01-02", startDate)
		endTime, err2 := time.Parse("2006-01-02", endDate)

		if err1 != nil || err2 != nil {
			return false // Invalid date format
		}

		// Start date must be <= end date
		return startTime.Before(endTime) || startTime.Equal(endTime)
	})

	AddCustomErrorMessage("date_range_start", "{0} tidak boleh lebih akhir dari tanggal akhir", func(fe validator.FieldError) string {
		return ""
	})

	// 7. Required With - Both fields must be empty OR both must be filled with valid dates
	// Usage: validate:"required_with=SourceFieldName"
	// Valid scenarios: both empty, both filled with valid dates
	// Invalid scenarios: one empty + one filled, invalid date format
	Validate.RegisterValidation("required_with", func(fl validator.FieldLevel) bool {
		currentField := strings.TrimSpace(fl.Field().String())
		sourceFieldName := fl.Param()

		if sourceFieldName == "" {
			return true // No source field specified, skip validation
		}

		// Get the parent struct to access source field
		parent := fl.Parent()
		sourceField := parent.FieldByName(sourceFieldName)
		if !sourceField.IsValid() {
			return true // If source field not found, skip validation
		}

		sourceValue := strings.TrimSpace(sourceField.String())

		// Check if both fields are empty - this is valid
		if sourceValue == "" && currentField == "" {
			return true
		}

		// If one field is empty and the other is not - this is invalid
		if (sourceValue == "" && currentField != "") || (sourceValue != "" && currentField == "") {
			return false
		}

		// Both fields are non-empty, validate datetime format for current field
		regex := regexp.MustCompile(`^\d{4}-\d{2}-\d{2}$`)
		if !regex.MatchString(currentField) {
			return false
		}

		// Parse with time to ensure valid date (not 2025-02-30)
		_, err := time.Parse("2006-01-02", currentField)
		return err == nil
	})

	AddCustomErrorMessage("required_with", "{0} dan {1} harus sama-sama kosong atau sama-sama diisi dengan format YYYY-MM-DD", func(fe validator.FieldError) string {
		return fe.Param()
	})

	// 8. Fraction "x/y" format validation
	Validate.RegisterValidation("fraction", func(f1 validator.FieldLevel) bool {
		value, ok := f1.Field().Interface().(string)
		if !ok {
			return false
		}

		// Check if the value matches the fraction format
		regex := regexp.MustCompile(`^\d+/\d+$`)
		return regex.MatchString(value)
	})

	AddCustomErrorMessage("fraction", "{0} harus dalam format pecahan x/y", func(fe validator.FieldError) string {
		return fe.Field()
	})

	// 9. Decimal format validation "xx.xx" (exactly 2 decimal places)
	Validate.RegisterValidation("decimal", func(f1 validator.FieldLevel) bool {
		value, ok := f1.Field().Interface().(string)
		if !ok {
			return true // ignore non-string fields
		}
		if value == "" {
			return true // let "required" handle emptiness if needed
		}

		// Check if the value matches exactly 2 decimal places format
		regex := regexp.MustCompile(`^\d+\.\d{2}$`)
		if !regex.MatchString(value) {
			return false
		}

		// Optional: Additional validation to ensure it's a valid number
		_, err := strconv.ParseFloat(value, 64)
		return err == nil
	})

	AddCustomErrorMessage("decimal", "{0} harus dalam format desimal dengan 2 angka di belakang koma (contoh: 12.34)", func(fe validator.FieldError) string {
		return ""
	})

	// 10. Alphanumeric with dash validation
	Validate.RegisterValidation("alphanumdash", func(f1 validator.FieldLevel) bool {
		value, ok := f1.Field().Interface().(string)
		if !ok {
			return true // ignore non-string fields
		}
		if value == "" {
			return true // let "required" handle emptiness if needed
		}

		// Check if the value contains only alphanumeric characters and dashes
		regex := regexp.MustCompile(`^[A-Za-z0-9-]+$`)
		return regex.MatchString(value)
	})

	AddCustomErrorMessage("alphanumdash", "{0} hanya boleh mengandung huruf, angka, dan tanda strip (-)", func(fe validator.FieldError) string {
		return ""
	})

}

func AddCustomErrorMessage(tag string, errMessage string, cb CallbackValidationMessage) {
	registerFn := func(ut ut.Translator) error {
		return ut.Add(tag, errMessage, false)
	}
	transFn := func(ut ut.Translator, fe validator.FieldError) string {
		param := cb(fe)
		tag := fe.Tag()
		t, err := ut.T(tag, fe.Field(), param)
		if err != nil {
			return fe.(error).Error()
		}
		return t
	}

	Validate.RegisterTranslation(tag, ErrTrans, registerFn, transFn)
}
