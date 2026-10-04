package model

type Alert struct {
	ID          string  `json:"id"`
	UserID      string  `json:"user_id"`
	CoinID      string  `json:"coin_id"`
	TargetPrice float64 `json:"target_price"`
	Direction   string  `json:"direction"`
	Triggered   bool    `json:"triggered"`
}

type AlertRequest struct {
	CoinID      string  `json:"coin_id"`
	TargetPrice float64 `json:"target_price"`
	Direction   string  `json:"direction"`
}
