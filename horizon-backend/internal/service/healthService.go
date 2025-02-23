package service

import (
	"context"

	"horizon-backend/internal/model"
	"horizon-backend/internal/repository"
)

type HealthService struct {
	repo *repository.HealthRepository
}

func NewHealthService(repo *repository.HealthRepository) *HealthService {
	return &HealthService{
		repo: repo,
	}
}

func (s *HealthService) Check(ctx context.Context) (*model.HealthCheck, error) {
	dbTime, err := s.repo.CheckConnection(ctx)
	if err != nil {
		return nil, err
	}
	return &model.HealthCheck{
		Status: "ok",
		DBTime: dbTime.DBTime,
	}, nil
}
