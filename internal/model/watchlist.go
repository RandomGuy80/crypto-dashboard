package model

type WatchlistItem struct {
	ID     string `json:"id"`
	UserID string `json:"user_id"`
	CoinID string `json:"coin_id"`
}

type WatchlistAddRequest struct {
	CoinID string `json:"coin_id"`
}
