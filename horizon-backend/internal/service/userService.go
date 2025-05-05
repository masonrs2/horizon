package service

import (
	"context"
	"fmt"

	"horizon-backend/internal/db"
	"horizon-backend/internal/model"
	"horizon-backend/internal/util"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

// UserService handles user-related business logic
type UserService struct {
	queries *db.Queries
}

// NewUserService creates a new user service
func NewUserService(queries *db.Queries) *UserService {
	return &UserService{
		queries: queries,
	}
}

// GetUserByUsername gets a user by username
func (s *UserService) GetUserByUsername(ctx context.Context, username string) (*model.User, error) {
	// Get user by username
	dbUser, err := s.queries.GetUserByUsername(ctx, username)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("user not found")
		}
		return nil, fmt.Errorf("error getting user by username: %w", err)
	}

	// Get user stats
	stats, err := s.queries.GetUserStats(ctx, dbUser.ID)
	if err != nil {
		return nil, fmt.Errorf("error getting user stats: %w", err)
	}

	// Convert to model user
	user := &model.User{
		ID:             dbUser.ID,
		Username:       dbUser.Username,
		Email:          dbUser.Email,
		PasswordHash:   dbUser.PasswordHash,
		DisplayName:    dbUser.DisplayName,
		AvatarUrl:      dbUser.AvatarUrl,
		Bio:            dbUser.Bio,
		Location:       dbUser.Location,
		Website:        dbUser.Website,
		IsPrivate:      dbUser.IsPrivate,
		CreatedAt:      dbUser.CreatedAt,
		UpdatedAt:      dbUser.UpdatedAt,
		DeletedAt:      dbUser.DeletedAt,
		EmailVerified:  dbUser.EmailVerified,
		LastLogin:      dbUser.LastLogin,
		FollowersCount: stats.FollowersCount,
		FollowingCount: stats.FollowingCount,
	}

	return user, nil
}

// GetUserByID gets a user by ID
func (s *UserService) GetUserByID(ctx context.Context, id pgtype.UUID) (*model.User, error) {
	dbUser, err := s.queries.GetUserByID(ctx, id)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("user not found")
		}
		return nil, fmt.Errorf("error getting user by ID: %w", err)
	}

	// Get user stats
	stats, err := s.queries.GetUserStats(ctx, dbUser.ID)
	if err != nil {
		return nil, fmt.Errorf("error getting user stats: %w", err)
	}

	// Convert to model user
	user := &model.User{
		ID:             dbUser.ID,
		Username:       dbUser.Username,
		Email:          dbUser.Email,
		PasswordHash:   dbUser.PasswordHash,
		DisplayName:    dbUser.DisplayName,
		AvatarUrl:      dbUser.AvatarUrl,
		Bio:            dbUser.Bio,
		Location:       dbUser.Location,
		Website:        dbUser.Website,
		IsPrivate:      dbUser.IsPrivate,
		CreatedAt:      dbUser.CreatedAt,
		UpdatedAt:      dbUser.UpdatedAt,
		DeletedAt:      dbUser.DeletedAt,
		EmailVerified:  dbUser.EmailVerified,
		LastLogin:      dbUser.LastLogin,
		FollowersCount: stats.FollowersCount,
		FollowingCount: stats.FollowingCount,
	}

	return user, nil
}

// RegisterUser registers a new user
func (s *UserService) RegisterUser(ctx context.Context, user *model.User) (*model.User, error) {
	if user.Username == "" || user.Email == "" || user.Password == "" {
		return nil, fmt.Errorf("username, email, and password are required")
	}

	// Check if username already exists
	_, err := s.queries.GetUserByUsername(ctx, user.Username)
	if err == nil { // No error means user exists
		return nil, fmt.Errorf("username already exists")
	} else if err != pgx.ErrNoRows {
		return nil, fmt.Errorf("error checking username: %w", err)
	}

	// Check if email already exists
	_, err = s.queries.GetUserByEmail(ctx, user.Email)
	if err == nil { // No error means email exists
		return nil, fmt.Errorf("email already exists")
	} else if err != pgx.ErrNoRows {
		return nil, fmt.Errorf("error checking email: %w", err)
	}

	// Hash the password
	hashedPassword, err := util.HashPassword(user.Password)
	if err != nil {
		return nil, fmt.Errorf("error hashing password: %w", err)
	}

	// Create the user in the database
	displayName := pgtype.Text{}
	if user.DisplayName.String != "" {
		displayName = user.DisplayName
	}

	createdUserRow, err := s.queries.CreateUser(ctx, db.CreateUserParams{
		Username:     user.Username,
		Email:        user.Email,
		PasswordHash: hashedPassword,
		DisplayName:  displayName,
	})

	if err != nil {
		return nil, fmt.Errorf("error creating user: %w", err)
	}

	// Convert DB user to model user
	modelUser := &model.User{
		ID:            createdUserRow.ID,
		Username:      createdUserRow.Username,
		Email:         createdUserRow.Email,
		PasswordHash:  createdUserRow.PasswordHash,
		DisplayName:   createdUserRow.DisplayName,
		AvatarUrl:     pgtype.Text{String: createdUserRow.AvatarUrl, Valid: createdUserRow.AvatarUrl != ""},
		Bio:           pgtype.Text{String: createdUserRow.Bio, Valid: createdUserRow.Bio != ""},
		Location:      pgtype.Text{}, // Initialize as empty for new users
		Website:       pgtype.Text{}, // Initialize as empty for new users
		IsPrivate:     createdUserRow.IsPrivate,
		CreatedAt:     createdUserRow.CreatedAt,
		UpdatedAt:     createdUserRow.UpdatedAt,
		DeletedAt:     createdUserRow.DeletedAt,
		EmailVerified: createdUserRow.EmailVerified,
		LastLogin:     createdUserRow.LastLogin,
	}

	return modelUser, nil
}

// LoginUser logs in a user
func (s *UserService) LoginUser(ctx context.Context, usernameOrEmail, password string) (*model.User, error) {
	if usernameOrEmail == "" || password == "" {
		return nil, fmt.Errorf("username/email and password are required")
	}

	var dbUser db.User
	var err error

	// Try to get user by email first
	dbUser, err = s.queries.GetUserByEmail(ctx, usernameOrEmail)
	if err == pgx.ErrNoRows {
		// If not found by email, try username
		dbUser, err = s.queries.GetUserByUsername(ctx, usernameOrEmail)
		if err != nil {
			if err == pgx.ErrNoRows {
				return nil, fmt.Errorf("invalid username/email or password")
			}
			return nil, fmt.Errorf("error getting user: %w", err)
		}
	} else if err != nil {
		return nil, fmt.Errorf("error getting user: %w", err)
	}

	// Check if password matches
	if !util.CheckPassword(password, dbUser.PasswordHash) {
		return nil, fmt.Errorf("invalid username/email or password")
	}

	// Get user stats
	stats, err := s.queries.GetUserStats(ctx, dbUser.ID)
	if err != nil {
		return nil, fmt.Errorf("error getting user stats: %w", err)
	}

	// Convert to model user
	user := dbUserToModelUser(dbUser)
	user.FollowersCount = stats.FollowersCount
	user.FollowingCount = stats.FollowingCount

	return user, nil
}

// Helper function to convert db.User to model.User
func dbUserToModelUser(dbUser db.User) *model.User {
	return &model.User{
		ID:             dbUser.ID,
		Username:       dbUser.Username,
		Email:          dbUser.Email,
		PasswordHash:   dbUser.PasswordHash,
		DisplayName:    dbUser.DisplayName,
		AvatarUrl:      dbUser.AvatarUrl,
		Bio:            dbUser.Bio,
		Location:       dbUser.Location,
		Website:        dbUser.Website,
		IsPrivate:      dbUser.IsPrivate,
		CreatedAt:      dbUser.CreatedAt,
		UpdatedAt:      dbUser.UpdatedAt,
		DeletedAt:      dbUser.DeletedAt,
		EmailVerified:  dbUser.EmailVerified,
		LastLogin:      dbUser.LastLogin,
		FollowersCount: 0, // These will be set by the caller if needed
		FollowingCount: 0,
	}
}

// UpdateUser updates a user's profile
func (s *UserService) UpdateUser(ctx context.Context, userID [16]byte, displayName, bio, location, website string) (*model.User, error) {
	// Convert userID to pgtype.UUID
	id := pgtype.UUID{Bytes: userID, Valid: true}

	// Update user in database
	dbUser, err := s.queries.UpdateUser(ctx, db.UpdateUserParams{
		ID:          id,
		DisplayName: pgtype.Text{String: displayName, Valid: displayName != ""},
		Bio:         pgtype.Text{String: bio, Valid: bio != ""},
		Location:    pgtype.Text{String: location, Valid: location != ""},
		Website:     pgtype.Text{String: website, Valid: website != ""},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to update user: %w", err)
	}

	// Get user stats
	stats, err := s.queries.GetUserStats(ctx, dbUser.ID)
	if err != nil {
		return nil, fmt.Errorf("error getting user stats: %w", err)
	}

	// Convert to model user
	user := dbUserToModelUser(dbUser)
	user.FollowersCount = stats.FollowersCount
	user.FollowingCount = stats.FollowingCount

	return user, nil
}

// UpdateUserAvatar updates a user's avatar URL
func (s *UserService) UpdateUserAvatar(ctx context.Context, userID [16]byte, avatarURL string) (*model.User, error) {
	// Convert userID to pgtype.UUID
	id := pgtype.UUID{Bytes: userID, Valid: true}

	// Update user in database
	dbUser, err := s.queries.UpdateUserAvatar(ctx, db.UpdateUserAvatarParams{
		ID:        id,
		AvatarUrl: pgtype.Text{String: avatarURL, Valid: avatarURL != ""},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to update user avatar: %w", err)
	}

	// Get user stats
	stats, err := s.queries.GetUserStats(ctx, dbUser.ID)
	if err != nil {
		return nil, fmt.Errorf("error getting user stats: %w", err)
	}

	// Convert to model user
	user := dbUserToModelUser(dbUser)
	user.FollowersCount = stats.FollowersCount
	user.FollowingCount = stats.FollowingCount

	return user, nil
}
