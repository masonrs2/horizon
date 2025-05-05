package service

import (
	"context"
	"fmt"

	"horizon-backend/internal/db"
	"horizon-backend/internal/model"

	"github.com/jackc/pgx/v5/pgtype"
)

type NotificationService struct {
	queries *db.Queries
}

func NewNotificationService(queries *db.Queries) *NotificationService {
	return &NotificationService{
		queries: queries,
	}
}

func (s *NotificationService) CreateNotification(ctx context.Context, userID, actorID [16]byte, postID, parentPostID *[16]byte, notificationType model.NotificationType) (*model.Notification, error) {
	// Convert IDs to pgtype.UUID
	user := pgtype.UUID{Bytes: userID, Valid: true}
	actor := pgtype.UUID{Bytes: actorID, Valid: true}

	var post, parentPost pgtype.UUID
	if postID != nil {
		post = pgtype.UUID{Bytes: *postID, Valid: true}
	}
	if parentPostID != nil {
		parentPost = pgtype.UUID{Bytes: *parentPostID, Valid: true}
	}

	// Create notification
	dbNotif, err := s.queries.CreateNotification(ctx, db.CreateNotificationParams{
		UserID:           user,
		ActorID:          actor,
		PostID:           post,
		ParentPostID:     parentPost,
		NotificationType: db.NotificationType(notificationType),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create notification: %w", err)
	}

	// Convert to model
	notification := &model.Notification{
		ID:           dbNotif.ID,
		UserID:       dbNotif.UserID,
		ActorID:      dbNotif.ActorID,
		PostID:       dbNotif.PostID,
		ParentPostID: dbNotif.ParentPostID,
		Type:         model.NotificationType(dbNotif.Type),
		Read:         dbNotif.Read,
		CreatedAt:    dbNotif.CreatedAt,
		UpdatedAt:    dbNotif.UpdatedAt,
		DeletedAt:    dbNotif.DeletedAt,
	}

	return notification, nil
}

func (s *NotificationService) GetNotifications(ctx context.Context, userID [16]byte, limit, offset int32) ([]*model.Notification, error) {
	// Convert userID to pgtype.UUID
	id := pgtype.UUID{Bytes: userID, Valid: true}

	// Get notifications
	dbNotifs, err := s.queries.GetNotifications(ctx, db.GetNotificationsParams{
		UserID: id,
		Limit:  limit,
		Offset: offset,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get notifications: %w", err)
	}

	// Convert to model notifications
	notifications := make([]*model.Notification, len(dbNotifs))
	for i, dbNotif := range dbNotifs {
		notifications[i] = &model.Notification{
			ID:                dbNotif.ID,
			UserID:            dbNotif.UserID,
			ActorID:           dbNotif.ActorID,
			PostID:            dbNotif.PostID,
			ParentPostID:      dbNotif.ParentPostID,
			Type:              model.NotificationType(dbNotif.Type),
			Read:              dbNotif.Read,
			CreatedAt:         dbNotif.CreatedAt,
			UpdatedAt:         dbNotif.UpdatedAt,
			DeletedAt:         dbNotif.DeletedAt,
			ActorUsername:     dbNotif.ActorUsername,
			ActorDisplayName:  dbNotif.ActorDisplayName,
			ActorAvatarURL:    dbNotif.ActorAvatarUrl,
			PostContent:       dbNotif.PostContent,
			ParentPostContent: dbNotif.ParentPostContent,
		}
	}

	return notifications, nil
}

func (s *NotificationService) GetUnreadCount(ctx context.Context, userID [16]byte) (int64, error) {
	// Convert userID to pgtype.UUID
	id := pgtype.UUID{Bytes: userID, Valid: true}

	// Get unread count
	count, err := s.queries.GetUnreadNotificationCount(ctx, id)
	if err != nil {
		return 0, fmt.Errorf("failed to get unread notification count: %w", err)
	}

	return count, nil
}

func (s *NotificationService) MarkAsRead(ctx context.Context, notificationID [16]byte) error {
	// Convert notificationID to pgtype.UUID
	id := pgtype.UUID{Bytes: notificationID, Valid: true}

	// Mark as read
	_, err := s.queries.MarkNotificationAsRead(ctx, id)
	if err != nil {
		return fmt.Errorf("failed to mark notification as read: %w", err)
	}

	return nil
}

func (s *NotificationService) MarkAllAsRead(ctx context.Context, userID [16]byte) error {
	// Convert userID to pgtype.UUID
	id := pgtype.UUID{Bytes: userID, Valid: true}

	// Mark all as read
	err := s.queries.MarkAllNotificationsAsRead(ctx, id)
	if err != nil {
		return fmt.Errorf("failed to mark all notifications as read: %w", err)
	}

	return nil
}

func (s *NotificationService) DeleteNotification(ctx context.Context, notificationID [16]byte) error {
	// Convert notificationID to pgtype.UUID
	id := pgtype.UUID{Bytes: notificationID, Valid: true}

	// Delete notification
	err := s.queries.DeleteNotification(ctx, id)
	if err != nil {
		return fmt.Errorf("failed to delete notification: %w", err)
	}

	return nil
}
