package auth

import (
	"context"
	"errors"
	"horizon-backend/config"
	"horizon-backend/internal/db"
	"horizon-backend/internal/model"

	"github.com/jackc/pgx/v5/pgtype"
)

// Common errors
var (
	ErrUserNotFound    = errors.New("user not found")
	ErrInvalidPassword = errors.New("invalid password")
	ErrInvalidToken    = errors.New("invalid token")
	ErrExpiredToken    = errors.New("token is expired")
)

// AuthProvider defines the interface for authentication providers
type AuthProvider interface {
	// Register registers a new user
	Register(ctx context.Context, username, email, password, displayName string) (*model.User, error)

	// Login authenticates a user and returns access and refresh tokens
	Login(ctx context.Context, username, password string) (string, string, error)

	// RefreshToken refreshes an access token using a refresh token
	RefreshToken(ctx context.Context, refreshToken string) (string, string, error)

	// VerifyToken verifies an access token and returns the user ID
	VerifyToken(ctx context.Context, token string) (pgtype.UUID, error)

	// GetUserFromToken gets a user from a token
	GetUserFromToken(ctx context.Context, token string) (*model.User, error)
}

// GetAuthProvider returns the appropriate auth provider based on configuration
func GetAuthProvider(queries *db.Queries, cfg *config.Config) AuthProvider {
	if cfg.Environment == "production" && cfg.NeonAuth.Enabled {
		// For Neon Auth in production when enabled
		return NewNeonAuthProvider(queries, cfg)
	}
	// Use local JWT auth for development or when Neon Auth is not enabled
	return NewLocalAuthProvider(queries, cfg)
}
