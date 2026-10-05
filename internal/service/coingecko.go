package service

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/redis/go-redis/v9"

	"awesomeProject11/internal/model"
)

const (
	paprikaBase = "https://api.coinpaprika.com/v1"
	binanceBase = "https://api.binance.com/api/v3"
)

type CoinCapService struct {
	http *http.Client
	rdb  *redis.Client
}

func NewCoinCapService(rdb *redis.Client) *CoinCapService {
	return &CoinCapService{
		http: &http.Client{Timeout: 20 * time.Second},
		rdb:  rdb,
	}
}

func (s *CoinCapService) get(url string, out interface{}) error {
	resp, err := s.http.Get(url)
	if err != nil {
		return fmt.Errorf("http get %s: %w", url, err)
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("status %d from %s: %s", resp.StatusCode, url, string(body))
	}
	return json.NewDecoder(resp.Body).Decode(out)
}

type paprikaUSD struct {
	Price            float64 `json:"price"`
	Volume24h        float64 `json:"volume_24h"`
	MarketCap        float64 `json:"market_cap"`
	PercentChange24h float64 `json:"percent_change_24h"`
}

type paprikaTicker struct {
	ID     string                `json:"id"`
	Name   string                `json:"name"`
	Symbol string                `json:"symbol"`
	Rank   int                   `json:"rank"`
	Quotes map[string]paprikaUSD `json:"quotes"`
}

func (s *CoinCapService) fetchTickers(ctx context.Context) ([]paprikaTicker, error) {
	cacheKey := "paprika:tickers:raw"
	if cached, err := s.rdb.Get(ctx, cacheKey).Bytes(); err == nil {
		var tickers []paprikaTicker
		if json.Unmarshal(cached, &tickers) == nil {
			return tickers, nil
		}
	}
	var tickers []paprikaTicker
	if err := s.get(paprikaBase+"/tickers?quotes=USD", &tickers); err != nil {
		return nil, err
	}
	if data, err := json.Marshal(tickers); err == nil {
		s.rdb.Set(ctx, cacheKey, data, 60*time.Second)
	}
	return tickers, nil
}

func (s *CoinCapService) GetTopCoins(ctx context.Context, limit int) ([]model.Coin, error) {
	cacheKey := fmt.Sprintf("coins:top:%d", limit)
	if cached, err := s.rdb.Get(ctx, cacheKey).Bytes(); err == nil {
		var coins []model.Coin
		if json.Unmarshal(cached, &coins) == nil {
			return coins, nil
		}
	}

	tickers, err := s.fetchTickers(ctx)
	if err != nil {
		log.Printf("GetTopCoins error: %v", err)
		return nil, err
	}

	if limit > len(tickers) {
		limit = len(tickers)
	}

	coins := make([]model.Coin, 0, limit)
	for _, t := range tickers[:limit] {
		usd := t.Quotes["USD"]
		sym := strings.ToLower(t.Symbol)
		coins = append(coins, model.Coin{
			ID:            t.ID,
			Symbol:        sym,
			Name:          t.Name,
			CurrentPrice:  usd.Price,
			PriceChange24: usd.PercentChange24h,
			MarketCap:     usd.MarketCap,
			Volume24h:     usd.Volume24h,
			Image:         fmt.Sprintf("https://static.coinpaprika.com/coin/%s/logo.png", t.ID),
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

	tickers, err := s.fetchTickers(ctx)
	if err != nil {
		log.Printf("GetGlobalMarket error: %v", err)
		return nil, err
	}

	var totalMC, totalVol, btcMC, ethMC float64
	count := 100
	if count > len(tickers) {
		count = len(tickers)
	}
	for _, t := range tickers[:count] {
		usd := t.Quotes["USD"]
		totalMC += usd.MarketCap
		totalVol += usd.Volume24h
		if t.ID == "btc-bitcoin" {
			btcMC = usd.MarketCap
		} else if t.ID == "eth-ethereum" {
			ethMC = usd.MarketCap
		}
	}

	gm := &model.GlobalMarket{
		TotalMarketCap: totalMC,
		TotalVolume:    totalVol,
		ActiveCoins:    len(tickers),
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

// symbolFromID extracts the trading symbol from a CoinPaprika ID.
// e.g. "btc-bitcoin" → "BTC", "eth-ethereum" → "ETH"
func symbolFromID(coinID string) string {
	if i := strings.Index(coinID, "-"); i > 0 {
		return strings.ToUpper(coinID[:i])
	}
	return strings.ToUpper(coinID)
}

func (s *CoinCapService) GetCoinHistory(ctx context.Context, coinID string, days int) ([]model.CandlePoint, error) {
	cacheKey := fmt.Sprintf("coins:history:%s:%d", coinID, days)
	if cached, err := s.rdb.Get(ctx, cacheKey).Bytes(); err == nil {
		var candles []model.CandlePoint
		if json.Unmarshal(cached, &candles) == nil {
			return candles, nil
		}
	}

	symbol := symbolFromID(coinID)
	pair := symbol + "USDT"

	interval := "1d"
	limit := days
	switch {
	case days <= 1:
		interval = "1h"
		limit = 24
	case days <= 7:
		interval = "4h"
		limit = days * 6
	case days <= 30:
		interval = "1d"
		limit = days
	default:
		interval = "1d"
		limit = days
	}

	url := fmt.Sprintf("%s/klines?symbol=%s&interval=%s&limit=%d", binanceBase, pair, interval, limit)

	var raw [][]json.RawMessage
	if err := s.get(url, &raw); err != nil {
		log.Printf("GetCoinHistory error for %s (%s): %v", coinID, pair, err)
		return nil, err
	}

	candles := make([]model.CandlePoint, 0, len(raw))
	for _, r := range raw {
		if len(r) < 5 {
			continue
		}
		var openTime int64
		if err := json.Unmarshal(r[0], &openTime); err != nil {
			continue
		}
		open := parseKlineFloat(r[1])
		high := parseKlineFloat(r[2])
		low := parseKlineFloat(r[3])
		close := parseKlineFloat(r[4])
		candles = append(candles, model.CandlePoint{
			Time:  openTime / 1000,
			Open:  open,
			High:  high,
			Low:   low,
			Close: close,
		})
	}

	ttl := 5 * time.Minute
	if days <= 1 {
		ttl = 60 * time.Second
	}
	if data, err := json.Marshal(candles); err == nil {
		s.rdb.Set(ctx, cacheKey, data, ttl)
	}
	return candles, nil
}

func parseKlineFloat(raw json.RawMessage) float64 {
	var s string
	if err := json.Unmarshal(raw, &s); err != nil {
		return 0
	}
	f, _ := strconv.ParseFloat(s, 64)
	return f
}
