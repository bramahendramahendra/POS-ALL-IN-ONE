package security

import (
	"fmt"
	"regexp"
	"strings"
)

// SQLSanitizer provides methods to sanitize and validate input for SQL queries
type SQLSanitizer struct{}

// NewSQLSanitizer creates a new SQLSanitizer instance
func NewSQLSanitizer() *SQLSanitizer {
	return &SQLSanitizer{}
}

// SanitizeForInClause validates and sanitizes input for SQL IN clause
// Returns error if malicious characters like %s, --, /*, */, ;, etc. are found
func (s *SQLSanitizer) SanitizeForInClause(input string) (string, error) {
	if input == "" {
		return "", fmt.Errorf("input cannot be empty")
	}

	// Check for any unescaped percent sign (%) - malicious format string characters
	if strings.Contains(input, "%") {
		return "", fmt.Errorf("security error: malicious character detected in input - percent sign (%%) is not allowed as it can be used for format string injection")
	}

	// Check for SQL injection patterns
	dangerousPatterns := []string{
		"--",          // SQL comment
		"/*",          // Multi-line comment start
		"*/",          // Multi-line comment end
		";",           // Statement terminator
		"xp_",         // Extended stored procedures
		"sp_",         // System stored procedures
		"exec ",       // Execute command
		"execute",     // Execute command
		"union",       // UNION attack
		"insert",      // INSERT attack
		"update",      // UPDATE attack
		"delete",      // DELETE attack
		"drop",        // DROP attack
		"create",      // CREATE attack
		"alter",       // ALTER attack
		"script",      // Script injection
		"<script",     // XSS attempt
		"javascript:", // XSS attempt
	}

	inputLower := strings.ToLower(input)
	for _, pattern := range dangerousPatterns {
		if strings.Contains(inputLower, pattern) {
			return "", fmt.Errorf("security error: malicious character detected in input - SQL injection pattern '%s' is not allowed", pattern)
		}
	}

	// Only allow alphanumeric, hyphen, underscore, and basic punctuation
	validPattern := regexp.MustCompile(`^[a-zA-Z0-9\-_., ]+$`)
	if !validPattern.MatchString(input) {
		return "", fmt.Errorf("security error: malicious or invalid character detected in input - only alphanumeric characters, hyphen, underscore, comma, period, and space are allowed")
	}

	return input, nil
}

// SanitizeIDs validates and sanitizes an array of IDs for SQL IN clause
// Returns sanitized IDs and error if any malicious content is found
func (s *SQLSanitizer) SanitizeIDs(ids []string) ([]string, error) {
	if len(ids) == 0 {
		return nil, fmt.Errorf("ids array cannot be empty")
	}

	sanitizedIDs := make([]string, 0, len(ids))
	for i, id := range ids {
		sanitized, err := s.SanitizeForInClause(id)
		if err != nil {
			return nil, fmt.Errorf("security error: malicious character detected in ID at position %d - %w", i+1, err)
		}
		sanitizedIDs = append(sanitizedIDs, sanitized)
	}

	return sanitizedIDs, nil
}

// BuildSafeInClause builds a safe IN clause string from sanitized IDs
// Format: 'id1', 'id2', 'id3'
func (s *SQLSanitizer) BuildSafeInClause(ids []string) (string, error) {
	sanitizedIDs, err := s.SanitizeIDs(ids)
	if err != nil {
		return "", err
	}

	var builder strings.Builder
	for i, id := range sanitizedIDs {
		if i > 0 {
			builder.WriteString(", ")
		}
		// Escape single quotes by doubling them
		escapedID := strings.ReplaceAll(id, "'", "''")
		builder.WriteString(fmt.Sprintf("'%s'", escapedID))
	}

	return builder.String(), nil
}

// ValidateColumnName validates a column name to prevent SQL injection through dynamic column names
func (s *SQLSanitizer) ValidateColumnName(columnName string) error {
	if columnName == "" {
		return fmt.Errorf("column name cannot be empty")
	}

	// Column names should only contain alphanumeric and underscore
	validPattern := regexp.MustCompile(`^[a-zA-Z_][a-zA-Z0-9_]*$`)
	if !validPattern.MatchString(columnName) {
		return fmt.Errorf("invalid column name: must start with letter or underscore and contain only alphanumeric and underscore characters")
	}

	// Check for SQL keywords that shouldn't be column names
	sqlKeywords := []string{
		"select", "insert", "update", "delete", "drop", "create", "alter",
		"union", "exec", "execute", "declare", "cast", "convert",
	}

	columnLower := strings.ToLower(columnName)
	for _, keyword := range sqlKeywords {
		if columnLower == keyword {
			return fmt.Errorf("column name cannot be a SQL keyword: %s", keyword)
		}
	}

	return nil
}

// SanitizeOrderByColumn validates and sanitizes ORDER BY column name and direction
func (s *SQLSanitizer) SanitizeOrderByColumn(column, direction string) (string, string, error) {
	// Validate column name
	if err := s.ValidateColumnName(column); err != nil {
		return "", "", fmt.Errorf("invalid ORDER BY column: %w", err)
	}

	// Validate direction
	directionUpper := strings.ToUpper(strings.TrimSpace(direction))
	if directionUpper != "ASC" && directionUpper != "DESC" && directionUpper != "" {
		return "", "", fmt.Errorf("invalid ORDER BY direction: must be ASC or DESC")
	}

	if directionUpper == "" {
		directionUpper = "ASC"
	}

	return column, directionUpper, nil
}

// IsASCII checks if the input string contains only ASCII characters
func (s *SQLSanitizer) IsASCII(input string) bool {
	for _, char := range input {
		if char > 127 {
			return false
		}
	}
	return true
}

// SanitizeASCIIInput validates that input contains only ASCII characters
func (s *SQLSanitizer) SanitizeASCIIInput(input string) (string, error) {
	if !s.IsASCII(input) {
		return "", fmt.Errorf("input contains non-ASCII characters")
	}

	// Still check for malicious patterns
	sanitized, err := s.SanitizeForInClause(input)
	if err != nil {
		return "", err
	}

	return sanitized, nil
}

// Global instance for easy access
var DefaultSanitizer = NewSQLSanitizer()

// Convenience functions using the default sanitizer
func SanitizeForInClause(input string) (string, error) {
	return DefaultSanitizer.SanitizeForInClause(input)
}

func SanitizeIDs(ids []string) ([]string, error) {
	return DefaultSanitizer.SanitizeIDs(ids)
}

func BuildSafeInClause(ids []string) (string, error) {
	return DefaultSanitizer.BuildSafeInClause(ids)
}

func ValidateColumnName(columnName string) error {
	return DefaultSanitizer.ValidateColumnName(columnName)
}

func SanitizeOrderByColumn(column, direction string) (string, string, error) {
	return DefaultSanitizer.SanitizeOrderByColumn(column, direction)
}

func IsASCII(input string) bool {
	return DefaultSanitizer.IsASCII(input)
}

func SanitizeASCIIInput(input string) (string, error) {
	return DefaultSanitizer.SanitizeASCIIInput(input)
}
