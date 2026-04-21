package errors

import (
	"testing"
)

func TestNotFoundError_ImplementsError(t *testing.T) {
	var _ error = &NotFoundError{}
}

func TestMethodNotAllowedError_ImplementsError(t *testing.T) {
	var _ error = &MethodNotAllowedError{}
}

func TestBadRequestError_ImplementsError(t *testing.T) {
	var _ error = &BadRequestError{}
}

func TestInternalServerError_ImplementsError(t *testing.T) {
	var _ error = &InternalServerError{}
}

func TestUnauthenticatedError_ImplementsError(t *testing.T) {
	var _ error = &UnauthenticatedError{}
}

func TestUnauthorizededError_ImplementsError(t *testing.T) {
	var _ error = &UnauthorizededError{}
}

func TestValidationError_ImplementsError(t *testing.T) {
	var _ error = &ValidationError{}
}

func TestErrorTypes_ErrorMethod(t *testing.T) {
	tests := []struct {
		name     string
		err      error
		expected string
	}{
		{
			name:     "NotFoundError returns correct message",
			err:      &NotFoundError{Message: "resource not found"},
			expected: "resource not found",
		},
		{
			name:     "NotFoundError with empty message",
			err:      &NotFoundError{Message: ""},
			expected: "",
		},
		{
			name:     "MethodNotAllowedError returns correct message",
			err:      &MethodNotAllowedError{Message: "method not allowed"},
			expected: "method not allowed",
		},
		{
			name:     "MethodNotAllowedError with empty message",
			err:      &MethodNotAllowedError{Message: ""},
			expected: "",
		},
		{
			name:     "BadRequestError returns correct message",
			err:      &BadRequestError{Message: "bad request"},
			expected: "bad request",
		},
		{
			name:     "BadRequestError with empty message",
			err:      &BadRequestError{Message: ""},
			expected: "",
		},
		{
			name:     "InternalServerError returns correct message",
			err:      &InternalServerError{Message: "internal server error"},
			expected: "internal server error",
		},
		{
			name:     "InternalServerError with empty message",
			err:      &InternalServerError{Message: ""},
			expected: "",
		},
		{
			name:     "UnauthenticatedError returns correct message",
			err:      &UnauthenticatedError{Message: "unauthenticated"},
			expected: "unauthenticated",
		},
		{
			name:     "UnauthenticatedError with empty message",
			err:      &UnauthenticatedError{Message: ""},
			expected: "",
		},
		{
			name:     "UnauthorizededError returns correct message",
			err:      &UnauthorizededError{Message: "unauthorized"},
			expected: "unauthorized",
		},
		{
			name:     "UnauthorizededError with empty message",
			err:      &UnauthorizededError{Message: ""},
			expected: "",
		},
		{
			name:     "ValidationError returns correct message",
			err:      &ValidationError{Message: "validation failed"},
			expected: "validation failed",
		},
		{
			name:     "ValidationError with empty message",
			err:      &ValidationError{Message: ""},
			expected: "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := tt.err.Error(); got != tt.expected {
				t.Errorf("Error() = %v, want %v", got, tt.expected)
			}
		})
	}
}

func TestNotFoundError_Error(t *testing.T) {
	err := &NotFoundError{Message: "user not found"}
	if err.Error() != "user not found" {
		t.Errorf("Expected 'user not found', got '%s'", err.Error())
	}
}

func TestMethodNotAllowedError_Error(t *testing.T) {
	err := &MethodNotAllowedError{Message: "POST not allowed"}
	if err.Error() != "POST not allowed" {
		t.Errorf("Expected 'POST not allowed', got '%s'", err.Error())
	}
}

func TestBadRequestError_Error(t *testing.T) {
	err := &BadRequestError{Message: "invalid input"}
	if err.Error() != "invalid input" {
		t.Errorf("Expected 'invalid input', got '%s'", err.Error())
	}
}

func TestInternalServerError_Error(t *testing.T) {
	err := &InternalServerError{Message: "server crashed"}
	if err.Error() != "server crashed" {
		t.Errorf("Expected 'server crashed', got '%s'", err.Error())
	}
}

func TestUnauthenticatedError_Error(t *testing.T) {
	err := &UnauthenticatedError{Message: "not authenticated"}
	if err.Error() != "not authenticated" {
		t.Errorf("Expected 'not authenticated', got '%s'", err.Error())
	}
}

func TestUnauthorizededError_Error(t *testing.T) {
	err := &UnauthorizededError{Message: "access denied"}
	if err.Error() != "access denied" {
		t.Errorf("Expected 'access denied', got '%s'", err.Error())
	}
}

func TestValidationError_Error(t *testing.T) {
	err := &ValidationError{Message: "field required"}
	if err.Error() != "field required" {
		t.Errorf("Expected 'field required', got '%s'", err.Error())
	}
}
