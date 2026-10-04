package service

import (
	"context"
	"log"
	"strconv"

	"github.com/jackc/pgx/v5/pgxpool"

	"awesomeProject11/internal/db"
)

type AlertsService struct {
	pool *pgxpool.Pool
}

func NewAlertsService(pool *pgxpool.Pool) *AlertsService {
	return &AlertsService{pool: pool}
}

func (s *AlertsService) CheckAlerts(ctx context.Context, symbol string, priceStr string) {
	price, err := strconv.ParseFloat(priceStr, 64)
	if err != nil {
		return
	}

	alerts, err := db.GetActiveAlerts(ctx, s.pool)
	if err != nil {
		return
	}

	for _, a := range alerts {
		if a.CoinID != symbol {
			continue
		}
		triggered := false
		if a.Direction == "above" && price >= a.TargetPrice {
			triggered = true
		} else if a.Direction == "below" && price <= a.TargetPrice {
			triggered = true
		}
		if triggered {
			if err := db.TriggerAlert(ctx, s.pool, a.ID); err == nil {
				log.Printf("alert triggered: coin=%s direction=%s target=%.2f current=%.2f",
					a.CoinID, a.Direction, a.TargetPrice, price)
			}
		}
	}
}
