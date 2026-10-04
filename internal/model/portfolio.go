package model

type Holding struct {
	ID        string  `json:"id"`
	UserID    string  `json:"user_id"`
	CoinID    string  `json:"coin_id"`
	Amount    float64 `json:"amount"`
	BuyPrice  float64 `json:"buy_price"`
}

type HoldingWithValue struct {
	Holding
	CurrentPrice float64 `json:"current_price"`
	CurrentValue float64 `json:"current_value"`
	PnL          float64 `json:"pnl"`
}

type HoldingRequest struct {
	CoinID   string  `json:"coin_id"`
	Amount   float64 `json:"amount"`
	BuyPrice float64 `json:"buy_price"`
}
