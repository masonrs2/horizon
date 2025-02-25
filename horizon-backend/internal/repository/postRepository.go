package repository

import (
	"context"
	"fmt"

	"horizon-backend/internal/db"
	"horizon-backend/internal/model"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PostRepository struct {
	queries *db.Queries
	db      *pgxpool.Pool
}

func NewPostRepository(queries *db.Queries, pool *pgxpool.Pool) *PostRepository {
	return &PostRepository{
		queries: queries,
		db:      pool,
	}
}

func (r *PostRepository) CreatePost(ctx context.Context, post *model.Post) (*model.Post, error) {
	if post.Content == "" {
		return nil, fmt.Errorf("content is required")
	}

	params := db.CreatePostParams{
		UserID:        post.UserID,
		Content:       post.Content,
		IsPrivate:     post.IsPrivate,
		ReplyToPostID: post.ReplyToPostID,
		MediaUrls:     post.MediaUrls,
	}

	createdPost, err := r.queries.CreatePost(ctx, params)
	if err != nil {
		return nil, fmt.Errorf("failed to create post: %w", err)
	}

	return &model.Post{
		ID:            createdPost.ID,
		Content:       createdPost.Content,
		CreatedAt:     createdPost.CreatedAt,
		UpdatedAt:     createdPost.UpdatedAt,
		IsPrivate:     createdPost.IsPrivate,
		ReplyToPostID: createdPost.ReplyToPostID,
		MediaUrls:     createdPost.MediaUrls,
	}, nil
}

func (r *PostRepository) UpdatePostContent(ctx context.Context, postId, userId pgtype.UUID, content string) (*model.Post, error) {
	if content == "" {
		return nil, fmt.Errorf("Updated content cannot be empty!")
	}

	params := db.UpdatePostContentParams{
		ID:      postId,
		Content: content,
		UserID:  userId,
	}

	updatedPost, err := r.queries.UpdatePostContent(ctx, params)
	if err != nil {
		return nil, fmt.Errorf("failed to update post: %w", err)
	}

	return &model.Post{
		ID:        updatedPost.ID,
		Content:   updatedPost.Content,
		CreatedAt: updatedPost.CreatedAt,
		UpdatedAt: updatedPost.UpdatedAt,
	}, nil
}

func (r *PostRepository) LikePost(ctx context.Context, postID, userID pgtype.UUID) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	qtx := r.queries.WithTx(tx)

	// First record the like
	_, err = qtx.LikePost(ctx, db.LikePostParams{
		PostID: postID,
		UserID: userID,
	})
	if err != nil {
		return fmt.Errorf("failed to like post: %w", err)
	}

	// Then increment the counter
	_, err = qtx.IncrementLikeCount(ctx, postID)
	if err != nil {
		return fmt.Errorf("failed to increment like count: %w", err)
	}

	return tx.Commit(ctx)
}

func (r *PostRepository) GetPostById(ctx context.Context, postId pgtype.UUID) (*model.Post, error) {
	dbPost, err := r.queries.GetPostByID(ctx, postId) 
	
	if err != nil {
		return nil, fmt.Errorf("failed to get post with id: %w", err)
	}

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
    }, nil
}