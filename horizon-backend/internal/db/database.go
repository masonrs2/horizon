package db

import (
	"context"
	"fmt"

	"horizon-backend/config"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

func NewPool(cfg *config.Config) (*pgxpool.Pool, error) {
	connStr := fmt.Sprintf(
		"postgres://%s:%s@%s:%d/%s?sslmode=disable",
		cfg.DBUser,
		cfg.DBPassword,
		cfg.DBHost,
		cfg.DBPort,
		cfg.DBName,
	)

	// Enable prepared statements cache
	config, _ := pgxpool.ParseConfig(connStr)
	config.ConnConfig.DefaultQueryExecMode = pgx.QueryExecModeCacheStatement

	return pgxpool.NewWithConfig(context.Background(), config)
}
