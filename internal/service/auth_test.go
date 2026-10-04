package service

import (
	"testing"
	"time"
)

func TestGenerateAndValidateToken(t *testing.T) {
	svc := &AuthService{
		jwtSecret:  []byte("test_secret"),
		accessTTL:  15 * time.Minute,
		refreshTTL: 168 * time.Hour,
	}

	userID := "test-user-id"
	token, err := svc.generateAccessToken(userID)
	if err != nil {
		t.Fatalf("generateAccessToken error: %v", err)
	}

	got, err := svc.ValidateAccessToken(token)
	if err != nil {
		t.Fatalf("ValidateAccessToken error: %v", err)
	}
	if got != userID {
		t.Errorf("expected userID %q, got %q", userID, got)
	}
}

func TestValidateExpiredToken(t *testing.T) {
	svc := &AuthService{
		jwtSecret:  []byte("test_secret"),
		accessTTL:  -time.Second,
		refreshTTL: 168 * time.Hour,
	}

	token, err := svc.generateAccessToken("user-id")
	if err != nil {
		t.Fatalf("generateAccessToken error: %v", err)
	}

	_, err = svc.ValidateAccessToken(token)
	if err == nil {
		t.Error("expected error for expired token, got nil")
	}
}

func TestValidateInvalidToken(t *testing.T) {
	svc := &AuthService{jwtSecret: []byte("secret")}
	_, err := svc.ValidateAccessToken("not.a.token")
	if err == nil {
		t.Error("expected error for invalid token, got nil")
	}
}
