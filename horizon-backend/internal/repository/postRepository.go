package repository

import (
	"context"

	
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"

	"horizon-backend/internal/db"
	"horizon-backend/internal/model"
)

type PostRepository struct {
	queries *db.Queries
}

func NewPostRepository(queries *db.Queries) *PostRepository {
	return &PostRepository{
		queries: queries,
	}
}

func (r *PostRepository) CreatePost(ctx context.Context, post *model.Post) (*model.Post, error) {
	
}

