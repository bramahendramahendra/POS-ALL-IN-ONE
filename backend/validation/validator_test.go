package validation

import (
	"mime/multipart"
	"testing"

	"github.com/go-playground/validator/v10"
)

// TestValidatorInitialized ensures the validator is properly initialized
func TestValidatorInitialized(t *testing.T) {
	if Validate == nil {
		t.Fatal("Validate should not be nil after init()")
	}
	if ErrTrans == nil {
		t.Fatal("ErrTrans should not be nil after init()")
	}
}

// Test struct for alphanumspace validation
type AlphanumspaceTestStruct struct {
	Name string `json:"name" validate:"alphanumspace"`
}

func TestAlphanumspaceValidation(t *testing.T) {
	tests := []struct {
		name      string
		value     string
		expectErr bool
	}{
		{"valid alphanumeric", "Hello123", false},
		{"valid with space", "Hello World 123", false},
		{"valid with single quote", "John's Name", false},
		{"valid with double quote", `Test "value"`, false},
		{"valid with dash", "Test-Value", false},
		{"empty string allowed", "", false},
		{"invalid with special char @", "test@email", true},
		{"invalid with special char #", "test#tag", true},
		{"invalid with special char !", "Hello!", true},
		{"valid numbers only", "12345", false},
		{"valid letters only", "AbCdEf", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			s := AlphanumspaceTestStruct{Name: tt.value}
			err := Validate.Struct(s)
			if tt.expectErr && err == nil {
				t.Errorf("expected error for value %q but got none", tt.value)
			}
			if !tt.expectErr && err != nil {
				t.Errorf("expected no error for value %q but got: %v", tt.value, err)
			}
		})
	}
}

// Test struct for dateformat validation
type DateformatTestStruct struct {
	Date string `json:"date" validate:"dateformat"`
}

func TestDateformatValidation(t *testing.T) {
	tests := []struct {
		name      string
		value     string
		expectErr bool
	}{
		{"valid date", "2025-01-15", false},
		{"valid leap year date", "2024-02-29", false},
		{"invalid leap year date", "2025-02-29", true},
		{"invalid format dd-mm-yyyy", "15-01-2025", true},
		{"invalid format mm/dd/yyyy", "01/15/2025", true},
		{"invalid month 13", "2025-13-01", true},
		{"invalid day 32", "2025-01-32", true},
		{"empty string fails regex", "", true},
		{"invalid format letters", "abcd-ef-gh", true},
		{"partial date", "2025-01", true},
		{"valid end of month", "2025-12-31", false},
		{"valid start of year", "2025-01-01", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			s := DateformatTestStruct{Date: tt.value}
			err := Validate.Struct(s)
			if tt.expectErr && err == nil {
				t.Errorf("expected error for value %q but got none", tt.value)
			}
			if !tt.expectErr && err != nil {
				t.Errorf("expected no error for value %q but got: %v", tt.value, err)
			}
		})
	}
}

// Test struct for date_range_end validation
type DateRangeEndTestStruct struct {
	StartDate string `json:"start_date"`
	EndDate   string `json:"end_date" validate:"date_range_end=StartDate"`
}

func TestDateRangeEndValidation(t *testing.T) {
	tests := []struct {
		name      string
		startDate string
		endDate   string
		expectErr bool
	}{
		{"valid end after start", "2025-01-01", "2025-01-15", false},
		{"valid same date", "2025-01-15", "2025-01-15", false},
		{"invalid end before start", "2025-01-15", "2025-01-01", true},
		{"empty end date allowed", "2025-01-15", "", false},
		{"empty start date allowed", "", "2025-01-15", false},
		{"both empty allowed", "", "", false},
		{"invalid date format start", "invalid", "2025-01-15", true},
		{"invalid date format end", "2025-01-01", "invalid", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			s := DateRangeEndTestStruct{StartDate: tt.startDate, EndDate: tt.endDate}
			err := Validate.Struct(s)
			if tt.expectErr && err == nil {
				t.Errorf("expected error for start=%q end=%q but got none", tt.startDate, tt.endDate)
			}
			if !tt.expectErr && err != nil {
				t.Errorf("expected no error for start=%q end=%q but got: %v", tt.startDate, tt.endDate, err)
			}
		})
	}
}

// Test struct for date_range_start validation
type DateRangeStartTestStruct struct {
	StartDate string `json:"start_date" validate:"date_range_start=EndDate"`
	EndDate   string `json:"end_date"`
}

func TestDateRangeStartValidation(t *testing.T) {
	tests := []struct {
		name      string
		startDate string
		endDate   string
		expectErr bool
	}{
		{"valid start before end", "2025-01-01", "2025-01-15", false},
		{"valid same date", "2025-01-15", "2025-01-15", false},
		{"invalid start after end", "2025-01-15", "2025-01-01", true},
		{"empty start date allowed", "", "2025-01-15", false},
		{"empty end date allowed", "2025-01-15", "", false},
		{"both empty allowed", "", "", false},
		{"invalid date format", "baddate", "2025-01-15", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			s := DateRangeStartTestStruct{StartDate: tt.startDate, EndDate: tt.endDate}
			err := Validate.Struct(s)
			if tt.expectErr && err == nil {
				t.Errorf("expected error for start=%q end=%q but got none", tt.startDate, tt.endDate)
			}
			if !tt.expectErr && err != nil {
				t.Errorf("expected no error for start=%q end=%q but got: %v", tt.startDate, tt.endDate, err)
			}
		})
	}
}

// Test struct for required_with validation
type RequiredWithTestStruct struct {
	FieldA string `json:"field_a"`
	FieldB string `json:"field_b" validate:"required_with=FieldA"`
}

func TestRequiredWithValidation(t *testing.T) {
	tests := []struct {
		name      string
		fieldA    string
		fieldB    string
		expectErr bool
	}{
		{"both empty valid", "", "", false},
		{"both filled valid date", "2025-01-01", "2025-01-02", false},
		{"field_a empty field_b filled", "", "2025-01-02", true},
		{"field_a filled field_b empty", "2025-01-01", "", true},
		{"field_b wrong format", "2025-01-01", "invalid", true},
		{"both with whitespace only treated as empty", "  ", "  ", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			s := RequiredWithTestStruct{FieldA: tt.fieldA, FieldB: tt.fieldB}
			err := Validate.Struct(s)
			if tt.expectErr && err == nil {
				t.Errorf("expected error for fieldA=%q fieldB=%q but got none", tt.fieldA, tt.fieldB)
			}
			if !tt.expectErr && err != nil {
				t.Errorf("expected no error for fieldA=%q fieldB=%q but got: %v", tt.fieldA, tt.fieldB, err)
			}
		})
	}
}

// Test struct for fraction validation
type FractionTestStruct struct {
	Value string `json:"value" validate:"fraction"`
}

func TestFractionValidation(t *testing.T) {
	tests := []struct {
		name      string
		value     string
		expectErr bool
	}{
		{"valid simple fraction", "1/2", false},
		{"valid larger numbers", "100/200", false},
		{"valid whole number fraction", "5/1", false},
		{"invalid no slash", "12", true},
		{"invalid decimal", "1.5/2", true},
		{"invalid letters", "a/b", true},
		{"invalid empty", "", true},
		{"invalid just slash", "/", true},
		{"invalid missing denominator", "1/", true},
		{"invalid missing numerator", "/2", true},
		{"valid zero numerator", "0/1", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			s := FractionTestStruct{Value: tt.value}
			err := Validate.Struct(s)
			if tt.expectErr && err == nil {
				t.Errorf("expected error for value %q but got none", tt.value)
			}
			if !tt.expectErr && err != nil {
				t.Errorf("expected no error for value %q but got: %v", tt.value, err)
			}
		})
	}
}

// Test struct for decimal validation
type DecimalTestStruct struct {
	Value string `json:"value" validate:"decimal"`
}

func TestDecimalValidation(t *testing.T) {
	tests := []struct {
		name      string
		value     string
		expectErr bool
	}{
		{"valid 2 decimal places", "12.34", false},
		{"valid zero integer", "0.50", false},
		{"valid large number", "99999.99", false},
		{"empty string allowed", "", false},
		{"invalid 1 decimal place", "12.3", true},
		{"invalid 3 decimal places", "12.345", true},
		{"invalid no decimal", "12", true},
		{"invalid letters", "ab.cd", true},
		{"invalid just dot", ".", true},
		{"valid starts with zero", "0.01", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			s := DecimalTestStruct{Value: tt.value}
			err := Validate.Struct(s)
			if tt.expectErr && err == nil {
				t.Errorf("expected error for value %q but got none", tt.value)
			}
			if !tt.expectErr && err != nil {
				t.Errorf("expected no error for value %q but got: %v", tt.value, err)
			}
		})
	}
}

// Test struct for alphanumdash validation
type AlphanumdashTestStruct struct {
	Value string `json:"value" validate:"alphanumdash"`
}

func TestAlphanumdashValidation(t *testing.T) {
	tests := []struct {
		name      string
		value     string
		expectErr bool
	}{
		{"valid alphanumeric", "abc123", false},
		{"valid with dash", "abc-123", false},
		{"valid multiple dashes", "a-b-c-1-2-3", false},
		{"empty string allowed", "", false},
		{"invalid with space", "abc 123", true},
		{"invalid with underscore", "abc_123", true},
		{"invalid with special char", "abc@123", true},
		{"valid dash only", "---", false},
		{"valid letters only", "AbCdEf", false},
		{"valid numbers only", "12345", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			s := AlphanumdashTestStruct{Value: tt.value}
			err := Validate.Struct(s)
			if tt.expectErr && err == nil {
				t.Errorf("expected error for value %q but got none", tt.value)
			}
			if !tt.expectErr && err != nil {
				t.Errorf("expected no error for value %q but got: %v", tt.value, err)
			}
		})
	}
}

// Test maxfilesize validation with different units
type MaxFileSizeTestStruct struct {
	File multipart.FileHeader `json:"file" validate:"maxfilesize=1MB"`
}

type MaxFileSizeKBTestStruct struct {
	File multipart.FileHeader `json:"file" validate:"maxfilesize=500KB"`
}

type MaxFileSizeBytesTestStruct struct {
	File multipart.FileHeader `json:"file" validate:"maxfilesize=1024"`
}

func TestMaxFileSizeValidation(t *testing.T) {
	t.Run("MB - file under limit", func(t *testing.T) {
		file := multipart.FileHeader{Filename: "test.txt", Size: 500 * 1024} // 500KB
		s := MaxFileSizeTestStruct{File: file}
		err := Validate.Struct(s)
		if err != nil {
			t.Errorf("expected no error for file under 1MB limit, got: %v", err)
		}
	})

	t.Run("MB - file at limit", func(t *testing.T) {
		file := multipart.FileHeader{Filename: "test.txt", Size: 1024 * 1024} // exactly 1MB
		s := MaxFileSizeTestStruct{File: file}
		err := Validate.Struct(s)
		if err != nil {
			t.Errorf("expected no error for file at 1MB limit, got: %v", err)
		}
	})

	t.Run("MB - file over limit", func(t *testing.T) {
		file := multipart.FileHeader{Filename: "test.txt", Size: 2 * 1024 * 1024} // 2MB
		s := MaxFileSizeTestStruct{File: file}
		err := Validate.Struct(s)
		if err == nil {
			t.Error("expected error for file over 1MB limit")
		}
	})

	t.Run("KB - file under limit", func(t *testing.T) {
		file := multipart.FileHeader{Filename: "test.txt", Size: 400 * 1024} // 400KB
		s := MaxFileSizeKBTestStruct{File: file}
		err := Validate.Struct(s)
		if err != nil {
			t.Errorf("expected no error for file under 500KB limit, got: %v", err)
		}
	})

	t.Run("KB - file over limit", func(t *testing.T) {
		file := multipart.FileHeader{Filename: "test.txt", Size: 600 * 1024} // 600KB
		s := MaxFileSizeKBTestStruct{File: file}
		err := Validate.Struct(s)
		if err == nil {
			t.Error("expected error for file over 500KB limit")
		}
	})

	t.Run("Bytes - file under limit", func(t *testing.T) {
		file := multipart.FileHeader{Filename: "test.txt", Size: 512}
		s := MaxFileSizeBytesTestStruct{File: file}
		err := Validate.Struct(s)
		if err != nil {
			t.Errorf("expected no error for file under 1024 bytes limit, got: %v", err)
		}
	})

	t.Run("Bytes - file over limit", func(t *testing.T) {
		file := multipart.FileHeader{Filename: "test.txt", Size: 2048}
		s := MaxFileSizeBytesTestStruct{File: file}
		err := Validate.Struct(s)
		if err == nil {
			t.Error("expected error for file over 1024 bytes limit")
		}
	})
}

// Test fileextension validation
type FileExtensionTestStruct struct {
	File multipart.FileHeader `json:"file" validate:"fileextension=jpg;png;pdf"`
}

func TestFileExtensionValidation(t *testing.T) {
	tests := []struct {
		name      string
		filename  string
		expectErr bool
	}{
		{"valid jpg", "photo.jpg", false},
		{"valid png", "image.png", false},
		{"valid pdf", "document.pdf", false},
		{"valid uppercase JPG", "photo.JPG", false},
		{"valid mixed case Pdf", "doc.Pdf", false},
		{"invalid gif", "animation.gif", true},
		{"invalid txt", "file.txt", true},
		{"invalid no extension", "noextension", true},
		{"valid double extension uses last", "file.txt.jpg", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			file := multipart.FileHeader{Filename: tt.filename, Size: 1024}
			s := FileExtensionTestStruct{File: file}
			err := Validate.Struct(s)
			if tt.expectErr && err == nil {
				t.Errorf("expected error for filename %q but got none", tt.filename)
			}
			if !tt.expectErr && err != nil {
				t.Errorf("expected no error for filename %q but got: %v", tt.filename, err)
			}
		})
	}
}

// Test json tag name extraction
type JSONTagTestStruct struct {
	UserName string `json:"user_name" validate:"required"`
	Email    string `json:"email,omitempty" validate:"required"`
	Ignored  string `json:"-" validate:"required"`
}

func TestJSONTagNameFunc(t *testing.T) {
	t.Run("validation errors use json tag names", func(t *testing.T) {
		s := JSONTagTestStruct{UserName: "", Email: "", Ignored: ""}
		err := Validate.Struct(s)
		if err == nil {
			t.Fatal("expected validation errors")
		}

		validationErrors, ok := err.(validator.ValidationErrors)
		if !ok {
			t.Fatal("expected validator.ValidationErrors type")
		}

		// Check that field names from json tags are used
		for _, ve := range validationErrors {
			field := ve.Field()
			if field == "UserName" {
				t.Error("expected json tag name 'user_name' but got struct field 'UserName'")
			}
			if field == "Email" {
				t.Error("expected json tag name 'email' but got struct field 'Email'")
			}
		}
	})
}

// Test error translation
func TestErrorTranslation(t *testing.T) {
	t.Run("required field translation", func(t *testing.T) {
		type TestStruct struct {
			Name string `json:"name" validate:"required"`
		}
		s := TestStruct{Name: ""}
		err := Validate.Struct(s)
		if err != nil {
			validationErrors, ok := err.(validator.ValidationErrors)
			if !ok {
				t.Fatal("expected validator.ValidationErrors type")
			}
			translated := validationErrors[0].Translate(ErrTrans)
			if translated == "" {
				t.Error("translation should not be empty")
			}
		}
	})

	t.Run("nefield translation", func(t *testing.T) {
		type TestStruct struct {
			Password        string `json:"password" validate:"required"`
			ConfirmPassword string `json:"confirm_password" validate:"nefield=Password"`
		}
		// Same password should fail nefield
		s := TestStruct{Password: "secret", ConfirmPassword: "secret"}
		err := Validate.Struct(s)
		if err != nil {
			validationErrors, ok := err.(validator.ValidationErrors)
			if !ok {
				t.Fatal("expected validator.ValidationErrors type")
			}
			for _, ve := range validationErrors {
				if ve.Tag() == "nefield" {
					translated := ve.Translate(ErrTrans)
					if translated == "" {
						t.Error("nefield translation should not be empty")
					}
				}
			}
		}
	})
}

// Test AddCustomErrorMessage function
func TestAddCustomErrorMessage(t *testing.T) {
	t.Run("custom error messages are translated", func(t *testing.T) {
		type TestStruct struct {
			Value string `json:"value" validate:"alphanumspace"`
		}
		s := TestStruct{Value: "invalid@value"}
		err := Validate.Struct(s)
		if err == nil {
			t.Fatal("expected validation error")
		}

		validationErrors, ok := err.(validator.ValidationErrors)
		if !ok {
			t.Fatal("expected validator.ValidationErrors type")
		}

		translated := validationErrors[0].Translate(ErrTrans)
		if translated == "" {
			t.Error("custom error translation should not be empty")
		}
	})

	t.Run("maxfilesize custom message with param", func(t *testing.T) {
		file := multipart.FileHeader{Filename: "test.txt", Size: 2 * 1024 * 1024}
		s := MaxFileSizeTestStruct{File: file}
		err := Validate.Struct(s)
		if err == nil {
			t.Fatal("expected validation error")
		}

		validationErrors, ok := err.(validator.ValidationErrors)
		if !ok {
			t.Fatal("expected validator.ValidationErrors type")
		}

		translated := validationErrors[0].Translate(ErrTrans)
		if translated == "" {
			t.Error("maxfilesize error translation should not be empty")
		}
	})
}

// Test auto field name inference for date_range_end
type DateRangeAutoEndTestStruct struct {
	TanggalAwal  string `json:"tanggal_awal"`
	TanggalAkhir string `json:"tanggal_akhir" validate:"date_range_end=TanggalAwal"`
}

func TestDateRangeAutoFieldInference(t *testing.T) {
	t.Run("explicit param works", func(t *testing.T) {
		s := DateRangeAutoEndTestStruct{TanggalAwal: "2025-01-15", TanggalAkhir: "2025-01-01"}
		err := Validate.Struct(s)
		if err == nil {
			t.Error("expected error for end date before start date")
		}
	})
}

// Test required_with with missing source field
type RequiredWithMissingFieldStruct struct {
	FieldB string `json:"field_b" validate:"required_with=NonExistentField"`
}

func TestRequiredWithMissingSourceField(t *testing.T) {
	t.Run("missing source field skips validation", func(t *testing.T) {
		s := RequiredWithMissingFieldStruct{FieldB: "value"}
		err := Validate.Struct(s)
		if err != nil {
			t.Errorf("expected no error when source field doesn't exist, got: %v", err)
		}
	})
}

// Test required_with with empty param
type RequiredWithEmptyParamStruct struct {
	FieldB string `json:"field_b" validate:"required_with="`
}

func TestRequiredWithEmptyParam(t *testing.T) {
	t.Run("empty param skips validation", func(t *testing.T) {
		s := RequiredWithEmptyParamStruct{FieldB: "value"}
		err := Validate.Struct(s)
		if err != nil {
			t.Errorf("expected no error when param is empty, got: %v", err)
		}
	})
}

// Test date_range_end/start with missing target field
type DateRangeMissingFieldStruct struct {
	EndDate string `json:"end_date" validate:"date_range_end=MissingField"`
}

func TestDateRangeMissingFieldValidation(t *testing.T) {
	t.Run("missing target field skips validation", func(t *testing.T) {
		s := DateRangeMissingFieldStruct{EndDate: "2025-01-15"}
		err := Validate.Struct(s)
		if err != nil {
			t.Errorf("expected no error when target field doesn't exist, got: %v", err)
		}
	})
}

// Test non-string field handling
type NonStringFieldStruct struct {
	Value int `json:"value" validate:"alphanumspace"`
}

func TestNonStringFieldHandling(t *testing.T) {
	t.Run("alphanumspace ignores non-string fields", func(t *testing.T) {
		s := NonStringFieldStruct{Value: 123}
		err := Validate.Struct(s)
		if err != nil {
			t.Errorf("expected alphanumspace to ignore non-string field, got: %v", err)
		}
	})
}

// Test non-FileHeader field handling for maxfilesize
type NonFileHeaderStruct struct {
	File string `json:"file" validate:"maxfilesize=1MB"`
}

func TestNonFileHeaderHandling(t *testing.T) {
	t.Run("maxfilesize ignores non-FileHeader fields", func(t *testing.T) {
		s := NonFileHeaderStruct{File: "not a file"}
		err := Validate.Struct(s)
		if err != nil {
			t.Errorf("expected maxfilesize to ignore non-FileHeader field, got: %v", err)
		}
	})
}

// Test combined validations
type CombinedValidationStruct struct {
	Name      string `json:"name" validate:"required,alphanumspace"`
	StartDate string `json:"start_date" validate:"required,dateformat,date_range_start=EndDate"`
	EndDate   string `json:"end_date" validate:"required,dateformat,date_range_end=StartDate"`
	Ratio     string `json:"ratio" validate:"required,fraction"`
	Amount    string `json:"amount" validate:"required,decimal"`
	Code      string `json:"code" validate:"required,alphanumdash"`
}

func TestCombinedValidations(t *testing.T) {
	t.Run("all valid", func(t *testing.T) {
		s := CombinedValidationStruct{
			Name:      "Test Name 123",
			StartDate: "2025-01-01",
			EndDate:   "2025-01-15",
			Ratio:     "1/2",
			Amount:    "99.99",
			Code:      "ABC-123",
		}
		err := Validate.Struct(s)
		if err != nil {
			t.Errorf("expected no errors for valid struct, got: %v", err)
		}
	})

	t.Run("multiple failures", func(t *testing.T) {
		s := CombinedValidationStruct{
			Name:      "Invalid@Name",
			StartDate: "2025-01-15",
			EndDate:   "2025-01-01", // before start
			Ratio:     "invalid",
			Amount:    "99.9",         // only 1 decimal
			Code:      "invalid code", // has space
		}
		err := Validate.Struct(s)
		if err == nil {
			t.Fatal("expected validation errors")
		}

		validationErrors, ok := err.(validator.ValidationErrors)
		if !ok {
			t.Fatal("expected validator.ValidationErrors type")
		}

		// Should have multiple errors
		if len(validationErrors) < 4 {
			t.Errorf("expected at least 4 validation errors, got %d", len(validationErrors))
		}
	})
}

// Test boundary conditions for maxfilesize
func TestMaxFileSizeBoundaryConditions(t *testing.T) {
	t.Run("zero size file", func(t *testing.T) {
		file := multipart.FileHeader{Filename: "empty.txt", Size: 0}
		s := MaxFileSizeTestStruct{File: file}
		err := Validate.Struct(s)
		if err != nil {
			t.Errorf("expected no error for zero size file, got: %v", err)
		}
	})

	t.Run("exactly at boundary minus one", func(t *testing.T) {
		file := multipart.FileHeader{Filename: "test.txt", Size: 1024*1024 - 1}
		s := MaxFileSizeTestStruct{File: file}
		err := Validate.Struct(s)
		if err != nil {
			t.Errorf("expected no error for file just under limit, got: %v", err)
		}
	})

	t.Run("one byte over boundary", func(t *testing.T) {
		file := multipart.FileHeader{Filename: "test.txt", Size: 1024*1024 + 1}
		s := MaxFileSizeTestStruct{File: file}
		err := Validate.Struct(s)
		if err == nil {
			t.Error("expected error for file one byte over limit")
		}
	})
}
