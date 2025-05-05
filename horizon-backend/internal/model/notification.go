package model

import (
	"github.com/jackc/pgx/v5/pgtype"
)

type NotificationType string

const (
	NotificationTypeLike   NotificationType = "like"
	NotificationTypeRepost NotificationType = "repost"
	NotificationTypeReply  NotificationType = "reply"
	NotificationTypeFollow NotificationType = "follow"
)

type Notification struct {
	ID           pgtype.UUID        `json:"id"`
	UserID       pgtype.UUID        `json:"user_id"`
	ActorID      pgtype.UUID        `json:"actor_id"`
	PostID       pgtype.UUID        `json:"post_id,omitempty"`
	ParentPostID pgtype.UUID        `json:"parent_post_id,omitempty"`
	Type         NotificationType   `json:"type"`
	Read         bool               `json:"read"`
	CreatedAt    pgtype.Timestamptz `json:"created_at"`
	UpdatedAt    pgtype.Timestamptz `json:"updated_at"`
	DeletedAt    pgtype.Timestamptz `json:"deleted_at,omitempty"`

	// Additional fields from joins
	ActorUsername     string      `json:"actor_username"`
	ActorDisplayName  pgtype.Text `json:"actor_display_name"`
	ActorAvatarURL    pgtype.Text `json:"actor_avatar_url"`
	PostContent       pgtype.Text `json:"post_content,omitempty"`
	ParentPostContent pgtype.Text `json:"parent_post_content,omitempty"`
}
