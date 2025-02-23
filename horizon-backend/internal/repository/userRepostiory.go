package repository

import (
	"context"
	"fmt"

	"horizon-backend/internal/db"
	"horizon-backend/internal/model"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

type UserRepository struct {
	queries *db.Queries
}

func NewUserRepository(queries *db.Queries) *UserRepository {
	return &UserRepository{
		queries: queries,
	}
}

func (r *UserRepository) CreateUser(ctx context.Context, user *model.User) (*model.User, error) {
	// Validate required fields
	if user.Username == "" || user.Email == "" || user.PasswordHash == "" || user.DisplayName.String == "" {
		return nil, fmt.Errorf("username, email, password and display name are required")
	}

	// Convert model.User to db.CreateUserParams
	params := db.CreateUserParams{
		Username:     user.Username,
		Email:        user.Email,
		PasswordHash: user.PasswordHash,
		DisplayName:  user.DisplayName,
	}

	// Create user in database
	dbUser, err := r.queries.CreateUser(ctx, params)
	if err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	// Convert db.CreateUserRow back to model.User
	return &model.User{
		ID:            dbUser.ID,
		Username:      dbUser.Username,
		Email:         dbUser.Email,
		PasswordHash:  dbUser.PasswordHash,
		DisplayName:   dbUser.DisplayName,
		AvatarUrl:     pgtype.Text{String: dbUser.AvatarUrl, Valid: dbUser.AvatarUrl != ""},
		Bio:           pgtype.Text{String: dbUser.Bio, Valid: dbUser.Bio != ""},
		IsPrivate:     dbUser.IsPrivate,
		CreatedAt:     dbUser.CreatedAt,
		UpdatedAt:     dbUser.UpdatedAt,
		DeletedAt:     dbUser.DeletedAt,
		EmailVerified: dbUser.EmailVerified,
		LastLogin:     dbUser.LastLogin,
	}, nil
}

func (r *UserRepository) GetUserById(ctx context.Context, id pgtype.UUID) (*model.User, error) {
	dbUser, err := r.queries.GetUserByID(ctx, id)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("user not found with id %v", id.String)
		}
		return nil, fmt.Errorf("failed to get user by id: %w", err)
	}

	// Check for soft delete
	if !dbUser.DeletedAt.Time.IsZero() {
		return nil, fmt.Errorf("user has been deleted")
	}

	return &model.User{
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
	}, nil
}

func (r *UserRepository) GetUserByUsername(ctx context.Context, username string) (*model.User, error) {
	dbUser, err := r.queries.GetUserByUsername(ctx, username)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, err
		}
		return nil, fmt.Errorf("failed to get user by username: %w", err)
	}

	return &model.User{
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
	}, nil
}
