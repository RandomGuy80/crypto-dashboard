package model

type SparklineData struct {
	Price []float64 `json:"price"`
}

type Coin struct {
	ID            string         `json:"id"`
	Symbol        string         `json:"symbol"`
	Name          string         `json:"name"`
	CurrentPrice  float64        `json:"current_price"`
	PriceChange24 float64        `json:"price_change_percentage_24h"`
	MarketCap     float64        `json:"market_cap"`
	Volume24h     float64        `json:"total_volume"`
	Image         string         `json:"image"`
	Sparkline     *SparklineData `json:"sparkline_in_7d,omitempty"`
}

type CandlePoint struct {
	Time   int64   `json:"time"`
	Open   float64 `json:"open"`
	High   float64 `json:"high"`
	Low    float64 `json:"low"`
	Close  float64 `json:"close"`
}

type PriceUpdate struct {
	Symbol string  `json:"symbol"`
	Price  float64 `json:"price"`
}

type GlobalMarket struct {
	TotalMarketCap   float64 `json:"total_market_cap_usd"`
	TotalVolume      float64 `json:"total_volume_usd"`
	BTCDominance     float64 `json:"btc_dominance"`
	ETHDominance     float64 `json:"eth_dominance"`
	MarketCapChange  float64 `json:"market_cap_change_24h"`
	ActiveCoins      int     `json:"active_cryptocurrencies"`
}
