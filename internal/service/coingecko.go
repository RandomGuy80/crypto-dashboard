package service

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/redis/go-redis/v9"

	"awesomeProject11/internal/model"
)

const coincapBase = "https://api.coincap.io/v2"

type CoinCapService struct {
	http *http.Client
	rdb  *redis.Client
}

func NewCoinCapService(rdb *redis.Client) *CoinCapService {
	return &CoinCapService{
		http: &http.Client{Timeout: 15 * time.Second},
		rdb:  rdb,
	}
}

func (s *CoinCapService) get(url string, out interface{}) error {
	resp, err := s.http.Get(url)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("coincap %s: %s", resp.Status, string(body))
	}
	return json.NewDecoder(resp.Body).Decode(out)
}

type capAsset struct {
	ID                string  `json:"id"`
	Symbol            string  `json:"symbol"`
	Name              string  `json:"name"`
	PriceUsd          *string `json:"priceUsd"`
	ChangePercent24Hr *string `json:"changePercent24Hr"`
	MarketCapUsd      *string `json:"marketCapUsd"`
	VolumeUsd24Hr     *string `json:"volumeUsd24Hr"`
}

func toFloat(s *string) float64 {
	if s == nil {
		return 0
	}
	f, _ := strconv.ParseFloat(*s, 64)
	return f
}

func (s *CoinCapService) GetTopCoins(ctx context.Context, limit int) ([]model.Coin, error) {
	cacheKey := fmt.Sprintf("coins:top:%d", limit)
	if cached, err := s.rdb.Get(ctx, cacheKey).Bytes(); err == nil {
		var coins []model.Coin
		if json.Unmarshal(cached, &coins) == nil {
			return coins, nil
		}
	}

	url := fmt.Sprintf("%s/assets?limit=%d", coincapBase, limit)
	var raw struct {
		Data []capAsset `json:"data"`
	}
	if err := s.get(url, &raw); err != nil {
		return nil, err
	}

	coins := make([]model.Coin, 0, len(raw.Data))
	for _, d := range raw.Data {
		sym := strings.ToLower(d.Symbol)
		coins = append(coins, model.Coin{
			ID:            d.ID,
			Symbol:        sym,
			Name:          d.Name,
			CurrentPrice:  toFloat(d.PriceUsd),
			PriceChange24: toFloat(d.ChangePercent24Hr),
			MarketCap:     toFloat(d.MarketCapUsd),
			Volume24h:     toFloat(d.VolumeUsd24Hr),
			Image:         fmt.Sprintf("https://assets.coincap.io/assets/icons/%s@2x.png", sym),
		})
	}

	if data, err := json.Marshal(coins); err == nil {
		s.rdb.Set(ctx, cacheKey, data, 60*time.Second)
	}
	return coins, nil
}

func (s *CoinCapService) GetGlobalMarket(ctx context.Context) (*model.GlobalMarket, error) {
	cacheKey := "market:global"
	if cached, err := s.rdb.Get(ctx, cacheKey).Bytes(); err == nil {
		var gm model.GlobalMarket
		if json.Unmarshal(cached, &gm) == nil {
			return &gm, nil
		}
	}

	url := fmt.Sprintf("%s/assets?limit=100", coincapBase)
	var raw struct {
		Data []capAsset `json:"data"`
	}
	if err := s.get(url, &raw); err != nil {
		return nil, err
	}

	var totalMC, totalVol, btcMC, ethMC float64
	for _, d := range raw.Data {
		mc := toFloat(d.MarketCapUsd)
		totalMC += mc
		totalVol += toFloat(d.VolumeUsd24Hr)
		if d.ID == "bitcoin" {
			btcMC = mc
		} else if d.ID == "ethereum" {
			ethMC = mc
		}
	}

	gm := &model.GlobalMarket{
		TotalMarketCap: totalMC,
		TotalVolume:    totalVol,
		ActiveCoins:    len(raw.Data),
	}
	if totalMC > 0 {
		gm.BTCDominance = btcMC / totalMC * 100
		gm.ETHDominance = ethMC / totalMC * 100
	}

	if data, err := json.Marshal(gm); err == nil {
		s.rdb.Set(ctx, cacheKey, data, 2*time.Minute)
	}
	return gm, nil
}

func (s *CoinCapService) GetCoinHistory(ctx context.Context, coinID string, days int) ([]model.CandlePoint, error) {
	cacheKey := fmt.Sprintf("coins:history:%s:%d", coinID, days)
	if cached, err := s.rdb.Get(ctx, cacheKey).Bytes(); err == nil {
		var candles []model.CandlePoint
		if json.Unmarshal(cached, &candles) == nil {
			return candles, nil
		}
	}

	interval := "h6"
	switch {
	case days <= 1:
		interval = "m15"
	case days <= 7:
		interval = "h2"
	case days <= 30:
		interval = "h6"
	default:
		interval = "d1"
	}

	now := time.Now()
	start := now.AddDate(0, 0, -days).UnixMilli()
	end := now.UnixMilli()

	url := fmt.Sprintf("%s/assets/%s/history?interval=%s&start=%d&end=%d", coincapBase, coinID, interval, start, end)
	var raw struct {
		Data []struct {
			PriceUsd *string `json:"priceUsd"`
			Time     int64   `json:"time"`
		} `json:"data"`
	}
	if err := s.get(url, &raw); err != nil {
		return nil, err
	}

	candles := make([]model.CandlePoint, 0, len(raw.Data))
	for _, d := range raw.Data {
		price := toFloat(d.PriceUsd)
		candles = append(candles, model.CandlePoint{
			Time:  d.Time / 1000,
			Open:  price,
			High:  price,
			Low:   price,
			Close: price,
		})
	}

	ttl := 5 * time.Minute
	if days == 1 {
		ttl = 60 * time.Second
	}
	if data, err := json.Marshal(candles); err == nil {
		s.rdb.Set(ctx, cacheKey, data, ttl)
	}
	return candles, nil
}
