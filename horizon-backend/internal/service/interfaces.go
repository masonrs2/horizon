package service

import (
	"context"
	"horizon-backend/internal/model"

	"github.com/jackc/pgx/v5/pgtype"
)

// Interfaces for service layer dependencies
type AuthService interface {
	GetUserByUsername(ctx context.Context, username string) (*model.User, error)
	GetUserByID(ctx context.Context, id pgtype.UUID) (*model.User, error)
}
