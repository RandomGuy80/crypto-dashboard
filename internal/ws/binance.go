package ws

import (
	"encoding/json"
	"log"
	"time"

	"github.com/gorilla/websocket"
)

type binanceTicker struct {
	Symbol string `json:"s"`
	Price  string `json:"c"`
}

// symbols to stream — top coins vs USDT
var defaultSymbols = []string{
	"btcusdt", "ethusdt", "bnbusdt", "solusdt", "xrpusdt",
	"adausdt", "dogeusdt", "avaxusdt", "dotusdt", "maticusdt",
}

func RunBinanceStream(hub *Hub, wsURL string) {
	for {
		if err := connectBinance(hub, wsURL); err != nil {
			log.Printf("binance stream error: %v — reconnecting in 5s", err)
		}
		time.Sleep(5 * time.Second)
	}
}

func connectBinance(hub *Hub, wsURL string) error {
	streams := ""
	for i, s := range defaultSymbols {
		if i > 0 {
			streams += "/"
		}
		streams += s + "@ticker"
	}
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
	}
}
