package encryptor

import (
	"strings"
	"testing"
)

func TestNewEncryptor(t *testing.T) {
	tests := []struct {
		name    string
		key     string
		wantErr bool
	}{
		{
			name:    "Valid 16-byte key (AES-128)",
			key:     "1234567890123456",
			wantErr: false,
		},
		{
			name:    "Valid 24-byte key (AES-192)",
			key:     "123456789012345678901234",
			wantErr: false,
		},
		{
			name:    "Valid 32-byte key (AES-256)",
			key:     "12345678901234567890123456789012",
			wantErr: false,
		},
		{
			name:    "Invalid 15-byte key",
			key:     "123456789012345",
			wantErr: true,
		},
		{
			name:    "Invalid 17-byte key",
			key:     "12345678901234567",
			wantErr: true,
		},
		{
			name:    "Empty key",
			key:     "",
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			enc, err := NewEncryptor(tt.key)
			if (err != nil) != tt.wantErr {
				t.Errorf("NewEncryptor() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !tt.wantErr && enc == nil {
				t.Error("NewEncryptor() returned nil encryptor without error")
			}
		})
	}
}

func TestEncrypt(t *testing.T) {
	enc, err := NewEncryptor("1234567890123456")
	if err != nil {
		t.Fatalf("Failed to create encryptor: %v", err)
	}

	tests := []struct {
		name      string
		plaintext string
		wantErr   bool
	}{
		{
			name:      "Simple string",
			plaintext: "Hello, World!",
			wantErr:   false,
		},
		{
			name:      "Empty string",
			plaintext: "",
			wantErr:   false,
		},
		{
			name:      "Long string",
			plaintext: strings.Repeat("a", 10000),
			wantErr:   false,
		},
		{
			name:      "Unicode characters",
			plaintext: "こんにちは世界🔐",
			wantErr:   false,
		},
		{
			name:      "Special characters",
			plaintext: "!@#$%^&*()_+-=[]{}|;':\",./<>?`~\n\t",
			wantErr:   false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			encrypted, err := enc.Encrypt(tt.plaintext)
			if (err != nil) != tt.wantErr {
				t.Errorf("Encrypt() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !tt.wantErr {
				if encrypted == "" && tt.plaintext != "" {
					t.Error("Encrypt() returned empty string for non-empty input")
				}
				if encrypted != "" && !isBase64(encrypted) {
					t.Error("Encrypt() result is not valid base64")
				}
			}
		})
	}
}

func TestDecrypt(t *testing.T) {
	enc, err := NewEncryptor("1234567890123456")
	if err != nil {
		t.Fatalf("Failed to create encryptor: %v", err)
	}

	tests := []struct {
		name      string
		plaintext string
	}{
		{
			name:      "Simple string",
			plaintext: "Hello, World!",
		},
		{
			name:      "Empty string",
			plaintext: "",
		},
		{
			name:      "JSON string",
			plaintext: `{"key": "value", "number": 123}`,
		},
		{
			name:      "Unicode",
			plaintext: "测试数据🔒",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			encrypted, err := enc.Encrypt(tt.plaintext)
			if err != nil {
				t.Fatalf("Encrypt() error = %v", err)
			}

			decrypted, err := enc.decrypt(encrypted)
			if err != nil {
				t.Fatalf("decrypt() error = %v", err)
			}

			if decrypted != tt.plaintext {
				t.Errorf("decrypt() = %v, want %v", decrypted, tt.plaintext)
			}
		})
	}
}

func TestDecryptInvalidInput(t *testing.T) {
	enc, err := NewEncryptor("1234567890123456")
	if err != nil {
		t.Fatalf("Failed to create encryptor: %v", err)
	}

	tests := []struct {
		name    string
		input   string
		wantErr bool
	}{
		{
			name:    "Invalid base64",
			input:   "not-valid-base64!!!",
			wantErr: true,
		},
		{
			name:    "Too short ciphertext",
			input:   "YWJj",
			wantErr: true,
		},
		{
			name:    "Empty string",
			input:   "",
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := enc.decrypt(tt.input)
			if (err != nil) != tt.wantErr {
				t.Errorf("decrypt() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestEncryptJSON(t *testing.T) {
	enc, err := NewEncryptor("1234567890123456")
	if err != nil {
		t.Fatalf("Failed to create encryptor: %v", err)
	}

	tests := []struct {
		name    string
		data    interface{}
		wantErr bool
	}{
		{
			name:    "Simple struct",
			data:    struct{ Name string }{"John"},
			wantErr: false,
		},
		{
			name:    "Map",
			data:    map[string]interface{}{"key": "value", "num": 123},
			wantErr: false,
		},
		{
			name:    "Slice",
			data:    []string{"a", "b", "c"},
			wantErr: false,
		},
		{
			name:    "Nested struct",
			data:    struct{ Inner struct{ Value int } }{struct{ Value int }{42}},
			wantErr: false,
		},
		{
			name:    "Nil",
			data:    nil,
			wantErr: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			encrypted, err := enc.EncryptJSON(tt.data)
			if (err != nil) != tt.wantErr {
				t.Errorf("EncryptJSON() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !tt.wantErr && encrypted == "" {
				t.Error("EncryptJSON() returned empty string")
			}
		})
	}
}

func TestEncryptJSONString(t *testing.T) {
	enc, err := NewEncryptor("1234567890123456")
	if err != nil {
		t.Fatalf("Failed to create encryptor: %v", err)
	}

	tests := []struct {
		name       string
		jsonString string
		wantErr    bool
	}{
		{
			name:       "Valid JSON object",
			jsonString: `{"name": "John", "age": 30}`,
			wantErr:    false,
		},
		{
			name:       "Valid JSON array",
			jsonString: `[1, 2, 3]`,
			wantErr:    false,
		},
		{
			name:       "Invalid JSON",
			jsonString: "not valid json",
			wantErr:    true,
		},
		{
			name:       "Empty string",
			jsonString: "",
			wantErr:    true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			encrypted, err := enc.EncryptJSONString(tt.jsonString)
			if (err != nil) != tt.wantErr {
				t.Errorf("EncryptJSONString() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !tt.wantErr && encrypted == "" {
				t.Error("EncryptJSONString() returned empty string")
			}
		})
	}
}

func TestDecryptToJSON(t *testing.T) {
	enc, err := NewEncryptor("1234567890123456")
	if err != nil {
		t.Fatalf("Failed to create encryptor: %v", err)
	}

	type TestData struct {
		Name  string `json:"name"`
		Value int    `json:"value"`
	}

	original := TestData{Name: "test", Value: 42}
	encrypted, err := enc.EncryptJSON(original)
	if err != nil {
		t.Fatalf("EncryptJSON() error = %v", err)
	}

	var result TestData
	err = enc.DecryptToJSON(encrypted, &result)
	if err != nil {
		t.Fatalf("DecryptToJSON() error = %v", err)
	}

	if result.Name != original.Name || result.Value != original.Value {
		t.Errorf("DecryptToJSON() = %+v, want %+v", result, original)
	}
}

func TestDecryptToJSONString(t *testing.T) {
	enc, err := NewEncryptor("1234567890123456")
	if err != nil {
		t.Fatalf("Failed to create encryptor: %v", err)
	}

	original := `{"key":"value"}`
	encrypted, err := enc.EncryptJSONString(original)
	if err != nil {
		t.Fatalf("EncryptJSONString() error = %v", err)
	}

	decrypted, err := enc.DecryptToJSONString(encrypted)
	if err != nil {
		t.Fatalf("DecryptToJSONString() error = %v", err)
	}

	if decrypted != original {
		t.Errorf("DecryptToJSONString() = %v, want %v", decrypted, original)
	}
}

func TestGlobalEncryptor(t *testing.T) {
	t.Run("Global Encrypt/Decrypt", func(t *testing.T) {
		plaintext := "test data"
		encrypted, err := Encrypt(plaintext)
		if err != nil {
			t.Fatalf("Encrypt() error = %v", err)
		}

		decrypted, err := Decrypt(encrypted)
		if err != nil {
			t.Fatalf("Decrypt() error = %v", err)
		}

		if decrypted != plaintext {
			t.Errorf("Global Decrypt() = %v, want %v", decrypted, plaintext)
		}
	})

	t.Run("Global EncryptJSON/DecryptToJSON", func(t *testing.T) {
		data := map[string]interface{}{"key": "value"}
		encrypted, err := EncryptJSON(data)
		if err != nil {
			t.Fatalf("EncryptJSON() error = %v", err)
		}

		var result map[string]interface{}
		err = DecryptToJSON(encrypted, &result)
		if err != nil {
			t.Fatalf("DecryptToJSON() error = %v", err)
		}

		if result["key"] != "value" {
			t.Errorf("DecryptToJSON() result mismatch")
		}
	})

	t.Run("Global EncryptJSONString/DecryptToJSONString", func(t *testing.T) {
		jsonStr := `{"test": true}`
		encrypted, err := EncryptJSONString(jsonStr)
		if err != nil {
			t.Fatalf("EncryptJSONString() error = %v", err)
		}

		decrypted, err := DecryptToJSONString(encrypted)
		if err != nil {
			t.Fatalf("DecryptToJSONString() error = %v", err)
		}

		if decrypted != jsonStr {
			t.Errorf("DecryptToJSONString() = %v, want %v", decrypted, jsonStr)
		}
	})
}

func TestInitGlobalEncryptor(t *testing.T) {
	tests := []struct {
		name    string
		key     string
		wantErr bool
	}{
		{
			name:    "Valid key",
			key:     "abcdefghijklmnop",
			wantErr: false,
		},
		{
			name:    "Invalid key",
			key:     "short",
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := InitGlobalEncryptor(tt.key)
			if (err != nil) != tt.wantErr {
				t.Errorf("InitGlobalEncryptor() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}

	// Reset to default key
	_ = InitGlobalEncryptor(defaultKey)
}

func TestEncryptUniqueness(t *testing.T) {
	enc, err := NewEncryptor("1234567890123456")
	if err != nil {
		t.Fatalf("Failed to create encryptor: %v", err)
	}

	plaintext := "same text"
	encrypted1, _ := enc.Encrypt(plaintext)
	encrypted2, _ := enc.Encrypt(plaintext)

	if encrypted1 == encrypted2 {
		t.Error("Encrypt() should produce different ciphertexts due to random nonce")
	}

	decrypted1, _ := enc.decrypt(encrypted1)
	decrypted2, _ := enc.decrypt(encrypted2)

	if decrypted1 != decrypted2 {
		t.Error("Different ciphertexts should decrypt to the same plaintext")
	}
}

func isBase64(s string) bool {
	if len(s) == 0 {
		return false
	}
	for _, c := range s {
		if !((c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z') || (c >= '0' && c <= '9') || c == '+' || c == '/' || c == '=') {
			return false
		}
	}
	return true
}

func BenchmarkEncrypt(b *testing.B) {
	enc, _ := NewEncryptor("1234567890123456")
	plaintext := "benchmark test data"
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = enc.Encrypt(plaintext)
	}
}

func BenchmarkDecrypt(b *testing.B) {
	enc, _ := NewEncryptor("1234567890123456")
	encrypted, _ := enc.Encrypt("benchmark test data")
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = enc.decrypt(encrypted)
	}
}
