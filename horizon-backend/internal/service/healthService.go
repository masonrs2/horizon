package service

import (
	"context"
	"horizon-backend/internal/db"
)

// HealthService handles health checking logic
type HealthService struct {
	queries *db.Queries
}

// NewHealthService creates a new health service
func NewHealthService(queries *db.Queries) *HealthService {
	return &HealthService{
		queries: queries,
	}
}

// Check checks the health of the application
func (s *HealthService) Check(ctx context.Context) (interface{}, error) {
	return s.queries.CheckDBConnection(ctx)
}
