package db

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"awesomeProject11/internal/model"
)

var ErrNotFound = errors.New("not found")

func CreateUser(ctx context.Context, pool *pgxpool.Pool, email, hashedPassword string) (*model.User, error) {
	user := &model.User{}
	err := pool.QueryRow(ctx,
		`INSERT INTO users (email, password) VALUES ($1, $2)
		 RETURNING id, email, created_at`,
		email, hashedPassword,
	).Scan(&user.ID, &user.Email, &user.CreatedAt)
	return user, err
}

func GetUserByEmail(ctx context.Context, pool *pgxpool.Pool, email string) (*model.User, error) {
	user := &model.User{}
	err := pool.QueryRow(ctx,
		`SELECT id, email, password, created_at FROM users WHERE email = $1`,
		email,
	).Scan(&user.ID, &user.Email, &user.Password, &user.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	return user, err
}

func GetUserByID(ctx context.Context, pool *pgxpool.Pool, id string) (*model.User, error) {
	user := &model.User{}
	err := pool.QueryRow(ctx,
		`SELECT id, email, created_at FROM users WHERE id = $1`,
		id,
	).Scan(&user.ID, &user.Email, &user.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	return user, err
}
