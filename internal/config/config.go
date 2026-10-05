package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port              string
	DBURL             string
	RedisURL          string
	JWTSecret         string
	JWTAccessTTL      string
	JWTRefreshTTL     string
	BinanceWS         string
}

func Load() *Config {
	if err := godotenv.Load(); err != nil {
		log.Println("no .env file, reading from environment")
	}

	return &Config{
		Port:          getEnv("PORT", "8080"),
		DBURL:         mustEnv("DB_URL"),
		RedisURL:      mustEnv("REDIS_URL"),
		JWTSecret:     mustEnv("JWT_SECRET"),
		JWTAccessTTL:  getEnv("JWT_ACCESS_TTL", "15m"),
		JWTRefreshTTL: getEnv("JWT_REFRESH_TTL", "168h"),
		BinanceWS: getEnv("BINANCE_WS_URL", "wss://stream.binance.com:9443/ws"),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func mustEnv(key string) string {
	v := os.Getenv(key)
	if v == "" {
		log.Fatalf("required env var %s is not set", key)
	}
	return v
}
