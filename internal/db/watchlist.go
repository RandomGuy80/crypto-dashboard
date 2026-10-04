package db

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"

	"awesomeProject11/internal/model"
)

func AddToWatchlist(ctx context.Context, pool *pgxpool.Pool, userID, coinID string) error {
	_, err := pool.Exec(ctx,
		`INSERT INTO watchlist (user_id, coin_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
		userID, coinID,
	)
	return err
}

func RemoveFromWatchlist(ctx context.Context, pool *pgxpool.Pool, userID, coinID string) error {
	_, err := pool.Exec(ctx,
		`DELETE FROM watchlist WHERE user_id = $1 AND coin_id = $2`,
		userID, coinID,
	)
	return err
}

func GetWatchlist(ctx context.Context, pool *pgxpool.Pool, userID string) ([]model.WatchlistItem, error) {
	rows, err := pool.Query(ctx,
		`SELECT id, user_id, coin_id FROM watchlist WHERE user_id = $1`,
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []model.WatchlistItem
	for rows.Next() {
		var item model.WatchlistItem
		if err := rows.Scan(&item.ID, &item.UserID, &item.CoinID); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, nil
}
