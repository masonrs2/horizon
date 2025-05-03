package service

import (
	"context"
	"fmt"

	"horizon-backend/internal/db"

	"github.com/jackc/pgx/v5/pgtype"
)

type FollowService struct {
	queries *db.Queries
}

func NewFollowService(queries *db.Queries) *FollowService {
	return &FollowService{
		queries: queries,
	}
}

type FollowUserResponse struct {
	IsAccepted bool `json:"is_accepted"`
}

type FollowStatus struct {
	IsFollowing bool  `json:"is_following"`
	IsAccepted  *bool `json:"is_accepted,omitempty"`
}

// FollowUser creates a new follow relationship
func (s *FollowService) FollowUser(ctx context.Context, followerID, followedID pgtype.UUID) (*FollowUserResponse, error) {
	follow, err := s.queries.CreateFollow(ctx, db.CreateFollowParams{
		FollowerID: followerID,
		FollowedID: followedID,
	})
	if err != nil {
		return nil, fmt.Errorf("error creating follow: %w", err)
	}

	return &FollowUserResponse{
		IsAccepted: follow.IsAccepted,
	}, nil
}

// GetFollowStatus checks if a user is following another user
func (s *FollowService) GetFollowStatus(ctx context.Context, followerID, followedID pgtype.UUID) (*FollowStatus, error) {
	status, err := s.queries.GetFollowStatus(ctx, db.GetFollowStatusParams{
		FollowerID: followerID,
		FollowedID: followedID,
	})
	if err != nil {
		return nil, fmt.Errorf("error getting follow status: %w", err)
	}

	// If not following, isAccepted should be nil
	var isAccepted *bool
	if status.IsFollowing {
		accepted := status.IsAccepted // IsAccepted is a regular bool
		isAccepted = &accepted
	}

	return &FollowStatus{
		IsFollowing: status.IsFollowing,
		IsAccepted:  isAccepted,
	}, nil
}
