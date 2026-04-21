package regexp_helper

import (
	"testing"
)

func TestIsNumeric(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected bool
	}{
		{"Valid numeric", "123456", true},
		{"Valid single digit", "0", true},
		{"Valid large number", "99999999999", true},
		{"Invalid with letters", "123abc", false},
		{"Invalid with spaces", "123 456", false},
		{"Invalid empty string", "", false},
		{"Invalid with special chars", "123-456", false},
		{"Invalid with decimal", "123.45", false},
		{"Invalid negative number", "-123", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := IsNumeric(tt.input)
			if result != tt.expected {
				t.Errorf("IsNumeric(%q) = %v, want %v", tt.input, result, tt.expected)
			}
		})
	}
}

func TestIsAlpha(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected bool
	}{
		{"Valid alpha lowercase", "abcdef", true},
		{"Valid alpha uppercase", "ABCDEF", true},
		{"Valid alpha mixed", "AbCdEf", true},
		{"Valid alpha with space", "Hello World", true},
		{"Invalid with numbers", "Hello123", false},
		{"Invalid empty string", "", false},
		{"Invalid with special chars", "Hello!", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := IsAlpha(tt.input)
			if result != tt.expected {
				t.Errorf("IsAlpha(%q) = %v, want %v", tt.input, result, tt.expected)
			}
		})
	}
}

func TestIsAlphaNum(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected bool
	}{
		{"Valid alphanumeric", "abc123", true},
		{"Valid with space", "Hello 123", true},
		{"Valid only letters", "Hello", true},
		{"Valid only numbers", "12345", true},
		{"Invalid with special chars", "Hello!", false},
		{"Invalid empty string", "", false},
		{"Invalid with hyphen", "Hello-123", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := IsAlphaNum(tt.input)
			if result != tt.expected {
				t.Errorf("IsAlphaNum(%q) = %v, want %v", tt.input, result, tt.expected)
			}
		})
	}
}

func TestIsASccii(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected bool
	}{
		{"Valid ASCII", "Hello World 123!", true},
		{"Valid ASCII with special chars", "!@#$%^&*()", true},
		{"Invalid with unicode", "Hello 世界", false},
		{"Invalid with emoji", "Hello 🔐", false},
		{"Valid empty string", "", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := IsASccii(tt.input)
			if result != tt.expected {
				t.Errorf("IsASccii(%q) = %v, want %v", tt.input, result, tt.expected)
			}
		})
	}
}

func TestIsDecimal(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected bool
	}{
		{"Valid decimal", "123.45", true},
		{"Valid whole number", "123", true},
		{"Valid zero", "0", true},
		{"Valid decimal with zero", "0.00", true},
		{"Invalid empty string", "", false},
		{"Invalid with letters", "123.4a", false},
		{"Invalid multiple decimals", "123.45.67", false},
		{"Invalid negative decimal", "-123.45", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := IsDecimal(tt.input)
			if result != tt.expected {
				t.Errorf("IsDecimal(%q) = %v, want %v", tt.input, result, tt.expected)
			}
		})
	}
}

func TestIsAccountLoan(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected bool
	}{
		{"Valid account loan", "123456789011234", true},
		{"Valid account loan 2", "123456789021234", true},
		{"Invalid - wrong 12th char not 1", "12345678902234", false},
		{"Invalid - too short", "1234567890123", false},
		{"Invalid - too long", "1234567890112345", false},
		{"Invalid - with letters", "12345678901a234", false},
		{"Invalid empty string", "", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := IsAccountLoan(tt.input)
			if result != tt.expected {
				t.Errorf("IsAccountLoan(%q) = %v, want %v", tt.input, result, tt.expected)
			}
		})
	}
}

func TestIsNominal(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected bool
	}{
		{"Valid decimal nominal", "123.45", true},
		{"Valid whole number", "123", true},
		{"Valid zero", "0", true},
		{"Invalid with letters", "abc", false},
		{"Invalid empty", "", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := IsNominal(tt.input)
			if result != tt.expected {
				t.Errorf("IsNominal(%q) = %v, want %v", tt.input, result, tt.expected)
			}
		})
	}
}

func TestIsDateDMY(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected bool
	}{
		{"Valid date with slash", "25/12/2024", true},
		{"Valid date with dash", "25-12-2024", true},
		{"Valid single digit day", "5/12/2024", true},
		{"Valid single digit month", "25/2/2024", true},
		{"Invalid date - wrong order", "2024-12-25", false},
		{"Invalid date - month out of range", "25/13/2024", false},
		{"Invalid date - day out of range", "32/12/2024", false},
		{"Invalid empty string", "", false},
		{"Invalid with text", "25/Dec/2024", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := IsDateDMY(tt.input)
			if result != tt.expected {
				t.Errorf("IsDateDMY(%q) = %v, want %v", tt.input, result, tt.expected)
			}
		})
	}
}
