package handler

import (
	"errors"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"

	"awesomeProject11/internal/db"
	"awesomeProject11/internal/model"
	"awesomeProject11/internal/service"
)

type UserHandler struct {
	pool      *pgxpool.Pool
	coinSvc   *service.CoinCapService
	alertsSvc *service.AlertsService
}

func NewUserHandler(pool *pgxpool.Pool, coinSvc *service.CoinCapService, alertsSvc *service.AlertsService) *UserHandler {
	return &UserHandler{pool: pool, coinSvc: coinSvc, alertsSvc: alertsSvc}
}

func userID(c *fiber.Ctx) string {
	return c.Locals("user_id").(string)
}

// Watchlist

func (h *UserHandler) GetWatchlist(c *fiber.Ctx) error {
	items, err := db.GetWatchlist(c.Context(), h.pool, userID(c))
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "internal error"})
	}
	if items == nil {
		items = []model.WatchlistItem{}
	}
	return c.JSON(items)
}

func (h *UserHandler) AddToWatchlist(c *fiber.Ctx) error {
	coinID := c.Params("coin_id")
	if err := db.AddToWatchlist(c.Context(), h.pool, userID(c), coinID); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "internal error"})
	}
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"message": "added"})
}

func (h *UserHandler) RemoveFromWatchlist(c *fiber.Ctx) error {
	coinID := c.Params("coin_id")
	if err := db.RemoveFromWatchlist(c.Context(), h.pool, userID(c), coinID); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "internal error"})
	}
	return c.JSON(fiber.Map{"message": "removed"})
}

// Portfolio

func (h *UserHandler) GetPortfolio(c *fiber.Ctx) error {
	holdings, err := db.GetPortfolio(c.Context(), h.pool, userID(c))
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "internal error"})
	}

	coins, _ := h.coinSvc.GetTopCoins(c.Context(), 100)
	priceMap := make(map[string]float64)
	for _, coin := range coins {
		priceMap[coin.ID] = coin.CurrentPrice
	}

	result := make([]model.HoldingWithValue, 0, len(holdings))
	for _, h := range holdings {
		price := priceMap[h.CoinID]
		result = append(result, model.HoldingWithValue{
			Holding:      h,
			CurrentPrice: price,
			CurrentValue: price * h.Amount,
			PnL:          (price - h.BuyPrice) * h.Amount,
		})
	}
	return c.JSON(result)
}

func (h *UserHandler) AddHolding(c *fiber.Ctx) error {
	var req model.HoldingRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid body"})
	}
	holding, err := db.AddHolding(c.Context(), h.pool, userID(c), req.CoinID, req.Amount, req.BuyPrice)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "internal error"})
	}
	return c.Status(fiber.StatusCreated).JSON(holding)
}

func (h *UserHandler) UpdateHolding(c *fiber.Ctx) error {
	id := c.Params("id")
	var req model.HoldingRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid body"})
	}
	holding, err := db.UpdateHolding(c.Context(), h.pool, id, userID(c), req.Amount, req.BuyPrice)
	if errors.Is(err, db.ErrNotFound) {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "not found"})
	}
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "internal error"})
	}
	return c.JSON(holding)
}

func (h *UserHandler) DeleteHolding(c *fiber.Ctx) error {
	id := c.Params("id")
	if err := db.DeleteHolding(c.Context(), h.pool, id, userID(c)); err != nil {
		if errors.Is(err, db.ErrNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "not found"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "internal error"})
	}
	return c.JSON(fiber.Map{"message": "deleted"})
}

// Alerts

func (h *UserHandler) GetAlerts(c *fiber.Ctx) error {
	alerts, err := db.GetAlerts(c.Context(), h.pool, userID(c))
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "internal error"})
	}
	if alerts == nil {
		alerts = []model.Alert{}
	}
	return c.JSON(alerts)
}

func (h *UserHandler) CreateAlert(c *fiber.Ctx) error {
	var req model.AlertRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid body"})
	}
	if req.Direction != "above" && req.Direction != "below" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "direction must be 'above' or 'below'"})
	}
	alert, err := db.CreateAlert(c.Context(), h.pool, userID(c), req.CoinID, req.TargetPrice, req.Direction)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "internal error"})
	}
	return c.Status(fiber.StatusCreated).JSON(alert)
}

func (h *UserHandler) DeleteAlert(c *fiber.Ctx) error {
	id := c.Params("id")
	if err := db.DeleteAlert(c.Context(), h.pool, id, userID(c)); err != nil {
		if errors.Is(err, db.ErrNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "not found"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "internal error"})
	}
	return c.JSON(fiber.Map{"message": "deleted"})
}
