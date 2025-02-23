package service

import (
	"context"
	"fmt"

	"horizon-backend/internal/model"
	"horizon-backend/internal/repository"
	"horizon-backend/internal/util"

	"github.com/jackc/pgx/v5"
)

type UserService struct {
	repo *repository.UserRepository
}

func NewUserService(repo *repository.UserRepository) *UserService {
	return &UserService{
		repo: repo,
	}
}

func (s *UserService) CreateUser(ctx context.Context, user *model.User) (*model.User, error) {
	if user.Username == "" || user.Email == "" || user.Password == "" || user.DisplayName.String == "" {
		return nil, fmt.Errorf("username, email, password and display name are required")
	}

	// Hash the password before storage
	hashedPassword, err := util.HashPassword(user.Password)
	if err != nil {
		return nil, fmt.Errorf("password hashing failed: %w", err)
	}
	user.PasswordHash = hashedPassword

	// Check if username already exists
	existingUser, err := s.repo.GetUserByUsername(ctx, user.Username)
	if err != nil && err != pgx.ErrNoRows {
		return nil, fmt.Errorf("error checking username: %w", err)
	}
	if existingUser != nil {
		return nil, fmt.Errorf("username already taken")
	}

	createdUser, err := s.repo.CreateUser(ctx, user)

	if err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	return createdUser, nil
}

func (s *UserService) GetUserByUsername(ctx context.Context, username string) (*model.User, error) {
	if (username == "" || len(username) < 3) {
		return nil, fmt.Errorf("username must be at least 3 characters long")
	}

	user, err := s.repo.GetUserByUsername(ctx, username)
	if err != nil {
		return nil, fmt.Errorf("error getting user by username: %w", err)
	}

	return user, nil
}