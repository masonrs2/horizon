package repository

import (
	"context"
	"time"

	"horizon-backend/internal/db"
	"horizon-backend/internal/model"
)

type HealthRepository struct {
	queries *db.Queries
}

func NewHealthRepository(queries *db.Queries) *HealthRepository {
	return &HealthRepository{
		queries: queries,
	}
}

func (r *HealthRepository) CheckConnection(ctx context.Context) (*model.HealthCheck, error) {
	dbTime, err := r.queries.CheckDBConnection(ctx)
	if err != nil {
		return nil, err
	}

	return &model.HealthCheck{
		Status: "ok",
		DBTime: dbTime.(time.Time),
	}, nil
}
