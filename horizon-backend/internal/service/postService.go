package service

import (
	"context"
	"database/sql"
	"fmt"
	"strings"

	"horizon-backend/internal/db"
	"horizon-backend/internal/model"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

// PostService handles post-related business logic
type PostService struct {
	queries     *db.Queries
	db          *pgxpool.Pool
	userService AuthService
}

// NewPostService creates a new post service
func NewPostService(queries *db.Queries, pool *pgxpool.Pool, userService AuthService) *PostService {
	return &PostService{
		queries:     queries,
		db:          pool,
		userService: userService,
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

	return s.dbPostToModelPost(dbPost), nil
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

	return s.dbPostToModelPost(updatedDbPost), nil
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
	post := s.dbPostToModelPost(dbPost)

	// Get the user ID from context
	userID, ok := ctx.Value("user_id").(pgtype.UUID)
	if ok && userID.Valid {
		// Check if the user has liked the post
		hasLiked, err := s.HasLiked(ctx, postId, userID)
		if err == nil {
			post.HasLiked = hasLiked
		}

		// Check if the user has bookmarked the post
		var hasBookmarked bool
		err = tx.QueryRow(ctx,
			"SELECT EXISTS (SELECT 1 FROM bookmarks WHERE post_id = $1 AND user_id = $2)",
			postId, userID).Scan(&hasBookmarked)
		if err == nil {
			post.HasBookmarked = hasBookmarked
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
		post := s.dbPostToModelPost(dbPost)

		// If user is authenticated, check if they've liked and bookmarked each post
		if ok && userID.Valid {
			// Check likes
			hasLiked, err := s.HasLiked(ctx, dbPost.ID, userID)
			if err == nil {
				post.HasLiked = hasLiked
			}

			// Check bookmarks using direct query
			var hasBookmarked bool
			err = tx.QueryRow(ctx,
				"SELECT EXISTS (SELECT 1 FROM bookmarks WHERE post_id = $1 AND user_id = $2)",
				dbPost.ID, userID).Scan(&hasBookmarked)
			if err == nil {
				post.HasBookmarked = hasBookmarked
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
		post := s.dbPostToModelPost(dbPost)

		// If user is authenticated, check if they've liked and bookmarked each post
		if ok && currentUserID.Valid {
			// Check likes
			hasLiked, err := s.HasLiked(ctx, dbPost.ID, currentUserID)
			if err == nil {
				post.HasLiked = hasLiked
			}

			// Check bookmarks
			var hasBookmarked bool
			err = tx.QueryRow(ctx,
				"SELECT EXISTS (SELECT 1 FROM bookmarks WHERE post_id = $1 AND user_id = $2)",
				dbPost.ID, currentUserID).Scan(&hasBookmarked)
			if err == nil {
				post.HasBookmarked = hasBookmarked
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
		post := s.dbPostToModelPost(dbPost)

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

// DeletePost deletes a post by ID
func (s *PostService) DeletePost(ctx context.Context, postId, userId pgtype.UUID) error {
	// Start a transaction
	tx, err := s.db.Begin(ctx)
	if err != nil {
		return fmt.Errorf("failed to start transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	qtx := db.New(tx)

	// First verify the post exists and belongs to the user
	post, err := qtx.GetPostByID(ctx, postId)
	if err != nil {
		return fmt.Errorf("failed to find post: %w", err)
	}

	if post.UserID != userId {
		return fmt.Errorf("unauthorized: post doesn't belong to you")
	}

	// Delete the post
	err = qtx.DeletePost(ctx, db.DeletePostParams{
		ID:     postId,
		UserID: userId,
	})
	if err != nil {
		return fmt.Errorf("failed to delete post: %w", err)
	}

	// Commit the transaction
	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

// GetUserPostsByUsername gets posts by a user's username
func (s *PostService) GetUserPostsByUsername(ctx context.Context, username string, limit, offset int32) ([]*model.Post, error) {
	// Start a transaction
	tx, err := s.db.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to start transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	qtx := db.New(tx)

	// First get the user by username
	user, err := qtx.GetUserByUsername(ctx, username)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("user not found")
		}
		return nil, fmt.Errorf("error getting user by username: %w", err)
	}

	// Then get their posts
	posts, err := qtx.GetPostsByUserID(ctx, db.GetPostsByUserIDParams{
		UserID: user.ID,
		Limit:  limit,
		Offset: offset,
	})
	if err != nil {
		return nil, fmt.Errorf("error getting user posts: %w", err)
	}

	// Convert to model posts
	modelPosts := make([]*model.Post, len(posts))
	for i, post := range posts {
		// Get post stats
		stats, err := qtx.GetPostStats(ctx, post.ID)
		if err != nil {
			return nil, fmt.Errorf("error getting post stats: %w", err)
		}

		// Check if the current user has liked the post
		hasLiked := false
		if userID, ok := ctx.Value("user_id").(pgtype.UUID); ok && userID.Valid {
			hasLiked, err = qtx.HasUserLikedPost(ctx, db.HasUserLikedPostParams{
				PostID: post.ID,
				UserID: userID,
			})
			if err != nil {
				return nil, fmt.Errorf("error checking if user has liked post: %w", err)
			}
		}

		modelPosts[i] = &model.Post{
			ID:            post.ID,
			UserID:        post.UserID,
			Content:       post.Content,
			CreatedAt:     post.CreatedAt,
			UpdatedAt:     post.UpdatedAt,
			DeletedAt:     post.DeletedAt,
			IsPrivate:     post.IsPrivate,
			ReplyToPostID: post.ReplyToPostID,
			AllowReplies:  post.AllowReplies,
			MediaUrls:     post.MediaUrls,
			LikeCount:     int32(stats.LikeCount),
			RepostCount:   int32(stats.RepostCount),
			ReplyCount:    int32(stats.ReplyCount),
			HasLiked:      hasLiked,
			Username:      post.Username,
			DisplayName:   post.DisplayName,
			AvatarUrl:     post.AvatarUrl,
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	return modelPosts, nil
}

// GetUserReplies retrieves all replies made by a specific user
func (s *PostService) GetUserReplies(ctx context.Context, userId pgtype.UUID, limit, offset int32) ([]*model.Post, error) {
	// Start a transaction since we want to ensure consistency
	tx, err := s.db.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to start transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	qtx := db.New(tx)

	// Call database to get replies for the user
	params := db.GetUserRepliesParams{
		UserID: userId,
		Limit:  limit,
		Offset: offset,
	}

	dbPosts, err := qtx.GetUserReplies(ctx, params)
	if err != nil {
		return nil, fmt.Errorf("failed to get user replies: %w", err)
	}

	// Convert to model posts
	posts := make([]*model.Post, 0, len(dbPosts))

	// Get the user ID from context
	currentUserID, ok := ctx.Value("user_id").(pgtype.UUID)

	for _, dbPost := range dbPosts {
		post := s.dbPostToModelPost(dbPost)

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

// GetUserRepliesByUsername retrieves all replies made by a user identified by username
func (s *PostService) GetUserRepliesByUsername(ctx context.Context, username string, limit, offset int32) ([]*model.Post, error) {
	// Get user ID from username
	user, err := s.userService.GetUserByUsername(ctx, username)
	if err != nil {
		return nil, fmt.Errorf("failed to find user: %w", err)
	}

	// Get replies using user ID
	return s.GetUserReplies(ctx, user.ID, limit, offset)
}

// GetUserLikedPosts retrieves posts liked by a specific user
func (s *PostService) GetUserLikedPostsByUsername(ctx context.Context, username string, limit, offset int32) ([]*model.Post, error) {
	// Get user by username
	user, err := s.userService.GetUserByUsername(ctx, username)
	if err != nil {
		return nil, fmt.Errorf("failed to find user: %w", err)
	}

	// Get liked posts
	dbPosts, err := s.queries.GetUserLikedPosts(ctx, db.GetUserLikedPostsParams{
		UserID: user.ID,
		Limit:  limit,
		Offset: offset,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get liked posts: %w", err)
	}

	// Convert to model posts
	posts := make([]*model.Post, len(dbPosts))
	for i, dbPost := range dbPosts {
		post := s.dbPostToModelPost(dbPost)

		// Get post stats
		stats, err := s.queries.GetPostStats(ctx, dbPost.ID)
		if err == nil {
			post.ReplyCount = int32(stats.ReplyCount)
		}

		// Check if the current user has liked the post
		if userID, ok := ctx.Value("user_id").(pgtype.UUID); ok && userID.Valid {
			hasLiked, err := s.HasLiked(ctx, dbPost.ID, userID)
			if err == nil {
				post.HasLiked = hasLiked
			}
		}

		posts[i] = post
	}

	return posts, nil
}

// BookmarkPost creates a bookmark for a post
func (s *PostService) BookmarkPost(ctx context.Context, postID string, userID string) error {
	// Convert string IDs to UUIDs
	postUUID, err := uuid.Parse(postID)
	if err != nil {
		return fmt.Errorf("invalid post ID: %v", err)
	}

	userUUID, err := uuid.Parse(userID)
	if err != nil {
		return fmt.Errorf("invalid user ID: %v", err)
	}

	// Start a transaction
	tx, err := s.db.Begin(ctx)
	if err != nil {
		return fmt.Errorf("failed to start transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	qtx := db.New(tx)

	// Check if post exists and is not deleted
	post, err := qtx.GetPostByID(ctx, pgtype.UUID{Bytes: postUUID, Valid: true})
	if err != nil {
		if err == sql.ErrNoRows {
			return fmt.Errorf("post not found")
		}
		return fmt.Errorf("failed to check post: %v", err)
	}

	// Check if post is deleted
	if post.DeletedAt.Valid {
		return fmt.Errorf("post not found")
	}

	// Check if user exists
	_, err = s.userService.GetUserByID(ctx, pgtype.UUID{Bytes: userUUID, Valid: true})
	if err != nil {
		if err.Error() == "user not found" {
			return fmt.Errorf("user not found")
		}
		return fmt.Errorf("failed to check user: %v", err)
	}

	// Create bookmark
	err = qtx.CreateBookmark(ctx, db.CreateBookmarkParams{
		UserID: pgtype.UUID{Bytes: userUUID, Valid: true},
		PostID: pgtype.UUID{Bytes: postUUID, Valid: true},
	})
	if err != nil {
		if strings.Contains(err.Error(), "duplicate key") {
			return fmt.Errorf("post already bookmarked")
		}
		return fmt.Errorf("failed to create bookmark: %v", err)
	}

	// Commit the transaction
	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

// UnbookmarkPost removes a bookmark for a post
func (s *PostService) UnbookmarkPost(ctx context.Context, postID string, userID string) error {
	// Convert string IDs to UUIDs
	postUUID, err := uuid.Parse(postID)
	if err != nil {
		return fmt.Errorf("invalid post ID: %v", err)
	}

	userUUID, err := uuid.Parse(userID)
	if err != nil {
		return fmt.Errorf("invalid user ID: %v", err)
	}

	// Delete bookmark
	err = s.queries.DeleteBookmark(ctx, db.DeleteBookmarkParams{
		UserID: pgtype.UUID{Bytes: userUUID, Valid: true},
		PostID: pgtype.UUID{Bytes: postUUID, Valid: true},
	})
	if err != nil {
		if err == sql.ErrNoRows {
			return fmt.Errorf("bookmark not found")
		}
		return fmt.Errorf("failed to delete bookmark: %v", err)
	}

	return nil
}

// GetUserBookmarks returns all bookmarked posts for a user
func (s *PostService) GetUserBookmarks(ctx context.Context, userID string, limit int32, offset int32) ([]*model.Post, error) {
	// Convert string ID to UUID
	userUUID, err := uuid.Parse(userID)
	if err != nil {
		return nil, fmt.Errorf("invalid user ID: %v", err)
	}

	// Get bookmarked posts
	dbPosts, err := s.queries.GetUserBookmarkedPosts(ctx, db.GetUserBookmarkedPostsParams{
		UserID: pgtype.UUID{Bytes: userUUID, Valid: true},
		Limit:  limit,
		Offset: offset,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get bookmarked posts: %v", err)
	}

	// Convert to model.Post slice and enrich with additional data
	posts := make([]*model.Post, len(dbPosts))
	for i, dbPost := range dbPosts {
		post := s.dbPostToModelPost(dbPost)

		// Set has_bookmarked to true since these are bookmarked posts
		post.HasBookmarked = true

		// Get post stats
		stats, err := s.queries.GetPostStats(ctx, dbPost.ID)
		if err == nil {
			post.ReplyCount = int32(stats.ReplyCount)
		}

		// Get post owner information
		postOwner, err := s.userService.GetUserByID(ctx, dbPost.UserID)
		if err == nil && postOwner != nil {
			post.Username = postOwner.Username
			post.DisplayName = postOwner.DisplayName
			post.AvatarUrl = postOwner.AvatarUrl
		}

		// Check if the current user has liked the post
		if userUUID, ok := ctx.Value("user_id").(pgtype.UUID); ok && userUUID.Valid {
			hasLiked, err := s.HasLiked(ctx, dbPost.ID, userUUID)
			if err == nil {
				post.HasLiked = hasLiked
			}
		}

		posts[i] = post
	}

	return posts, nil
}

// Helper function to convert db.Post to model.Post
func (s *PostService) dbPostToModelPost(dbPost interface{}) *model.Post {
	// Get post stats to include reply count
	var post model.Post

	switch p := dbPost.(type) {
	case db.Post:
		post = model.Post{
			ID:            p.ID,
			UserID:        p.UserID,
			Content:       p.Content,
			CreatedAt:     p.CreatedAt,
			UpdatedAt:     p.UpdatedAt,
			DeletedAt:     p.DeletedAt,
			IsPrivate:     p.IsPrivate,
			ReplyToPostID: p.ReplyToPostID,
			AllowReplies:  p.AllowReplies,
			MediaUrls:     p.MediaUrls,
			LikeCount:     p.LikeCount,
			RepostCount:   p.RepostCount,
		}
	case db.CreatePostRow:
		post = model.Post{
			ID:            p.ID,
			UserID:        p.UserID,
			Content:       p.Content,
			CreatedAt:     p.CreatedAt,
			UpdatedAt:     p.UpdatedAt,
			DeletedAt:     p.DeletedAt,
			IsPrivate:     p.IsPrivate,
			ReplyToPostID: p.ReplyToPostID,
			AllowReplies:  p.AllowReplies,
			MediaUrls:     p.MediaUrls,
			LikeCount:     p.LikeCount,
			RepostCount:   p.RepostCount,
			Username:      p.Username,
			DisplayName:   p.DisplayName,
			AvatarUrl:     p.AvatarUrl,
		}
	case db.GetPostByIDRow:
		post = model.Post{
			ID:            p.ID,
			UserID:        p.UserID,
			Content:       p.Content,
			CreatedAt:     p.CreatedAt,
			UpdatedAt:     p.UpdatedAt,
			DeletedAt:     p.DeletedAt,
			IsPrivate:     p.IsPrivate,
			ReplyToPostID: p.ReplyToPostID,
			AllowReplies:  p.AllowReplies,
			MediaUrls:     p.MediaUrls,
			LikeCount:     p.LikeCount,
			RepostCount:   p.RepostCount,
			Username:      p.Username,
			DisplayName:   p.DisplayName,
			AvatarUrl:     p.AvatarUrl,
		}
	case db.GetAllPostsRow:
		post = model.Post{
			ID:            p.ID,
			UserID:        p.UserID,
			Content:       p.Content,
			CreatedAt:     p.CreatedAt,
			UpdatedAt:     p.UpdatedAt,
			DeletedAt:     p.DeletedAt,
			IsPrivate:     p.IsPrivate,
			ReplyToPostID: p.ReplyToPostID,
			AllowReplies:  p.AllowReplies,
			MediaUrls:     p.MediaUrls,
			LikeCount:     p.LikeCount,
			RepostCount:   p.RepostCount,
			Username:      p.Username,
			DisplayName:   p.DisplayName,
			AvatarUrl:     p.AvatarUrl,
		}
	case db.GetPostsByUserIDRow:
		post = model.Post{
			ID:            p.ID,
			UserID:        p.UserID,
			Content:       p.Content,
			CreatedAt:     p.CreatedAt,
			UpdatedAt:     p.UpdatedAt,
			DeletedAt:     p.DeletedAt,
			IsPrivate:     p.IsPrivate,
			ReplyToPostID: p.ReplyToPostID,
			AllowReplies:  p.AllowReplies,
			MediaUrls:     p.MediaUrls,
			LikeCount:     p.LikeCount,
			RepostCount:   p.RepostCount,
			Username:      p.Username,
			DisplayName:   p.DisplayName,
			AvatarUrl:     p.AvatarUrl,
		}
	case db.GetPostRepliesRow:
		post = model.Post{
			ID:            p.ID,
			UserID:        p.UserID,
			Content:       p.Content,
			CreatedAt:     p.CreatedAt,
			UpdatedAt:     p.UpdatedAt,
			DeletedAt:     p.DeletedAt,
			IsPrivate:     p.IsPrivate,
			ReplyToPostID: p.ReplyToPostID,
			AllowReplies:  p.AllowReplies,
			MediaUrls:     p.MediaUrls,
			LikeCount:     p.LikeCount,
			RepostCount:   p.RepostCount,
			Username:      p.Username,
			DisplayName:   p.DisplayName,
			AvatarUrl:     p.AvatarUrl,
		}
	case db.GetUserLikedPostsRow:
		post = model.Post{
			ID:            p.ID,
			UserID:        p.UserID,
			Content:       p.Content,
			CreatedAt:     p.CreatedAt,
			UpdatedAt:     p.UpdatedAt,
			DeletedAt:     p.DeletedAt,
			IsPrivate:     p.IsPrivate,
			ReplyToPostID: p.ReplyToPostID,
			AllowReplies:  p.AllowReplies,
			MediaUrls:     p.MediaUrls,
			LikeCount:     p.LikeCount,
			RepostCount:   p.RepostCount,
			Username:      p.Username,
			DisplayName:   p.DisplayName,
			AvatarUrl:     p.AvatarUrl,
			HasLiked:      true, // Since this is a liked post
		}
	case db.GetUserRepliesRow:
		post = model.Post{
			ID:            p.ID,
			UserID:        p.UserID,
			Content:       p.Content,
			CreatedAt:     p.CreatedAt,
			UpdatedAt:     p.UpdatedAt,
			DeletedAt:     p.DeletedAt,
			IsPrivate:     p.IsPrivate,
			ReplyToPostID: p.ReplyToPostID,
			AllowReplies:  p.AllowReplies,
			MediaUrls:     p.MediaUrls,
			LikeCount:     p.LikeCount,
			RepostCount:   p.RepostCount,
			Username:      p.Username,
			DisplayName:   p.DisplayName,
			AvatarUrl:     p.AvatarUrl,
			HasLiked:      false, // Will be updated later if needed
		}
	default:
		return nil
	}

	// Get post stats to include reply count
	qtx := db.New(s.db)
	stats, err := qtx.GetPostStats(context.Background(), post.ID)
	if err == nil {
		post.ReplyCount = int32(stats.ReplyCount)
	}

	return &post
}
