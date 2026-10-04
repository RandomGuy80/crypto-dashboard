package db

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"awesomeProject11/internal/model"
)

func AddHolding(ctx context.Context, pool *pgxpool.Pool, userID, coinID string, amount, buyPrice float64) (*model.Holding, error) {
	h := &model.Holding{}
	err := pool.QueryRow(ctx,
		`INSERT INTO portfolio (user_id, coin_id, amount, buy_price)
		 VALUES ($1, $2, $3, $4) RETURNING id, user_id, coin_id, amount, buy_price`,
		userID, coinID, amount, buyPrice,
	).Scan(&h.ID, &h.UserID, &h.CoinID, &h.Amount, &h.BuyPrice)
	return h, err
}

func GetPortfolio(ctx context.Context, pool *pgxpool.Pool, userID string) ([]model.Holding, error) {
	rows, err := pool.Query(ctx,
		`SELECT id, user_id, coin_id, amount, buy_price FROM portfolio WHERE user_id = $1`,
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var holdings []model.Holding
	for rows.Next() {
		var h model.Holding
		if err := rows.Scan(&h.ID, &h.UserID, &h.CoinID, &h.Amount, &h.BuyPrice); err != nil {
			return nil, err
		}
		holdings = append(holdings, h)
	}
	return holdings, nil
}

func UpdateHolding(ctx context.Context, pool *pgxpool.Pool, id, userID string, amount, buyPrice float64) (*model.Holding, error) {
	h := &model.Holding{}
	err := pool.QueryRow(ctx,
		`UPDATE portfolio SET amount = $1, buy_price = $2
		 WHERE id = $3 AND user_id = $4
		 RETURNING id, user_id, coin_id, amount, buy_price`,
		amount, buyPrice, id, userID,
	).Scan(&h.ID, &h.UserID, &h.CoinID, &h.Amount, &h.BuyPrice)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	return h, err
}

func DeleteHolding(ctx context.Context, pool *pgxpool.Pool, id, userID string) error {
	tag, err := pool.Exec(ctx,
		`DELETE FROM portfolio WHERE id = $1 AND user_id = $2`,
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
