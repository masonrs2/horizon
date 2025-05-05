package service

import (
	"bytes"
	"context"
	"fmt"
	"log"

	"horizon-backend/internal/db"
	"horizon-backend/internal/model"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

type FollowService struct {
	queries             *db.Queries
	notificationService *NotificationService
}

func NewFollowService(queries *db.Queries, notificationService *NotificationService) *FollowService {
	return &FollowService{
		queries:             queries,
		notificationService: notificationService,
	}
}

type FollowUserResponse struct {
	IsAccepted bool `json:"is_accepted"`
}

// FollowUser creates a new follow relationship
func (s *FollowService) FollowUser(ctx context.Context, followerID, followedID [16]byte) (*FollowUserResponse, error) {
	// Check if user is trying to follow themselves
	if bytes.Equal(followerID[:], followedID[:]) {
		return nil, fmt.Errorf("cannot follow yourself")
	}

	// Convert IDs to pgtype.UUID
	follower := pgtype.UUID{Bytes: followerID, Valid: true}
	followed := pgtype.UUID{Bytes: followedID, Valid: true}

	// Create follow relationship
	follow, err := s.queries.CreateFollow(ctx, db.CreateFollowParams{
		FollowerID: follower,
		FollowedID: followed,
	})
	if err != nil {
		return nil, fmt.Errorf("error creating follow: %w", err)
	}

	// Create notification for followed user
	_, err = s.notificationService.CreateNotification(ctx, followedID, followerID, nil, nil, model.NotificationTypeFollow)
	if err != nil {
		// Log error but don't fail the follow operation
		log.Printf("Error creating follow notification: %v", err)
	}

	return &FollowUserResponse{
		IsAccepted: follow.IsAccepted,
	}, nil
}

// UnfollowUser removes a follow relationship
func (s *FollowService) UnfollowUser(ctx context.Context, followerID, followedID pgtype.UUID) error {
	err := s.queries.DeleteFollow(ctx, db.DeleteFollowParams{
		FollowerID: followerID,
		FollowedID: followedID,
	})
	if err != nil {
		return fmt.Errorf("error deleting follow: %w", err)
	}
	return nil
}

type FollowStatus struct {
	IsFollowing bool `json:"is_following"`
	IsAccepted  bool `json:"is_accepted"`
}

// GetFollowStatus checks if a user is following another user
func (s *FollowService) GetFollowStatus(ctx context.Context, followerID, followedID pgtype.UUID) (*FollowStatus, error) {
	// Validate input
	if !followerID.Valid || !followedID.Valid {
		return nil, fmt.Errorf("invalid user IDs provided")
	}

	// Check if users are the same
	if followerID == followedID {
		return &FollowStatus{
			IsFollowing: false,
			IsAccepted:  false,
		}, nil
	}

	isFollowing, err := s.queries.GetFollowStatus(ctx, db.GetFollowStatusParams{
		FollowerID: followerID,
		FollowedID: followedID,
	})
	if err != nil {
		if err == pgx.ErrNoRows {
			// Not following is a valid state
			return &FollowStatus{
				IsFollowing: false,
				IsAccepted:  false,
			}, nil
		}
		return nil, fmt.Errorf("database error while getting follow status: %w", err)
	}

	return &FollowStatus{
		IsFollowing: isFollowing,
		IsAccepted:  isFollowing, // If following is true, it means the follow request was accepted
	}, nil
}

type UserFollow struct {
	ID          pgtype.UUID        `json:"id"`
	Username    string             `json:"username"`
	DisplayName pgtype.Text        `json:"display_name"`
	AvatarURL   pgtype.Text        `json:"avatar_url"`
	IsPrivate   bool               `json:"is_private"`
	CreatedAt   pgtype.Timestamptz `json:"created_at"`
	FollowedAt  pgtype.Timestamptz `json:"followed_at,omitempty"`
}

// GetFollowers gets a list of users who follow the specified user
func (s *FollowService) GetFollowers(ctx context.Context, userID pgtype.UUID, limit, offset int32) ([]UserFollow, error) {
	followers, err := s.queries.GetFollowers(ctx, db.GetFollowersParams{
		FollowedID: userID,
		Limit:      limit,
		Offset:     offset,
	})
	if err != nil {
		return nil, fmt.Errorf("error getting followers: %w", err)
	}

	var userFollows []UserFollow
	for _, f := range followers {
		userFollows = append(userFollows, UserFollow{
			ID:          f.ID,
			Username:    f.Username,
			DisplayName: f.DisplayName,
			AvatarURL:   f.AvatarUrl,
			IsPrivate:   f.IsPrivate,
			CreatedAt:   f.CreatedAt,
			FollowedAt:  f.FollowedAt,
		})
	}

	return userFollows, nil
}

// GetFollowing gets a list of users that the specified user follows
func (s *FollowService) GetFollowing(ctx context.Context, userID pgtype.UUID, limit, offset int32) ([]UserFollow, error) {
	following, err := s.queries.GetFollowing(ctx, db.GetFollowingParams{
		FollowerID: userID,
		Limit:      limit,
		Offset:     offset,
	})
	if err != nil {
		return nil, fmt.Errorf("error getting following: %w", err)
	}

	var userFollows []UserFollow
	for _, f := range following {
		userFollows = append(userFollows, UserFollow{
			ID:          f.ID,
			Username:    f.Username,
			DisplayName: f.DisplayName,
			AvatarURL:   f.AvatarUrl,
			IsPrivate:   f.IsPrivate,
			CreatedAt:   f.CreatedAt,
			FollowedAt:  f.CreatedAt,
		})
	}

	return userFollows, nil
}

// GetPendingFollowRequests gets a list of pending follow requests for a user
func (s *FollowService) GetPendingFollowRequests(ctx context.Context, userID pgtype.UUID, limit, offset int32) ([]UserFollow, error) {
	requests, err := s.queries.GetPendingFollowRequests(ctx, db.GetPendingFollowRequestsParams{
		FollowedID: userID,
		Limit:      limit,
		Offset:     offset,
	})
	if err != nil {
		return nil, fmt.Errorf("error getting pending follow requests: %w", err)
	}

	var userFollows []UserFollow
	for _, f := range requests {
		userFollows = append(userFollows, UserFollow{
			ID:          f.ID,
			Username:    f.Username,
			DisplayName: f.DisplayName,
			AvatarURL:   f.AvatarUrl,
			IsPrivate:   f.IsPrivate,
			CreatedAt:   f.CreatedAt,
		})
	}

	return userFollows, nil
}

// AcceptFollowRequest accepts a pending follow request
func (s *FollowService) AcceptFollowRequest(ctx context.Context, followerID, followedID pgtype.UUID) error {
	_, err := s.queries.AcceptFollow(ctx, db.AcceptFollowParams{
		FollowerID: followerID,
		FollowedID: followedID,
	})
	if err != nil {
		return fmt.Errorf("error accepting follow request: %w", err)
	}
	return nil
}
