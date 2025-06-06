package model

import (
	"github.com/jackc/pgx/v5/pgtype"
)

type Post struct {
	ID            pgtype.UUID        `json:"id"`
	UserID        pgtype.UUID        `json:"user_id"`
	Content       string             `json:"content"`
	CreatedAt     pgtype.Timestamptz `json:"created_at"`
	UpdatedAt     pgtype.Timestamptz `json:"updated_at"`
	DeletedAt     pgtype.Timestamptz `json:"deleted_at"`
	IsPrivate     bool               `json:"is_private"`
	ReplyToPostID pgtype.UUID        `json:"reply_to_post_id"`
	AllowReplies  bool               `json:"allow_replies"`
	MediaUrls     []string           `json:"media_urls"`
	LikeCount     int32              `json:"like_count"`
	RepostCount   int32              `json:"repost_count"`
	ReplyCount    int32              `json:"reply_count"`
	HasLiked      bool               `json:"has_liked"`
	HasBookmarked bool               `json:"has_bookmarked"`
	// User information
	Username    string      `json:"username"`
	DisplayName pgtype.Text `json:"display_name"`
	AvatarUrl   pgtype.Text `json:"avatar_url"`
}
