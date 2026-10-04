package ws

import (
	"context"
	"encoding/json"
	"log"
	"strings"
	"time"

	"github.com/gorilla/websocket"
)

type binanceTicker struct {
	Symbol string `json:"s"`
	Price  string `json:"c"`
}

type AlertChecker interface {
	CheckAlerts(ctx context.Context, symbol string, price string)
}

var defaultSymbols = []string{
	"btcusdt", "ethusdt", "bnbusdt", "solusdt", "xrpusdt",
	"adausdt", "dogeusdt", "avaxusdt", "dotusdt", "maticusdt",
}

func RunBinanceStream(hub *Hub, wsURL string, alertChecker AlertChecker) {
	for {
		if err := connectBinance(hub, wsURL, alertChecker); err != nil {
			log.Printf("binance stream error: %v — reconnecting in 5s", err)
		}
		time.Sleep(5 * time.Second)
	}
}

func connectBinance(hub *Hub, wsURL string, alertChecker AlertChecker) error {
	streams := strings.Join(func() []string {
		s := make([]string, len(defaultSymbols))
		for i, sym := range defaultSymbols {
			s[i] = sym + "@ticker"
		}
		return s
	}(), "/")
	url := wsURL + "/stream?streams=" + streams

	conn, _, err := websocket.DefaultDialer.Dial(url, nil)
	if err != nil {
		return err
	}
	defer conn.Close()
	log.Println("binance stream connected")

	type streamMsg struct {
		Data binanceTicker `json:"data"`
	}

	for {
		_, raw, err := conn.ReadMessage()
		if err != nil {
			return err
		}
		var msg streamMsg
		if err := json.Unmarshal(raw, &msg); err != nil {
			continue
		}
		out, _ := json.Marshal(map[string]string{
			"symbol": msg.Data.Symbol,
			"price":  msg.Data.Price,
		})
		hub.Broadcast(out)

		if alertChecker != nil {
			go alertChecker.CheckAlerts(context.Background(), msg.Data.Symbol, msg.Data.Price)
		}
	}
}
