package service

import (
	"context"
	"fmt"

	"horizon-backend/internal/model"
	"horizon-backend/internal/repository"

	"github.com/jackc/pgx/v5/pgtype"
)

type PostService struct {
	repo *repository.PostRepository
}

func NewPostService(repo *repository.PostRepository) *PostService {
	return &PostService{
		repo: repo,
	}
}

func (s *PostService) CreatePost(ctx context.Context, post *model.Post) (*model.Post, error) {
	if post.Content == "" {
	return nil, fmt.Errorf("content is required")
	}

	createdPost, err := s.repo.CreatePost(ctx, post)
	if err != nil {
		return nil, fmt.Errorf("failed to create post: %w", err)
	}

	return createdPost, nil
}

func (s *PostService) UpdatePostContent(ctx context.Context, postId, userId pgtype.UUID, content string) (*model.Post, error) {
	if content == "" {
		return nil, fmt.Errorf("updated content cannot be empty")
	}

	// Verify post exists and belongs to user attempting to update
	post, err := s.repo.GetPostById(ctx, postId)
	if err != nil {
		return nil, fmt.Errorf("failed to find post: %w", err)
	}

	// Check if post belongs to user
	if post.UserID != userId {
		return nil, fmt.Errorf("unauthorized to update this post, post doesn't belong to you")
	}

	updatedPost, err := s.repo.UpdatePostContent(ctx, postId, userId, content) 
	if err != nil {
		return nil, fmt.Errorf("failed to update post: %w", err)
	}
	return updatedPost, nil
}

func (s *PostService) LikePost(ctx context.Context, postId, userId pgtype.UUID) error {
	err := s.repo.LikePost(ctx, postId, userId)

	if err != nil {
		return fmt.Errorf("failed to like post: %w", err)
	}

	return nil
}
