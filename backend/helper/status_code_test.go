package helper

import (
	"testing"
)

func TestStatusCodeConstants(t *testing.T) {
	tests := []struct {
		name     string
		constant string
		expected string
	}{
		{
			name:     "StatusOk",
			constant: StatusOk,
			expected: "00",
		},
		{
			name:     "StatusCreated",
			constant: StatusCreated,
			expected: "21",
		},
		{
			name:     "StatusBadRequest",
			constant: StatusBadRequest,
			expected: "40",
		},
		{
			name:     "StatusUnauthorized",
			constant: StatusUnauthorized,
			expected: "41",
		},
		{
			name:     "StatusForbidden",
			constant: StatusForbidden,
			expected: "43",
		},
		{
			name:     "StatusNotFound",
			constant: StatusNotFound,
			expected: "44",
		},
		{
			name:     "StatusMethodNotAllowed",
			constant: StatusMethodNotAllowed,
			expected: "45",
		},
		{
			name:     "StatusRequestTimeout",
			constant: StatusRequestTimeout,
			expected: "48",
		},
		{
			name:     "StatusUnprocessableEntity",
			constant: StatusUnprocessableEntity,
			expected: "42",
		},
		{
			name:     "StatusTooManyRequests",
			constant: StatusTooManyRequests,
			expected: "49",
		},
		{
			name:     "StatusInternalServerError",
			constant: StatusInternalServerError,
			expected: "50",
		},
		{
			name:     "StatusBadGateway",
			constant: StatusBadGateway,
			expected: "52",
		},
		{
			name:     "StatusServiceUnavailable",
			constant: StatusServiceUnavailable,
			expected: "53",
		},
		{
			name:     "StatusGatewayTimeout",
			constant: StatusGatewayTimeout,
			expected: "54",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.constant != tt.expected {
				t.Errorf("%s = %v, want %v", tt.name, tt.constant, tt.expected)
			}
		})
	}
}

func TestStatusOk(t *testing.T) {
	if StatusOk != "00" {
		t.Errorf("StatusOk = %v, want %v", StatusOk, "00")
	}
}

func TestStatusCreated(t *testing.T) {
	if StatusCreated != "21" {
		t.Errorf("StatusCreated = %v, want %v", StatusCreated, "21")
	}
}

func TestStatusBadRequest(t *testing.T) {
	if StatusBadRequest != "40" {
		t.Errorf("StatusBadRequest = %v, want %v", StatusBadRequest, "40")
	}
}

func TestStatusUnauthorized(t *testing.T) {
	if StatusUnauthorized != "41" {
		t.Errorf("StatusUnauthorized = %v, want %v", StatusUnauthorized, "41")
	}
}

func TestStatusForbidden(t *testing.T) {
	if StatusForbidden != "43" {
		t.Errorf("StatusForbidden = %v, want %v", StatusForbidden, "43")
	}
}

func TestStatusNotFound(t *testing.T) {
	if StatusNotFound != "44" {
		t.Errorf("StatusNotFound = %v, want %v", StatusNotFound, "44")
	}
}

func TestStatusMethodNotAllowed(t *testing.T) {
	if StatusMethodNotAllowed != "45" {
		t.Errorf("StatusMethodNotAllowed = %v, want %v", StatusMethodNotAllowed, "45")
	}
}

func TestStatusRequestTimeout(t *testing.T) {
	if StatusRequestTimeout != "48" {
		t.Errorf("StatusRequestTimeout = %v, want %v", StatusRequestTimeout, "48")
	}
}

func TestStatusUnprocessableEntity(t *testing.T) {
	if StatusUnprocessableEntity != "42" {
		t.Errorf("StatusUnprocessableEntity = %v, want %v", StatusUnprocessableEntity, "42")
	}
}

func TestStatusTooManyRequests(t *testing.T) {
	if StatusTooManyRequests != "49" {
		t.Errorf("StatusTooManyRequests = %v, want %v", StatusTooManyRequests, "49")
	}
}

func TestStatusInternalServerError(t *testing.T) {
	if StatusInternalServerError != "50" {
		t.Errorf("StatusInternalServerError = %v, want %v", StatusInternalServerError, "50")
	}
}

func TestStatusBadGateway(t *testing.T) {
	if StatusBadGateway != "52" {
		t.Errorf("StatusBadGateway = %v, want %v", StatusBadGateway, "52")
	}
}

func TestStatusServiceUnavailable(t *testing.T) {
	if StatusServiceUnavailable != "53" {
		t.Errorf("StatusServiceUnavailable = %v, want %v", StatusServiceUnavailable, "53")
	}
}

func TestStatusGatewayTimeout(t *testing.T) {
	if StatusGatewayTimeout != "54" {
		t.Errorf("StatusGatewayTimeout = %v, want %v", StatusGatewayTimeout, "54")
	}
}

func TestStatusCodeTypes(t *testing.T) {
	// Verify all status codes are strings
	codes := []string{
		StatusOk,
		StatusCreated,
		StatusBadRequest,
		StatusUnauthorized,
		StatusForbidden,
		StatusNotFound,
		StatusMethodNotAllowed,
		StatusRequestTimeout,
		StatusUnprocessableEntity,
		StatusTooManyRequests,
		StatusInternalServerError,
		StatusBadGateway,
		StatusServiceUnavailable,
		StatusGatewayTimeout,
	}

	for i, code := range codes {
		if len(code) != 2 {
			t.Errorf("Status code at index %d has length %d, expected 2", i, len(code))
		}
	}
}

func TestStatusCodeUniqueness(t *testing.T) {
	codes := map[string]string{
		"StatusOk":                  StatusOk,
		"StatusCreated":             StatusCreated,
		"StatusBadRequest":          StatusBadRequest,
		"StatusUnauthorized":        StatusUnauthorized,
		"StatusForbidden":           StatusForbidden,
		"StatusNotFound":            StatusNotFound,
		"StatusMethodNotAllowed":    StatusMethodNotAllowed,
		"StatusRequestTimeout":      StatusRequestTimeout,
		"StatusUnprocessableEntity": StatusUnprocessableEntity,
		"StatusTooManyRequests":     StatusTooManyRequests,
		"StatusInternalServerError": StatusInternalServerError,
		"StatusBadGateway":          StatusBadGateway,
		"StatusServiceUnavailable":  StatusServiceUnavailable,
		"StatusGatewayTimeout":      StatusGatewayTimeout,
	}

	seen := make(map[string]string)
	for name, code := range codes {
		if existingName, exists := seen[code]; exists {
			t.Errorf("Duplicate status code %q: %s and %s", code, existingName, name)
		}
		seen[code] = name
	}
}
