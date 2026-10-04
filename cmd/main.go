package main

import (
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"

	"awesomeProject11/internal/config"
	"awesomeProject11/internal/db"
	redisclient "awesomeProject11/internal/redis"
)

func main() {
	cfg := config.Load()

	pool := db.Connect(cfg.DBURL)
	defer pool.Close()

	rdb := redisclient.Connect(cfg.RedisURL)
	defer rdb.Close()

	app := fiber.New(fiber.Config{
		AppName: "Crypto Dashboard API",
	})

	app.Use(recover.New())
	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
	}))

	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok"})
	})

	log.Printf("server starting on port %s", cfg.Port)
	if err := app.Listen(":" + cfg.Port); err != nil {
		log.Fatalf("server error: %v", err)
	}
}
