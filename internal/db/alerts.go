package db

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"awesomeProject11/internal/model"
)

func CreateAlert(ctx context.Context, pool *pgxpool.Pool, userID, coinID string, targetPrice float64, direction string) (*model.Alert, error) {
	a := &model.Alert{}
	err := pool.QueryRow(ctx,
		`INSERT INTO alerts (user_id, coin_id, target_price, direction)
		 VALUES ($1, $2, $3, $4)
		 RETURNING id, user_id, coin_id, target_price, direction, triggered`,
		userID, coinID, targetPrice, direction,
	).Scan(&a.ID, &a.UserID, &a.CoinID, &a.TargetPrice, &a.Direction, &a.Triggered)
	return a, err
}

func GetAlerts(ctx context.Context, pool *pgxpool.Pool, userID string) ([]model.Alert, error) {
	rows, err := pool.Query(ctx,
		`SELECT id, user_id, coin_id, target_price, direction, triggered
		 FROM alerts WHERE user_id = $1`,
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var alerts []model.Alert
	for rows.Next() {
		var a model.Alert
		if err := rows.Scan(&a.ID, &a.UserID, &a.CoinID, &a.TargetPrice, &a.Direction, &a.Triggered); err != nil {
			return nil, err
		}
		alerts = append(alerts, a)
	}
	return alerts, nil
}

func GetActiveAlerts(ctx context.Context, pool *pgxpool.Pool) ([]model.Alert, error) {
	rows, err := pool.Query(ctx,
		`SELECT id, user_id, coin_id, target_price, direction, triggered
		 FROM alerts WHERE triggered = FALSE`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var alerts []model.Alert
	for rows.Next() {
		var a model.Alert
		if err := rows.Scan(&a.ID, &a.UserID, &a.CoinID, &a.TargetPrice, &a.Direction, &a.Triggered); err != nil {
			return nil, err
		}
		alerts = append(alerts, a)
	}
	return alerts, nil
}

func TriggerAlert(ctx context.Context, pool *pgxpool.Pool, id string) error {
	_, err := pool.Exec(ctx, `UPDATE alerts SET triggered = TRUE WHERE id = $1`, id)
	return err
}

func DeleteAlert(ctx context.Context, pool *pgxpool.Pool, id, userID string) error {
	tag, err := pool.Exec(ctx,
		`DELETE FROM alerts WHERE id = $1 AND user_id = $2`,
		id, userID,
	)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func GetAlertByID(ctx context.Context, pool *pgxpool.Pool, id string) (*model.Alert, error) {
	a := &model.Alert{}
	err := pool.QueryRow(ctx,
		`SELECT id, user_id, coin_id, target_price, direction, triggered FROM alerts WHERE id = $1`,
		id,
	).Scan(&a.ID, &a.UserID, &a.CoinID, &a.TargetPrice, &a.Direction, &a.Triggered)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	return a, err
}
