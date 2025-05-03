package service

import (
	"context"
	"fmt"

	"horizon-backend/internal/db"
	"horizon-backend/internal/model"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

// PostService handles post-related business logic
type PostService struct {
	queries *db.Queries
	db      *pgxpool.Pool
}

// NewPostService creates a new post service
func NewPostService(queries *db.Queries, pool *pgxpool.Pool) *PostService {
	return &PostService{
		queries: queries,
		db:      pool,
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

// HasLiked checks if a user has liked a post
func (s *PostService) HasLiked(ctx context.Context, postId, userId pgtype.UUID) (bool, error) {
	if !userId.Valid {
		return false, nil
	}

	// Start a transaction since we want to ensure consistency
	tx, err := s.db.Begin(ctx)
	if err != nil {
		return false, fmt.Errorf("failed to start transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	qtx := db.New(tx)

	// Check if the post exists first
	_, err = qtx.GetPostByID(ctx, postId)
	if err != nil {
		return false, fmt.Errorf("failed to find post: %w", err)
	}

	// Check if the user has liked the post
	hasLiked, err := qtx.HasUserLikedPost(ctx, db.HasUserLikedPostParams{
		PostID: postId,
		UserID: userId,
	})
	if err != nil {
		return false, fmt.Errorf("failed to check like status: %w", err)
	}

	// Commit the transaction
	if err := tx.Commit(ctx); err != nil {
		return false, fmt.Errorf("failed to commit transaction: %w", err)
	}

	return hasLiked, nil
}

// LikePost likes a post
func (s *PostService) LikePost(ctx context.Context, postId, userId pgtype.UUID) error {
	// Start a transaction
	tx, err := s.db.Begin(ctx)
	if err != nil {
		return fmt.Errorf("failed to start transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	qtx := db.New(tx)

	// Check if the post exists first
	_, err = qtx.GetPostByID(ctx, postId)
	if err != nil {
		return fmt.Errorf("failed to find post: %w", err)
	}

	// Check if the user has already liked this post
	hasLiked, err := s.HasLiked(ctx, postId, userId)
	if err != nil {
		return fmt.Errorf("failed to check like status: %w", err)
	}

	if hasLiked {
		return fmt.Errorf("user has already liked this post")
	}

	// First record the like
	_, err = qtx.LikePost(ctx, db.LikePostParams{
		UserID: userId,
		PostID: postId,
	})
	if err != nil {
		return fmt.Errorf("failed to like post: %w", err)
	}

	// Then increment the counter
	_, err = qtx.IncrementLikeCount(ctx, postId)
	if err != nil {
		return fmt.Errorf("failed to increment like count: %w", err)
	}

	// Commit the transaction
	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

// UnlikePost unlikes a post
func (s *PostService) UnlikePost(ctx context.Context, postId, userId pgtype.UUID) error {
	// Start a transaction
	tx, err := s.db.Begin(ctx)
	if err != nil {
		return fmt.Errorf("failed to start transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	qtx := db.New(tx)

	// Delete the like
	err = qtx.UnlikePost(ctx, db.UnlikePostParams{
		UserID: userId,
		PostID: postId,
	})
	if err != nil {
		return fmt.Errorf("failed to unlike post: %w", err)
	}

	// Decrement the counter
	_, err = qtx.DecrementLikeCount(ctx, postId)
	if err != nil {
		return fmt.Errorf("failed to decrement like count: %w", err)
	}

	// Commit the transaction
	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

// GetPostById gets a post by ID
func (s *PostService) GetPostById(ctx context.Context, postId pgtype.UUID) (*model.Post, error) {
	// Start a transaction since we want to ensure consistency
	tx, err := s.db.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to start transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	qtx := db.New(tx)

	// Get the post
	dbPost, err := qtx.GetPostByID(ctx, postId)
	if err != nil {
		return nil, fmt.Errorf("failed to get post: %w", err)
	}

	// Convert to model post
	post := dbPostToModelPost(dbPost)

	// Get the user ID from context
	userID, ok := ctx.Value("user_id").(pgtype.UUID)
	if ok && userID.Valid {
		// Check if the user has liked the post
		hasLiked, err := s.HasLiked(ctx, postId, userID)
		if err == nil {
			post.HasLiked = hasLiked
		}
	}

	// Commit the transaction
	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	return post, nil
}

// GetPosts retrieves a paginated list of posts
func (s *PostService) GetPosts(ctx context.Context, limit, offset int32) ([]*model.Post, error) {
	// Start a transaction since we want to ensure consistency
	tx, err := s.db.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to start transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	qtx := db.New(tx)

	// Call database to get a list of posts with pagination
	params := db.GetAllPostsParams{
		Limit:  limit,
		Offset: offset,
	}

	dbPosts, err := qtx.GetAllPosts(ctx, params)
	if err != nil {
		return nil, fmt.Errorf("failed to get posts: %w", err)
	}

	// Convert to model posts
	posts := make([]*model.Post, 0, len(dbPosts))

	// Get the user ID from context
	userID, ok := ctx.Value("user_id").(pgtype.UUID)

	for _, dbPost := range dbPosts {
		post := dbPostToModelPost(dbPost)

		// If user is authenticated, check if they've liked each post
		if ok && userID.Valid {
			hasLiked, err := s.HasLiked(ctx, dbPost.ID, userID)
			if err == nil {
				post.HasLiked = hasLiked
			}
		}

		posts = append(posts, post)
	}

	// Commit the transaction
	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	return posts, nil
}

// GetUserPosts retrieves posts by a specific user
func (s *PostService) GetUserPosts(ctx context.Context, userId pgtype.UUID, limit, offset int32) ([]*model.Post, error) {
	// Start a transaction since we want to ensure consistency
	tx, err := s.db.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to start transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	qtx := db.New(tx)

	// Call database to get posts for a specific user
	params := db.GetPostsByUserIDParams{
		UserID: userId,
		Limit:  limit,
		Offset: offset,
	}

	dbPosts, err := qtx.GetPostsByUserID(ctx, params)
	if err != nil {
		return nil, fmt.Errorf("failed to get user posts: %w", err)
	}

	// Convert to model posts
	posts := make([]*model.Post, 0, len(dbPosts))

	// Get the user ID from context
	currentUserID, ok := ctx.Value("user_id").(pgtype.UUID)

	for _, dbPost := range dbPosts {
		post := dbPostToModelPost(dbPost)

		// If user is authenticated, check if they've liked each post
		if ok && currentUserID.Valid {
			hasLiked, err := s.HasLiked(ctx, dbPost.ID, currentUserID)
			if err == nil {
				post.HasLiked = hasLiked
			}
		}

		posts = append(posts, post)
	}

	// Commit the transaction
	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	return posts, nil
}

// GetPostReplies retrieves replies for a specific post
func (s *PostService) GetPostReplies(ctx context.Context, postId pgtype.UUID, limit, offset int32) ([]*model.Post, error) {
	// Start a transaction since we want to ensure consistency
	tx, err := s.db.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to start transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	qtx := db.New(tx)

	// Call database to get replies for the post
	params := db.GetPostRepliesParams{
		ReplyToPostID: postId,
		Limit:         limit,
		Offset:        offset,
	}

	dbPosts, err := qtx.GetPostReplies(ctx, params)
	if err != nil {
		return nil, fmt.Errorf("failed to get post replies: %w", err)
	}

	// Convert to model posts
	posts := make([]*model.Post, 0, len(dbPosts))

	// Get the user ID from context
	userID, ok := ctx.Value("user_id").(pgtype.UUID)

	for _, dbPost := range dbPosts {
		post := dbPostToModelPost(dbPost)

		// If user is authenticated, check if they've liked each post
		if ok && userID.Valid {
			hasLiked, err := s.HasLiked(ctx, dbPost.ID, userID)
			if err == nil {
				post.HasLiked = hasLiked
			}
		}

		posts = append(posts, post)
	}

	// Commit the transaction
	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
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
		HasLiked:      false, // Default to false, will be updated if user is authenticated
	}
}
