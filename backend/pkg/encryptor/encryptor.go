package encryptor

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
)

// Encryptor represents the encryption service
type Encryptor struct {
	key []byte
}

const (
	defaultKey = "bebek-gila-16byt" // exactly 16 bytes for AES-128
)

// NewEncryptor creates a new encryptor instance with the provided key
// The key should be 16, 24, or 32 bytes for AES-128, AES-192, or AES-256 respectively
func NewEncryptor(key string) (*Encryptor, error) {
	keyBytes := []byte(key)

	// Validate key length
	if len(keyBytes) != 16 && len(keyBytes) != 24 && len(keyBytes) != 32 {
		return nil, errors.New("key length must be 16, 24, or 32 bytes")
	}

	return &Encryptor{
		key: keyBytes,
	}, nil
}

// EncryptJSON encrypts any Go data structure to JSON and then encrypts it
func (e *Encryptor) EncryptJSON(data interface{}) (string, error) {
	// Convert data to JSON
	jsonData, err := json.Marshal(data)
	if err != nil {
		return "", fmt.Errorf("failed to marshal data to JSON: %w", err)
	}

	// Encrypt the JSON string
	encrypted, err := e.Encrypt(string(jsonData))
	if err != nil {
		return "", fmt.Errorf("failed to encrypt JSON: %w", err)
	}

	return encrypted, nil
}

// EncryptJSONString encrypts a JSON string
func (e *Encryptor) EncryptJSONString(jsonString string) (string, error) {
	// Validate that the input is valid JSON
	var temp interface{}
	if err := json.Unmarshal([]byte(jsonString), &temp); err != nil {
		return "", fmt.Errorf("invalid JSON string: %w", err)
	}

	// Encrypt the JSON string
	encrypted, err := e.Encrypt(jsonString)
	if err != nil {
		return "", fmt.Errorf("failed to encrypt JSON string: %w", err)
	}

	return encrypted, nil
}

// DecryptToJSON decrypts an encrypted string and unmarshals it into the provided interface
func (e *Encryptor) DecryptToJSON(encryptedData string, result interface{}) error {
	// Decrypt the string
	decrypted, err := e.decrypt(encryptedData)
	if err != nil {
		return fmt.Errorf("failed to decrypt data: %w", err)
	}

	// Unmarshal JSON into result
	if err := json.Unmarshal([]byte(decrypted), result); err != nil {
		return fmt.Errorf("failed to unmarshal JSON: %w", err)
	}

	return nil
}

// DecryptToJSONString decrypts an encrypted string and returns the original JSON string
func (e *Encryptor) DecryptToJSONString(encryptedData string) (string, error) {
	// Decrypt the string
	decrypted, err := e.decrypt(encryptedData)
	if err != nil {
		return "", fmt.Errorf("failed to decrypt data: %w", err)
	}

	// Validate that the decrypted string is valid JSON
	var temp interface{}
	if err := json.Unmarshal([]byte(decrypted), &temp); err != nil {
		return "", fmt.Errorf("decrypted data is not valid JSON: %w", err)
	}

	return decrypted, nil
}

// encrypt encrypts a plain text string using AES-GCM
func (e *Encryptor) Encrypt(plaintext string) (string, error) {
	// Create cipher block
	block, err := aes.NewCipher(e.key)
	if err != nil {
		return "", fmt.Errorf("failed to create cipher: %w", err)
	}

	// Create GCM mode
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", fmt.Errorf("failed to create GCM: %w", err)
	}

	// Create nonce
	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", fmt.Errorf("failed to generate nonce: %w", err)
	}

	// Encrypt the data
	ciphertext := gcm.Seal(nonce, nonce, []byte(plaintext), nil)

	// Encode to base64 for easy storage/transmission
	return base64.StdEncoding.EncodeToString(ciphertext), nil
}

// decrypt decrypts a base64 encoded encrypted string using AES-GCM
func (e *Encryptor) decrypt(encryptedData string) (string, error) {
	// Decode from base64
	data, err := base64.StdEncoding.DecodeString(encryptedData)
	if err != nil {
		return "", fmt.Errorf("failed to decode base64: %w", err)
	}

	// Create cipher block
	block, err := aes.NewCipher(e.key)
	if err != nil {
		return "", fmt.Errorf("failed to create cipher: %w", err)
	}

	// Create GCM mode
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", fmt.Errorf("failed to create GCM: %w", err)
	}

	// Check minimum length
	nonceSize := gcm.NonceSize()
	if len(data) < nonceSize {
		return "", errors.New("ciphertext too short")
	}

	// Split nonce and ciphertext
	nonce, ciphertext := data[:nonceSize], data[nonceSize:]

	// Decrypt the data
	plaintext, err := gcm.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return "", fmt.Errorf("failed to decrypt: %w", err)
	}

	return string(plaintext), nil
}

// Helper functions for convenience

// GlobalEncryptor holds a global instance (auto-initialized)
var globalEncryptor *Encryptor

// init function automatically initializes the global encryptor
func init() {
	enc, err := NewEncryptor(defaultKey)
	if err != nil {
		panic(fmt.Sprintf("failed to initialize global encryptor: %v", err))
	}
	globalEncryptor = enc
}

// InitGlobalEncryptor initializes the global encryptor with a custom key
func InitGlobalEncryptor(key string) error {
	enc, err := NewEncryptor(key)
	if err != nil {
		return err
	}
	globalEncryptor = enc
	return nil
}

// EncryptJSON encrypts data using the global encryptor
func EncryptJSON(data interface{}) (string, error) {
	return globalEncryptor.EncryptJSON(data)
}

// EncryptJSONString encrypts a JSON string using the global encryptor
func EncryptJSONString(jsonString string) (string, error) {
	return globalEncryptor.EncryptJSONString(jsonString)
}

// DecryptToJSON decrypts using the global encryptor
func DecryptToJSON(encryptedData string, result interface{}) error {
	return globalEncryptor.DecryptToJSON(encryptedData, result)
}

// DecryptToJSONString decrypts to JSON string using the global encryptor
func DecryptToJSONString(encryptedData string) (string, error) {
	return globalEncryptor.DecryptToJSONString(encryptedData)
}

// Encrypt encrypts a plain text string using the global encryptor
func Encrypt(plaintext string) (string, error) {
	return globalEncryptor.Encrypt(plaintext)
}

// Decrypt decrypts an encrypted string using the global encryptor
func Decrypt(encryptedData string) (string, error) {
	return globalEncryptor.decrypt(encryptedData)
}
