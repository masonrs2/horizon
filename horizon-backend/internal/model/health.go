package model

import "time"

type HealthCheck struct {
	Status string    `json:"status"`
	DBTime time.Time `json:"db_time"`
}
