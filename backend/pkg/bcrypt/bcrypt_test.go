package bcrypt

import (
	"strings"
	"testing"
)

func TestHashPassword(t *testing.T) {
	tests := []struct {
		name     string
		password string
		wantErr  bool
	}{
		{
			name:     "Hash simple password",
			password: "password123",
			wantErr:  false,
		},
		{
			name:     "Hash empty password",
			password: "",
			wantErr:  false,
		},
		{
			name:     "Hash long password",
			password: strings.Repeat("a", 1000),
			wantErr:  false,
		},
		{
			name:     "Hash special characters",
			password: "!@#$%^&*()_+-=[]{}|;':\",./<>?`~",
			wantErr:  false,
		},
		{
			name:     "Hash unicode characters",
			password: "密码测试🔐",
			wantErr:  false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			hash, err := HashPassword(tt.password)
			if (err != nil) != tt.wantErr {
				t.Errorf("HashPassword() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !tt.wantErr {
				if hash == "" {
					t.Error("HashPassword() returned empty hash")
				}
				if !strings.HasPrefix(hash, "$argon2id$") {
					t.Errorf("HashPassword() hash doesn't have correct prefix, got %s", hash)
				}
			}
		})
	}
}

func TestVerifyPassword(t *testing.T) {
	password := "testPassword123"
	hash, err := HashPassword(password)
	if err != nil {
		t.Fatalf("Failed to hash password: %v", err)
	}

	tests := []struct {
		name           string
		password       string
		hashedPassword string
		want           bool
	}{
		{
			name:           "Correct password",
			password:       password,
			hashedPassword: hash,
			want:           true,
		},
		{
			name:           "Wrong password",
			password:       "wrongPassword",
			hashedPassword: hash,
			want:           false,
		},
		{
			name:           "Empty password with valid hash",
			password:       "",
			hashedPassword: hash,
			want:           false,
		},
		{
			name:           "Valid password with invalid hash",
			password:       password,
			hashedPassword: "invalid-hash",
			want:           false,
		},
		{
			name:           "Valid password with empty hash",
			password:       password,
			hashedPassword: "",
			want:           false,
		},
		{
			name:           "Valid password with malformed hash",
			password:       password,
			hashedPassword: "$argon2id$invalid",
			want:           false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := VerifyPassword(tt.password, tt.hashedPassword); got != tt.want {
				t.Errorf("VerifyPassword() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestHashPasswordWithParams(t *testing.T) {
	tests := []struct {
		name        string
		password    string
		memory      uint32
		iterations  uint32
		parallelism uint8
		saltLen     uint32
		keyLen      uint32
		wantErr     bool
	}{
		{
			name:        "Standard parameters",
			password:    "password123",
			memory:      64 * 1024,
			iterations:  3,
			parallelism: 4,
			saltLen:     16,
			keyLen:      32,
			wantErr:     false,
		},
		{
			name:        "Minimal parameters",
			password:    "password",
			memory:      1024,
			iterations:  1,
			parallelism: 1,
			saltLen:     8,
			keyLen:      16,
			wantErr:     false,
		},
		{
			name:        "High security parameters",
			password:    "securePassword!@#",
			memory:      128 * 1024,
			iterations:  5,
			parallelism: 8,
			saltLen:     32,
			keyLen:      64,
			wantErr:     false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			hash, err := HashPasswordWithParams(tt.password, tt.memory, tt.iterations, tt.parallelism, tt.saltLen, tt.keyLen)
			if (err != nil) != tt.wantErr {
				t.Errorf("HashPasswordWithParams() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !tt.wantErr {
				if hash == "" {
					t.Error("HashPasswordWithParams() returned empty hash")
				}
				if !VerifyPassword(tt.password, hash) {
					t.Error("HashPasswordWithParams() generated hash that doesn't verify")
				}
			}
		})
	}
}

func TestDecodeHash(t *testing.T) {
	tests := []struct {
		name string
		hash string
	}{
		{
			name: "Invalid hash - wrong number of parts",
			hash: "$argon2id$invalid",
		},
		{
			name: "Invalid hash - wrong algorithm",
			hash: "$bcrypt$v=19$m=65536,t=3,p=4$salt$hash",
		},
		{
			name: "Invalid hash - wrong version format",
			hash: "$argon2id$version=19$m=65536,t=3,p=4$salt$hash",
		},
		{
			name: "Invalid hash - invalid base64 salt",
			hash: "$argon2id$v=19$m=65536,t=3,p=4$!!!invalid!!!$hash",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, _, _, err := decodeHash(tt.hash)
			if err == nil {
				t.Errorf("decodeHash() expected error for hash: %s", tt.hash)
			}
		})
	}
}

func TestHashUniqueness(t *testing.T) {
	password := "samePassword"
	hash1, err := HashPassword(password)
	if err != nil {
		t.Fatalf("Failed to hash password: %v", err)
	}

	hash2, err := HashPassword(password)
	if err != nil {
		t.Fatalf("Failed to hash password: %v", err)
	}

	if hash1 == hash2 {
		t.Error("HashPassword() should generate unique hashes for the same password due to random salt")
	}

	if !VerifyPassword(password, hash1) {
		t.Error("First hash should verify correctly")
	}
	if !VerifyPassword(password, hash2) {
		t.Error("Second hash should verify correctly")
	}
}

func BenchmarkHashPassword(b *testing.B) {
	password := "benchmarkPassword123"
	for i := 0; i < b.N; i++ {
		_, _ = HashPassword(password)
	}
}

func BenchmarkVerifyPassword(b *testing.B) {
	password := "benchmarkPassword123"
	hash, _ := HashPassword(password)
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		VerifyPassword(password, hash)
	}
}
