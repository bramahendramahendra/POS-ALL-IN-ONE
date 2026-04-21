package regexp_helper

import (
	"regexp"
)

// Precompile regex for performance
var (
	reNumeric     = regexp.MustCompile(`^[0-9]+$`)
	reAlpha       = regexp.MustCompile(`^[A-Za-z ]+$`)
	reAlphaNum    = regexp.MustCompile(`^[A-Za-z0-9 ]+$`)
	reDecimal     = regexp.MustCompile(`^[0-9]+(\.[0-9]+)?$`)
	reAccountLoan = regexp.MustCompile(`^[0-9]{11}1[0-9]{3}$`)
	// reDateDMY     = regexp.MustCompile(`^(0?[1-9]|[12][0-9]|3[01])/(0?[1-9]|1[0-2])/\d{4}$`)
	reDateDMY = regexp.MustCompile(`^(0?[1-9]|[12][0-9]|3[01])[\/-](0?[1-9]|1[0-2])[\/-][0-9]{4}$`)
	reASccii  = regexp.MustCompile(`^[\x00-\x7F]+$`)
)

// IsNumeric checks if string contains only digits
func IsNumeric(s string) bool {
	return reNumeric.MatchString(s)
}

// IsAlpha checks if string contains only letters
func IsAlpha(s string) bool {
	return reAlpha.MatchString(s)
}

// IsAlphaNum checks if string contains only letters and digits
func IsAlphaNum(s string) bool {
	return reAlphaNum.MatchString(s)
}

func IsASccii(s string) bool {
	return reASccii.MatchString(s)
}

// IsDecimal checks if string is a valid decimal number
func IsDecimal(s string) bool {
	return reDecimal.MatchString(s)
}

// IsAccountLoan, check if length is 15 and char on 12 is '1' and numeric
func IsAccountLoan(s string) bool {
	return reAccountLoan.MatchString(s)
}

// IsNominal check if string is a valid nominal (decimal or numeric)
func IsNominal(s string) bool {
	return IsDecimal(s) || IsNumeric(s)
}

// Is Date in format d/m/yyyy
func IsDateDMY(s string) bool {
	return reDateDMY.MatchString(s)
}
