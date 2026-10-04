package ws

import (
	"log"
	"time"

	fws "github.com/gofiber/contrib/websocket"
)

const (
	writeWait  = 10 * time.Second
	pongWait   = 60 * time.Second
	pingPeriod = 50 * time.Second
	maxMsgSize = 512
)

func ServeClient(hub *Hub, conn *fws.Conn) {
	client := &Client{conn: conn, send: make(chan []byte, 256)}
	hub.Register(client)

	go writePump(hub, client)
	readPump(hub, client)
}

func readPump(hub *Hub, c *Client) {
	defer func() {
		hub.Unregister(c)
		c.conn.Close()
	}()
	c.conn.SetReadLimit(maxMsgSize)
	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})
	for {
		_, _, err := c.conn.ReadMessage()
		if err != nil {
			break
		}
	}
}

func writePump(hub *Hub, c *Client) {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()
	for {
		select {
		case msg, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				c.conn.WriteMessage(fws.CloseMessage, []byte{})
				return
			}
			if err := c.conn.WriteMessage(fws.TextMessage, msg); err != nil {
				log.Printf("ws write error: %v", err)
				return
			}
		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(fws.PingMessage, nil); err != nil {
				return
			}
		}
	}
}
