package service

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/redis/go-redis/v9"

	"awesomeProject11/internal/model"
)

type CoinGeckoService struct {
	baseURL string
	rdb     *redis.Client
	http    *http.Client
}

func NewCoinGeckoService(baseURL string, rdb *redis.Client) *CoinGeckoService {
	return &CoinGeckoService{
		baseURL: baseURL,
		rdb:     rdb,
		http:    &http.Client{Timeout: 10 * time.Second},
	}
}

func (s *CoinGeckoService) GetTopCoins(ctx context.Context, limit int) ([]model.Coin, error) {
	cacheKey := fmt.Sprintf("coins:top:%d", limit)

	if cached, err := s.rdb.Get(ctx, cacheKey).Bytes(); err == nil {
		var coins []model.Coin
		if json.Unmarshal(cached, &coins) == nil {
			return coins, nil
		}
	}

	url := fmt.Sprintf("%s/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=%d&page=1&sparkline=true", s.baseURL, limit)
	resp, err := s.http.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var coins []model.Coin
	if err := json.Unmarshal(body, &coins); err != nil {
		return nil, err
	}

	if data, err := json.Marshal(coins); err == nil {
		s.rdb.Set(ctx, cacheKey, data, 60*time.Second)
	}

	return coins, nil
}

func (s *CoinGeckoService) GetCoinHistory(ctx context.Context, coinID string, days int) ([]model.CandlePoint, error) {
	cacheKey := fmt.Sprintf("coins:history:%s:%d", coinID, days)

	if cached, err := s.rdb.Get(ctx, cacheKey).Bytes(); err == nil {
		var candles []model.CandlePoint
		if json.Unmarshal(cached, &candles) == nil {
			return candles, nil
		}
	}

	url := fmt.Sprintf("%s/coins/%s/ohlc?vs_currency=usd&days=%d", s.baseURL, coinID, days)
	resp, err := s.http.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	// CoinGecko returns [[timestamp, open, high, low, close], ...]
	var raw [][]float64
	if err := json.Unmarshal(body, &raw); err != nil {
		return nil, err
	}

	candles := make([]model.CandlePoint, 0, len(raw))
	for _, r := range raw {
		if len(r) < 5 {
			continue
		}
		candles = append(candles, model.CandlePoint{
			Time:  int64(r[0]) / 1000,
			Open:  r[1],
			High:  r[2],
			Low:   r[3],
			Close: r[4],
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
