package handler

import (
	"strconv"

	fws "github.com/gofiber/contrib/websocket"
	"github.com/gofiber/fiber/v2"

	"awesomeProject11/internal/service"
	internalws "awesomeProject11/internal/ws"
)

type CoinsHandler struct {
	coinSvc *service.CoinCapService
	hub     *internalws.Hub
}

func NewCoinsHandler(coinSvc *service.CoinCapService, hub *internalws.Hub) *CoinsHandler {
	return &CoinsHandler{coinSvc: coinSvc, hub: hub}
}

func (h *CoinsHandler) GetTopCoins(c *fiber.Ctx) error {
	limit, _ := strconv.Atoi(c.Query("limit", "20"))
	if limit <= 0 || limit > 100 {
		limit = 20
	}
	coins, err := h.coinSvc.GetTopCoins(c.Context(), limit)
	if err != nil {
		return c.Status(fiber.StatusBadGateway).JSON(fiber.Map{"error": "failed to fetch coins"})
	}
	return c.JSON(coins)
}

func (h *CoinsHandler) GetCoinHistory(c *fiber.Ctx) error {
	coinID := c.Params("id")
	days, _ := strconv.Atoi(c.Query("days", "7"))
	if days <= 0 {
		days = 7
	}
	candles, err := h.coinSvc.GetCoinHistory(c.Context(), coinID, days)
	if err != nil {
		return c.Status(fiber.StatusBadGateway).JSON(fiber.Map{"error": "failed to fetch history"})
	}
	return c.JSON(candles)
}

func (h *CoinsHandler) GetGlobalMarket(c *fiber.Ctx) error {
	gm, err := h.coinSvc.GetGlobalMarket(c.Context())
	if err != nil {
		return c.Status(fiber.StatusBadGateway).JSON(fiber.Map{"error": "failed to fetch market data"})
	}
	return c.JSON(gm)
}

func (h *CoinsHandler) WebSocket() fiber.Handler {
	return fws.New(func(c *fws.Conn) {
		internalws.ServeClient(h.hub, c)
	})
}
