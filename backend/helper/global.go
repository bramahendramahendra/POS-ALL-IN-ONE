package helper

import (
	"bytes"
	"compress/gzip"
	cryptoRand "crypto/rand"
	"encoding/base64"
	"encoding/csv"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"math/big"
	"net/http"
	"permen_api/config"
	"regexp"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

var mu sync.Mutex
var lastTime string
var counter int
var (
	integerRe = regexp.MustCompile(`^[+-]?\d+$`)
	twoDecRe  = regexp.MustCompile(`^[+-]?\d+\.\d{2}$`)
)

const (
	noInvoiceFormat = "BRI-INVOICE/%s/%s/%s/%09d" // BRI-INVOICE/{year}/{month}/{jenis_invoice}/{sequential_number}
)

func GenerateNomorInvoice(year, month, jenisInvoice string, sequentialNumber int) string {
	fmt.Println("No Invoice : ", fmt.Sprintf(noInvoiceFormat, year, month, jenisInvoice, sequentialNumber))
	return fmt.Sprintf(noInvoiceFormat, year, month, jenisInvoice, sequentialNumber)
}

func GenerateUniqueId() string {
	return uuid.NewString()
}

func GetSecretKey() (string, error) {
	secretKey := config.General.SecretKey
	if secretKey == "" {
		return "", errors.New("secret key is empty")
	}

	return secretKey, nil
}

func GetClaims(value any, claims *jwt.MapClaims) error {
	if v, ok := value.(jwt.MapClaims); ok {
		*claims = v
	}

	if *claims == nil {
		return errors.New("claims not found")
	}

	return nil
}

func GetClaimsId(value any, userId *int64) error {
	if claims, ok := value.(jwt.MapClaims); ok {
		if id, ok := claims["id"]; ok {
			if idInt, ok := id.(float64); ok {
				*userId = int64(idInt)
			}
		}
	}

	if *userId == 0 {
		return errors.New("claims not found")
	}

	return nil
}

func ConvertDataToJson(from any, to *string) error {
	result, err := json.Marshal(from)
	if err != nil {
		errMessage := "Failed to convert data to json, " + err.Error()
		return errors.New(errMessage)
	}
	*to = string(result)

	return nil
}

func ConvertStringToMap(data string) (map[string]interface{}, error) {
	result := make(map[string]interface{})
	if err := json.Unmarshal([]byte(data), &result); err != nil {
		return nil, err
	}
	return result, nil
}

func ReadhttpHeader(header *http.Header) (string, error) {
	jsonBytes, err := json.Marshal(header)
	if err != nil {
		return "", err
	}
	return string(jsonBytes), nil
}

func ParseUserHeader(header string) (pn, name string, err error) {
	parts := strings.Split(header, " | ")
	if len(parts) < 2 {
		return "", "", fmt.Errorf("invalid user header format")
	}
	return parts[0], parts[1], nil
}

func GenerateCustomID(prefix string) string {
	mu.Lock()
	defer mu.Unlock()

	now := time.Now().Format("20060102150405")
	if now == lastTime {
		counter++
	} else {
		lastTime = now
		counter = 1
	}

	return fmt.Sprintf("%s-%s%02d", prefix, now, counter)
}

func GeneratePlaceholderForIds(data []string, query string) (string, []any) {
	var ids []any
	placeholder := "("
	for _, value := range data {
		placeholder += "?,"
		ids = append(ids, value)
	}
	trimmedPlaceholder := strings.TrimRight(placeholder, ",")
	trimmedPlaceholder += ")"
	finalQuery := query + " " + trimmedPlaceholder

	return finalQuery, ids
}

func WrapOtherArgumentsWithIds(ids []any, others ...any) []any {
	finalArgs := append(others, ids...)
	return finalArgs
}

// GenerateTimeBasedID generates a secure time-based ID using cryptographically strong random numbers
func GenerateTimeBasedID() string {
	now := uint64(time.Now().UnixNano())

	// Security: Use crypto/rand for cryptographically secure random number generation
	// Generate 20 random bits (0xFFFFF = 1048575, which requires 20 bits)
	randomBytes := make([]byte, 3) // 3 bytes = 24 bits, we'll use 20 of them
	_, err := cryptoRand.Read(randomBytes)
	if err != nil {
		// Fallback: if crypto/rand fails, use a secure alternative approach
		// This should rarely happen, but we handle it gracefully
		return generateSecureTimeBasedIDFallback()
	}

	// Convert bytes to uint64 and mask to 20 bits
	r := uint64(randomBytes[0])<<16 | uint64(randomBytes[1])<<8 | uint64(randomBytes[2])
	r = r & 0xFFFFF // Mask to 20 bits

	// Combine timestamp (shifted left by 20 bits) with random bits
	id := (now << 20) | r
	return strconv.FormatUint(id, 10)
}

// generateSecureTimeBasedIDFallback provides a fallback when crypto/rand is unavailable
func generateSecureTimeBasedIDFallback() string {
	// Use UUID as a secure fallback and combine with timestamp
	uuid := uuid.New()
	now := uint64(time.Now().UnixNano())

	// Extract some bytes from UUID for randomness
	uuidBytes := uuid[:]
	r := uint64(uuidBytes[0])<<12 | uint64(uuidBytes[1])<<4 | uint64(uuidBytes[2])>>4
	r = r & 0xFFFFF // Mask to 20 bits

	id := (now << 20) | r
	return strconv.FormatUint(id, 10)
}

func PrettyPrintJSON(data []byte) {
	var out bytes.Buffer
	err := json.Indent(&out, data, "", "  ")
	if err != nil {
		fmt.Println("Invalid JSON:", err)
		return
	}
	fmt.Println(out.String())
}

func MapResponseBody[T any](data []byte) (T, error) {
	var result T
	if err := json.Unmarshal(data, &result); err != nil {
		return result, err
	}
	return result, nil
}

func BuildBasicAuthCreds(username, password string) string {
	creds := username + ":" + password
	return base64.StdEncoding.EncodeToString([]byte(creds))
}

func GenerateExternalId(prefix string) string {
	// 12 characters = 6 random bytes (since hex encoding gives 2 chars per byte)
	b := make([]byte, 6)
	_, err := cryptoRand.Read(b)
	if err != nil {
		panic(err) // in production, better handle error properly
	}

	randomPart := hex.EncodeToString(b) // always 12 hex chars
	return prefix + randomPart
}

func GenerateReferenceNumber(length int) string {
	// Use current UnixNano timestamp
	timestamp := time.Now().UnixNano()

	// Convert to string
	idStr := strconv.FormatInt(timestamp, 10)

	// If shorter than required, left pad with 0
	if len(idStr) < length {
		return fmt.Sprintf("%0*s", length, idStr)
	}

	// If longer, take the rightmost part (to keep changing digits)
	return idStr[len(idStr)-length:]
}

func GetMaxBackdateBrifaktur(day int) (time.Time, error) {
	now := time.Now()
	year, month := now.Year(), now.Month()

	// validate day, get last day of month
	lastDay := time.Date(year, month+1, 0, 0, 0, 0, 0, now.Location()).Day()
	if day < 1 || day > lastDay {
		return time.Time{}, fmt.Errorf("invalid day %d for month %s", day, month)
	}

	// build date
	return time.Date(year, month, day, 0, 0, 0, 0, now.Location()), nil
}

func FormatRupiah(amount *big.Rat) string {
	// Convert the big.Rat to a big.Float with a precision that handles cents.
	// You can choose a higher precision if needed, but 2 is good for currency.
	f := new(big.Float).SetRat(amount)

	// Format the float to a string with 2 decimal places.
	// We use 'f' for fixed-point notation.
	formattedAmount := f.Text('f', 2)

	// Split the string into the integer and decimal parts.
	parts := strings.Split(formattedAmount, ".")
	integerPart := parts[0]
	// The decimal part is handled separately. We expect it to be 2 digits.
	decimalPart := parts[1]

	// Format the integer part with thousands separators.
	var result []string
	// The loop will process the integer string from right to left in groups of three.
	for len(integerPart) > 3 {
		result = append([]string{integerPart[len(integerPart)-3:]}, result...)
		integerPart = integerPart[:len(integerPart)-3]
	}
	if len(integerPart) > 0 {
		result = append([]string{integerPart}, result...)
	}

	// Join the formatted parts with dots and add the final currency formatting.
	return fmt.Sprintf("Rp. %s,%s", strings.Join(result, "."), decimalPart)
}

func FormatRupiahString(amountStr string) string {
	// Try parsing string into big.Rat, fallback to 0 if invalid
	rat, ok := new(big.Rat).SetString(amountStr)
	if !ok {
		rat = big.NewRat(0, 1)
	}

	// Convert to big.Float for decimal handling
	f := new(big.Float).SetRat(rat)

	// Force 2 decimal places
	formattedAmount := f.Text('f', 2)

	// Split integer and decimal parts
	parts := strings.Split(formattedAmount, ".")
	integerPart := parts[0]
	decimalPart := parts[1]

	// Add thousand separators
	var result []string
	for len(integerPart) > 3 {
		result = append([]string{integerPart[len(integerPart)-3:]}, result...)
		integerPart = integerPart[:len(integerPart)-3]
	}
	if len(integerPart) > 0 {
		result = append([]string{integerPart}, result...)
	}

	return fmt.Sprintf("Rp. %s,%s", strings.Join(result, "."), decimalPart)
}

func ParseCommaSeparatedToMap(data string) map[string]bool {
	resultMap := make(map[string]bool)
	if data == "" {
		return resultMap
	}

	for _, v := range strings.Split(data, ",") {
		cleaned := strings.TrimSpace(v)
		if cleaned != "" {
			resultMap[cleaned] = true
		}
	}
	return resultMap
}

func GenerateNomorFaktur(regionCode, branchCode string, isWapu bool, counter int) string {
	customerTypeCode := "1"
	if isWapu {
		customerTypeCode = "2"
	}

	formattedBranchCode := branchCode
	if len(formattedBranchCode) < 4 {
		formattedBranchCode = fmt.Sprintf("%04s", formattedBranchCode)
	} else if len(formattedBranchCode) > 4 {
		formattedBranchCode = formattedBranchCode[:4]
	}

	currentYear := time.Now().Year() % 100
	yearCode := fmt.Sprintf("%02d", currentYear)

	sequentialNumber := fmt.Sprintf("%07d", counter)

	return fmt.Sprintf("%s%s%s-%s-%s", regionCode, customerTypeCode, formattedBranchCode, yearCode, sequentialNumber)
}

var angka = []string{
	"", "Satu", "Dua", "Tiga", "Empat", "Lima",
	"Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas",
}

// TerbilangBigRat converts a *big.Rat number into Indonesian words (terbilang),
// supporting up to triliun and handling fractional parts as sen.
func TerbilangBigRat(n *big.Rat) string {
	if n.Sign() == 0 {
		return "Nol"
	}

	// Get integer part
	intPart := new(big.Int)
	// n.Int(intPart) // WRONG METHOD — fixed below
	// Correct way:
	intPart.Quo(n.Num(), n.Denom())

	// Convert integer part
	result := terbilangBigInt(intPart)

	// Handle fractional part (2 digits → sen)
	fracPart := new(big.Rat).Sub(n, new(big.Rat).SetInt(intPart))
	if fracPart.Sign() != 0 {
		// Multiply by 100 and round
		fracTimes100 := new(big.Rat).Mul(fracPart, big.NewRat(100, 1))
		fracRounded, _ := fracTimes100.Float64()
		fracInt := int64(fracRounded + 0.5)

		if fracInt > 0 {
			result += " Rupiah Koma " + terbilangBigInt(big.NewInt(fracInt)) + " Sen"
		}
	} else {
		result += " Rupiah"
	}

	return strings.TrimSpace(result)
}

// terbilangBigInt converts a *big.Int to Indonesian words up to triliun.
func terbilangBigInt(n *big.Int) string {
	val := n.Int64()
	switch {
	case val == 0:
		return ""
	case val < 12:
		return angka[val]
	case val < 20:
		return terbilangBigInt(big.NewInt(val-10)) + " Belas"
	case val < 100:
		return strings.TrimSpace(terbilangBigInt(big.NewInt(val/10)) + " Puluh " + terbilangBigInt(big.NewInt(val%10)))
	case val < 200:
		return "Seratus " + terbilangBigInt(big.NewInt(val-100))
	case val < 1000:
		return strings.TrimSpace(terbilangBigInt(big.NewInt(val/100)) + " Ratus " + terbilangBigInt(big.NewInt(val%100)))
	case val < 2000:
		return "Seribu " + terbilangBigInt(big.NewInt(val-1000))
	case val < 1000000:
		return strings.TrimSpace(terbilangBigInt(big.NewInt(val/1000)) + " Ribu " + terbilangBigInt(big.NewInt(val%1000)))
	case val < 1000000000:
		return strings.TrimSpace(terbilangBigInt(big.NewInt(val/1000000)) + " Juta " + terbilangBigInt(big.NewInt(val%1000000)))
	case val < 1000000000000:
		return strings.TrimSpace(terbilangBigInt(big.NewInt(val/1000000000)) + " Milyar " + terbilangBigInt(big.NewInt(val%1000000000)))
	case val < 1000000000000000:
		return strings.TrimSpace(terbilangBigInt(big.NewInt(val/1000000000000)) + " Triliun " + terbilangBigInt(big.NewInt(val%1000000000000)))
	default:
		return "Angka terlalu besar"
	}
}

func FormatDecimalRupiah(numStr string) string {
	// Parse input using big.Float for precision
	val, ok := new(big.Float).SetString(numStr)
	if !ok {
		return "0,00"
	}

	// Format to exactly 2 decimal digits
	s := fmt.Sprintf("%.2f", val)

	// Split integer and decimal parts
	parts := strings.Split(s, ".")
	intPart := parts[0]
	decPart := "00"
	if len(parts) > 1 {
		decPart = parts[1]
	}

	// Add thousand separators (.)
	var result strings.Builder
	count := 0
	for i := len(intPart) - 1; i >= 0; i-- {
		if count == 3 {
			result.WriteString(".")
			count = 0
		}
		result.WriteByte(intPart[i])
		count++
	}

	// Reverse the integer part
	runes := []rune(result.String())
	for i, j := 0, len(runes)-1; i < j; i, j = i+1, j-1 {
		runes[i], runes[j] = runes[j], runes[i]
	}

	return string(runes) + "," + decPart
}

func DecimalToPercentage(numStr string) string {
	val, ok := new(big.Float).SetString(numStr)
	if !ok {
		return "0%"
	}

	// Format with up to 2 decimal digits, trim trailing zeros
	formatted := fmt.Sprintf("%.2f", val)
	formatted = strings.TrimRight(formatted, "0")
	formatted = strings.TrimRight(formatted, ".")
	formatted = strings.ReplaceAll(formatted, ".", ",")

	return formatted + "%"
}

func IndoToMySQLNumber(val string) string {
	val = strings.ReplaceAll(val, ".", "")  // remove thousand separator
	val = strings.ReplaceAll(val, ",", ".") // replace decimal separator
	return val
}

func NormalizeTwoDecimal(input string) (string, error) {
	s := strings.TrimSpace(input)
	if s == "" {
		return "", errors.New("empty input")
	}

	if twoDecRe.MatchString(s) {
		return s, nil
	}
	if integerRe.MatchString(s) {
		return s + ".00", nil
	}

	return "", fmt.Errorf("invalid decimal format: expected integer or exactly two decimal places using '.' (got %q)", input)
}

func WriteCSVWithGzipResponse(cw http.ResponseWriter, filename string, headers []string, rows [][]string, delimiter rune) error {
	cw.Header().Set("Content-Encoding", "gzip")
	cw.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=%s.csv.gz", filename))
	cw.Header().Set("Content-Type", "text/csv")

	gz := gzip.NewWriter(cw)
	defer gz.Close()

	writer := csv.NewWriter(gz)
	writer.Comma = delimiter
	defer writer.Flush()

	if err := writer.Write(headers); err != nil {
		return err
	}

	for _, row := range rows {
		if err := writer.Write(row); err != nil {
			return err
		}
	}

	return nil
}
