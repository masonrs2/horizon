package auth

import (
	"context"
	"fmt"
	"horizon-backend/config"
	"horizon-backend/internal/db"
	"horizon-backend/internal/model"
	"horizon-backend/internal/util"
	"time"

	"encoding/hex"

	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

// LocalAuthProvider implements JWT-based authentication for development
type LocalAuthProvider struct {
	queries *db.Queries
	cfg     *config.Config
}

// NewLocalAuthProvider creates a new LocalAuthProvider
func NewLocalAuthProvider(queries *db.Queries, cfg *config.Config) *LocalAuthProvider {
	return &LocalAuthProvider{
		queries: queries,
		cfg:     cfg,
	}
}

// Login authenticates a user and returns access and refresh tokens
func (p *LocalAuthProvider) Login(ctx context.Context, username, password string) (string, string, error) {
	// Get user by username
	dbUser, err := p.queries.GetUserByUsername(ctx, username)
	if err != nil {
		if err == pgx.ErrNoRows {
			return "", "", ErrUserNotFound
		}
		return "", "", fmt.Errorf("database error: %w", err)
	}

	// Check password
	if !util.CheckPassword(password, dbUser.PasswordHash) {
		return "", "", ErrInvalidPassword
	}

	// Generate access token (short-lived)
	accessToken, err := p.generateAccessToken(dbUser.ID)
	if err != nil {
		return "", "", fmt.Errorf("error generating access token: %w", err)
	}

	// Generate refresh token (long-lived)
	refreshToken, err := p.generateRefreshToken(dbUser.ID)
	if err != nil {
		return "", "", fmt.Errorf("error generating refresh token: %w", err)
	}

	return accessToken, refreshToken, nil
}

// Register creates a new user and returns the user model
func (p *LocalAuthProvider) Register(ctx context.Context, username, email, password, displayName string) (*model.User, error) {
	// Hash the password
	hashedPassword, err := util.HashPassword(password)
	if err != nil {
		return nil, fmt.Errorf("error hashing password: %w", err)
	}

	// Create params for DB query
	displayNameParam := pgtype.Text{String: displayName, Valid: displayName != ""}
	createParams := db.CreateUserParams{
		Username:     username,
		Email:        email,
		PasswordHash: hashedPassword,
		DisplayName:  displayNameParam,
	}

	// Create user in database
	createdUser, err := p.queries.CreateUser(ctx, createParams)
	if err != nil {
		return nil, fmt.Errorf("error creating user: %w", err)
	}

	// Convert to model.User
	result := &model.User{
		ID:            createdUser.ID,
		Username:      createdUser.Username,
		Email:         createdUser.Email,
		PasswordHash:  createdUser.PasswordHash,
		DisplayName:   pgtype.Text{String: createdUser.DisplayName.String, Valid: createdUser.DisplayName.Valid},
		AvatarUrl:     pgtype.Text{String: createdUser.AvatarUrl, Valid: createdUser.AvatarUrl != ""},
		Bio:           pgtype.Text{String: createdUser.Bio, Valid: createdUser.Bio != ""},
		IsPrivate:     createdUser.IsPrivate,
		CreatedAt:     createdUser.CreatedAt,
		UpdatedAt:     createdUser.UpdatedAt,
		DeletedAt:     createdUser.DeletedAt,
		EmailVerified: createdUser.EmailVerified,
		LastLogin:     createdUser.LastLogin,
	}

	return result, nil
}

// RefreshToken refreshes an access token using a refresh token
func (p *LocalAuthProvider) RefreshToken(ctx context.Context, refreshToken string) (string, string, error) {
	// Parse and validate refresh token
	userID, err := p.parseToken(refreshToken, true)
	if err != nil {
		return "", "", fmt.Errorf("invalid refresh token: %w", err)
	}

	// Generate new access token
	accessToken, err := p.generateAccessToken(userID)
	if err != nil {
		return "", "", fmt.Errorf("error generating access token: %w", err)
	}

	// Generate new refresh token
	newRefreshToken, err := p.generateRefreshToken(userID)
	if err != nil {
		return "", "", fmt.Errorf("error generating refresh token: %w", err)
	}

	return accessToken, newRefreshToken, nil
}

// VerifyToken verifies an access token and returns the user ID
func (p *LocalAuthProvider) VerifyToken(ctx context.Context, token string) (pgtype.UUID, error) {
	// Parse and validate the token
	userID, err := p.parseToken(token, false)
	if err != nil {
		return pgtype.UUID{}, fmt.Errorf("invalid token: %w", err)
	}

	return userID, nil
}

// GetUserFromToken gets a user from a token
func (p *LocalAuthProvider) GetUserFromToken(ctx context.Context, token string) (*model.User, error) {
	// Get user ID from token
	userID, err := p.VerifyToken(ctx, token)
	if err != nil {
		return nil, err
	}

	// Get user from database
	dbUser, err := p.queries.GetUserByID(ctx, userID)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, ErrUserNotFound
		}
		return nil, fmt.Errorf("database error: %w", err)
	}

	// Convert to model.User
	modelUser := &model.User{
		ID:            dbUser.ID,
		Username:      dbUser.Username,
		Email:         dbUser.Email,
		PasswordHash:  dbUser.PasswordHash,
		DisplayName:   dbUser.DisplayName,
		AvatarUrl:     dbUser.AvatarUrl,
		Bio:           dbUser.Bio,
		IsPrivate:     dbUser.IsPrivate,
		CreatedAt:     dbUser.CreatedAt,
		UpdatedAt:     dbUser.UpdatedAt,
		DeletedAt:     dbUser.DeletedAt,
		EmailVerified: dbUser.EmailVerified,
		LastLogin:     dbUser.LastLogin,
	}

	return modelUser, nil
}

// Helper methods

// generateAccessToken generates a short-lived access token
func (p *LocalAuthProvider) generateAccessToken(userID pgtype.UUID) (string, error) {
	// Create a unique identifier for the userID
	idStr := fmt.Sprintf("%x", userID.Bytes)

	// Create claims with expiration (15 minutes)
	// Use time.Now().Add(-1 * time.Second) for IssuedAt to provide a small buffer
	now := time.Now()
	claims := jwt.RegisteredClaims{
		Subject:   idStr,
		IssuedAt:  jwt.NewNumericDate(now.Add(-1 * time.Second)), // 1 second buffer
		ExpiresAt: jwt.NewNumericDate(now.Add(15 * time.Minute)),
	}

	// Create token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// Sign token
	return token.SignedString([]byte(p.cfg.JWTSecret))
}

// generateRefreshToken generates a long-lived refresh token
func (p *LocalAuthProvider) generateRefreshToken(userID pgtype.UUID) (string, error) {
	// Create a unique identifier for the userID
	idStr := fmt.Sprintf("%x", userID.Bytes)

	// Create claims with expiration (7 days)
	// Use time.Now().Add(-1 * time.Second) for IssuedAt to provide a small buffer
	now := time.Now()
	claims := jwt.RegisteredClaims{
		Subject:   idStr,
		IssuedAt:  jwt.NewNumericDate(now.Add(-1 * time.Second)), // 1 second buffer
		ExpiresAt: jwt.NewNumericDate(now.Add(7 * 24 * time.Hour)),
	}

	// Create token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// Sign token
	return token.SignedString([]byte(p.cfg.JWTSecret))
}

// parseToken parses and validates a JWT token
func (p *LocalAuthProvider) parseToken(tokenString string, isRefresh bool) (pgtype.UUID, error) {
	// Parse token with clock skew tolerance
	parser := jwt.NewParser(jwt.WithLeeway(2 * time.Second)) // Allow 2 seconds of clock skew
	token, err := parser.ParseWithClaims(tokenString, &jwt.RegisteredClaims{}, func(token *jwt.Token) (interface{}, error) {
		// Validate signing method
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(p.cfg.JWTSecret), nil
	})

	if err != nil {
		return pgtype.UUID{}, err
	}

	// Validate token and extract claims
	if claims, ok := token.Claims.(*jwt.RegisteredClaims); ok && token.Valid {
		// Check if token is expired
		if claims.ExpiresAt.Time.Before(time.Now()) {
			return pgtype.UUID{}, ErrExpiredToken
		}

		// Extract user ID from subject claim
		if claims.Subject == "" {
			return pgtype.UUID{}, ErrInvalidToken
		}

		// Convert hex string back to UUID bytes
		idBytes, err := hex.DecodeString(claims.Subject)
		if err != nil {
			return pgtype.UUID{}, fmt.Errorf("invalid user ID in token: %w", err)
		}

		// Create UUID from bytes
		uuid := pgtype.UUID{
			Valid: true,
		}

		// Copy bytes to UUID
		copy(uuid.Bytes[:], idBytes)

		return uuid, nil
	}

	return pgtype.UUID{}, ErrInvalidToken
}
