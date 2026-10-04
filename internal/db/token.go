package db

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

func SaveRefreshToken(ctx context.Context, pool *pgxpool.Pool, userID, token string, expiresAt time.Time) error {
	_, err := pool.Exec(ctx,
		`INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)`,
		userID, token, expiresAt,
	)
	return err
}

func GetRefreshToken(ctx context.Context, pool *pgxpool.Pool, token string) (string, error) {
	var userID string
	var expiresAt time.Time
	err := pool.QueryRow(ctx,
		`SELECT user_id, expires_at FROM refresh_tokens WHERE token = $1`,
		token,
	).Scan(&userID, &expiresAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return "", ErrNotFound
	}
	if err != nil {
		return "", err
	}
	if time.Now().After(expiresAt) {
		return "", ErrNotFound
	}
	return userID, nil
}

func DeleteRefreshToken(ctx context.Context, pool *pgxpool.Pool, token string) error {
	_, err := pool.Exec(ctx, `DELETE FROM refresh_tokens WHERE token = $1`, token)
	return err
}

func DeleteAllUserTokens(ctx context.Context, pool *pgxpool.Pool, userID string) error {
	_, err := pool.Exec(ctx, `DELETE FROM refresh_tokens WHERE user_id = $1`, userID)
	return err
}
