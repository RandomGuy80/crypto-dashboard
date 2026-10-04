package main

import (
	"log"

	fws "github.com/gofiber/contrib/websocket"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"

	"awesomeProject11/internal/config"
	"awesomeProject11/internal/db"
	"awesomeProject11/internal/handler"
	"awesomeProject11/internal/middleware"
	redisclient "awesomeProject11/internal/redis"
	"awesomeProject11/internal/service"
	"awesomeProject11/internal/ws"
)

func main() {
	cfg := config.Load()

	pool := db.Connect(cfg.DBURL)
	defer pool.Close()

	rdb := redisclient.Connect(cfg.RedisURL)
	defer rdb.Close()

	alertsSvc := service.NewAlertsService(pool)
	coinSvc := service.NewCoinGeckoService(cfg.CoinGeckoURL, rdb)
	authSvc := service.NewAuthService(pool, cfg.JWTSecret, cfg.JWTAccessTTL, cfg.JWTRefreshTTL)

	hub := ws.NewHub()
	go ws.RunBinanceStream(hub, cfg.BinanceWS, alertsSvc)

	authHandler := handler.NewAuthHandler(authSvc)
	coinsHandler := handler.NewCoinsHandler(coinSvc, hub)
	userHandler := handler.NewUserHandler(pool, coinSvc, alertsSvc)
	authMiddleware := middleware.Auth(authSvc)

	app := fiber.New(fiber.Config{AppName: "Crypto Dashboard API"})

	app.Use(recover.New())
	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
	}))

	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok"})
	})

	api := app.Group("/api")

	auth := api.Group("/auth")
	auth.Post("/register", authHandler.Register)
	auth.Post("/login", authHandler.Login)
	auth.Post("/refresh", authHandler.Refresh)
	auth.Post("/logout", authMiddleware, authHandler.Logout)

	coins := api.Group("/coins")
	coins.Get("/", coinsHandler.GetTopCoins)
	coins.Get("/:id/history", coinsHandler.GetCoinHistory)
	api.Get("/market/global", coinsHandler.GetGlobalMarket)

	watchlist := api.Group("/watchlist", authMiddleware)
	watchlist.Get("/", userHandler.GetWatchlist)
	watchlist.Post("/:coin_id", userHandler.AddToWatchlist)
	watchlist.Delete("/:coin_id", userHandler.RemoveFromWatchlist)

	portfolio := api.Group("/portfolio", authMiddleware)
	portfolio.Get("/", userHandler.GetPortfolio)
	portfolio.Post("/", userHandler.AddHolding)
	portfolio.Put("/:id", userHandler.UpdateHolding)
	portfolio.Delete("/:id", userHandler.DeleteHolding)

	alerts := api.Group("/alerts", authMiddleware)
	alerts.Get("/", userHandler.GetAlerts)
	alerts.Post("/", userHandler.CreateAlert)
	alerts.Delete("/:id", userHandler.DeleteAlert)

	app.Use("/api/ws", func(c *fiber.Ctx) error {
		if fws.IsWebSocketUpgrade(c) {
			return c.Next()
		}
		return fiber.ErrUpgradeRequired
	})
	app.Get("/api/ws", coinsHandler.WebSocket())

	log.Printf("server starting on port %s", cfg.Port)
	if err := app.Listen(":" + cfg.Port); err != nil {
		log.Fatalf("server error: %v", err)
	}
}
