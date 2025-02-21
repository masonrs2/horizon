package db

import (
	"context"
	"fmt"

	"horizon-backend/config"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

func NewPool(cfg *config.Config) (*pgxpool.Pool, error) {
	// Neon-specific connection format
	connStr := fmt.Sprintf(
		"postgres://%s:%s@%s/%s?sslmode=disable",
		cfg.DBUser,
		cfg.DBPassword,
		cfg.DBHost, // Contains Neon endpoint ID
		cfg.DBName,
	)

	// Enable prepared statements cache
	config, _ := pgxpool.ParseConfig(connStr)
	config.ConnConfig.DefaultQueryExecMode = pgx.QueryExecModeCacheStatement

	return pgxpool.NewWithConfig(context.Background(), config)
}
