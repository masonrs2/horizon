package service

import (
	"context"
	"fmt"

	"horizon-backend/internal/db"
	"horizon-backend/internal/model"

	"github.com/jackc/pgx/v5/pgtype"
)

// PostService handles post-related business logic
type PostService struct {
	queries *db.Queries
}

// NewPostService creates a new post service
func NewPostService(queries *db.Queries) *PostService {
	return &PostService{
		queries: queries,
	}
}

// CreatePost creates a new post
func (s *PostService) CreatePost(ctx context.Context, post *model.Post) (*model.Post, error) {
	if post.Content == "" {
		return nil, fmt.Errorf("content is required")
	}

	// Create the post in the database
	params := db.CreatePostParams{
		UserID:        post.UserID,
		Content:       post.Content,
		IsPrivate:     post.IsPrivate,
		ReplyToPostID: post.ReplyToPostID,
		MediaUrls:     post.MediaUrls,
	}

	dbPost, err := s.queries.CreatePost(ctx, params)
	if err != nil {
		return nil, fmt.Errorf("failed to create post: %w", err)
	}

	return dbPostToModelPost(dbPost), nil
}

// UpdatePostContent updates the content of a post
func (s *PostService) UpdatePostContent(ctx context.Context, postId, userId pgtype.UUID, content string) (*model.Post, error) {
	if content == "" {
		return nil, fmt.Errorf("updated content cannot be empty")
	}

	// Verify post exists and belongs to user attempting to update
	dbPost, err := s.queries.GetPostByID(ctx, postId)
	if err != nil {
		return nil, fmt.Errorf("failed to find post: %w", err)
	}

	// Check if post belongs to user
	if dbPost.UserID != userId {
		return nil, fmt.Errorf("unauthorized to update this post, post doesn't belong to you")
	}

	// Update the post content
	params := db.UpdatePostContentParams{
		ID:      postId,
		UserID:  userId,
		Content: content,
	}

	updatedDbPost, err := s.queries.UpdatePostContent(ctx, params)
	if err != nil {
		return nil, fmt.Errorf("failed to update post: %w", err)
	}

	return dbPostToModelPost(updatedDbPost), nil
}

// LikePost likes a post
func (s *PostService) LikePost(ctx context.Context, postId, userId pgtype.UUID) error {
	// Create a like on the post
	_, err := s.queries.LikePost(ctx, db.LikePostParams{
		UserID: userId,
		PostID: postId,
	})

	if err != nil {
		return fmt.Errorf("failed to like post: %w", err)
	}

	return nil
}

// UnlikePost unlikes a post
func (s *PostService) UnlikePost(ctx context.Context, postId, userId pgtype.UUID) error {
	// Delete the like
	err := s.queries.UnlikePost(ctx, db.UnlikePostParams{
		UserID: userId,
		PostID: postId,
	})

	if err != nil {
		return fmt.Errorf("failed to unlike post: %w", err)
	}

	return nil
}

// GetPostById gets a post by ID
func (s *PostService) GetPostById(ctx context.Context, postId pgtype.UUID) (*model.Post, error) {
	dbPost, err := s.queries.GetPostByID(ctx, postId)
	if err != nil {
		return nil, fmt.Errorf("failed to get post: %w", err)
	}

	return dbPostToModelPost(dbPost), nil
}

// GetPosts retrieves a paginated list of posts
func (s *PostService) GetPosts(ctx context.Context, limit, offset int32) ([]*model.Post, error) {
	// Call database to get a list of posts with pagination
	params := db.GetAllPostsParams{
		Limit:  limit,
		Offset: offset,
	}

	dbPosts, err := s.queries.GetAllPosts(ctx, params)
	if err != nil {
		return nil, fmt.Errorf("failed to get posts: %w", err)
	}

	// Convert to model posts
	posts := make([]*model.Post, 0, len(dbPosts))
	for _, dbPost := range dbPosts {
		posts = append(posts, dbPostToModelPost(dbPost))
	}

	return posts, nil
}

// GetUserPosts retrieves posts by a specific user
func (s *PostService) GetUserPosts(ctx context.Context, userId pgtype.UUID, limit, offset int32) ([]*model.Post, error) {
	// Call database to get posts for a specific user
	params := db.GetPostsByUserIDParams{
		UserID: userId,
		Limit:  limit,
		Offset: offset,
	}

	dbPosts, err := s.queries.GetPostsByUserID(ctx, params)
	if err != nil {
		return nil, fmt.Errorf("failed to get user posts: %w", err)
	}

	// Convert to model posts
	posts := make([]*model.Post, 0, len(dbPosts))
	for _, dbPost := range dbPosts {
		posts = append(posts, dbPostToModelPost(dbPost))
	}

	return posts, nil
}

// Helper function to convert db.Post to model.Post
func dbPostToModelPost(dbPost db.Post) *model.Post {
	return &model.Post{
		ID:            dbPost.ID,
		UserID:        dbPost.UserID,
		Content:       dbPost.Content,
		CreatedAt:     dbPost.CreatedAt,
		UpdatedAt:     dbPost.UpdatedAt,
		DeletedAt:     dbPost.DeletedAt,
		IsPrivate:     dbPost.IsPrivate,
		ReplyToPostID: dbPost.ReplyToPostID,
		AllowReplies:  dbPost.AllowReplies,
		MediaUrls:     dbPost.MediaUrls,
		LikeCount:     dbPost.LikeCount,
		RepostCount:   dbPost.RepostCount,
	}
}