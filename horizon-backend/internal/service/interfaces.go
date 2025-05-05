package service

import (
	"context"
	"horizon-backend/internal/model"
)

// Interfaces for service layer dependencies
type AuthService interface {
	GetUserByUsername(ctx context.Context, username string) (*model.User, error)
}
