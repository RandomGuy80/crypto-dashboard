package service

import (
	"context"
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"

	"awesomeProject11/internal/db"
	"awesomeProject11/internal/model"

	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrEmailTaken         = errors.New("email already taken")
)

type AuthService struct {
	pool          *pgxpool.Pool
	jwtSecret     []byte
	accessTTL     time.Duration
	refreshTTL    time.Duration
}

func NewAuthService(pool *pgxpool.Pool, jwtSecret, accessTTL, refreshTTL string) *AuthService {
	aTTL, _ := time.ParseDuration(accessTTL)
	rTTL, _ := time.ParseDuration(refreshTTL)
	return &AuthService{
		pool:       pool,
		jwtSecret:  []byte(jwtSecret),
		accessTTL:  aTTL,
		refreshTTL: rTTL,
	}
}

func (s *AuthService) Register(ctx context.Context, email, password string) (*model.AuthResponse, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}
	user, err := db.CreateUser(ctx, s.pool, email, string(hash))
	if err != nil {
		return nil, ErrEmailTaken
	}
	return s.issueTokens(ctx, user.ID)
}

func (s *AuthService) Login(ctx context.Context, email, password string) (*model.AuthResponse, error) {
	user, err := db.GetUserByEmail(ctx, s.pool, email)
	if errors.Is(err, db.ErrNotFound) {
		return nil, ErrInvalidCredentials
	}
	if err != nil {
		return nil, err
	}
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
		return nil, ErrInvalidCredentials
	}
	return s.issueTokens(ctx, user.ID)
}

func (s *AuthService) Refresh(ctx context.Context, refreshToken string) (*model.AuthResponse, error) {
	userID, err := db.GetRefreshToken(ctx, s.pool, refreshToken)
	if errors.Is(err, db.ErrNotFound) {
		return nil, ErrInvalidCredentials
	}
	if err != nil {
		return nil, err
	}
	if err := db.DeleteRefreshToken(ctx, s.pool, refreshToken); err != nil {
		return nil, err
	}
	return s.issueTokens(ctx, userID)
}

func (s *AuthService) Logout(ctx context.Context, userID string) error {
	return db.DeleteAllUserTokens(ctx, s.pool, userID)
}

func (s *AuthService) ValidateAccessToken(tokenStr string) (string, error) {
	token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return s.jwtSecret, nil
	})
	if err != nil || !token.Valid {
		return "", ErrInvalidCredentials
	}
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return "", ErrInvalidCredentials
	}
	userID, ok := claims["sub"].(string)
	if !ok {
		return "", ErrInvalidCredentials
	}
	return userID, nil
}

func (s *AuthService) issueTokens(ctx context.Context, userID string) (*model.AuthResponse, error) {
	accessToken, err := s.generateAccessToken(userID)
	if err != nil {
		return nil, err
	}
	refreshToken := uuid.NewString()
	expiresAt := time.Now().Add(s.refreshTTL)
	if err := db.SaveRefreshToken(ctx, s.pool, userID, refreshToken, expiresAt); err != nil {
		return nil, err
	}
	return &model.AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	}, nil
}

func (s *AuthService) generateAccessToken(userID string) (string, error) {
	claims := jwt.MapClaims{
		"sub": userID,
		"exp": time.Now().Add(s.accessTTL).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(s.jwtSecret)
}
