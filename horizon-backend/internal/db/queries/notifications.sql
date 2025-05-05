-- name: CreateNotification :one
INSERT INTO notifications (
    user_id,
    actor_id,
    post_id,
    parent_post_id,
    type
)
VALUES (
    @user_id,
    @actor_id,
    @post_id,
    @parent_post_id,
    @notification_type::notification_type
)
RETURNING *;

-- name: GetNotifications :many
SELECT 
    n.*,
    COALESCE(actor.username, '') as actor_username,
    actor.display_name as actor_display_name,
    actor.avatar_url as actor_avatar_url,
    p.content as post_content,
    pp.content as parent_post_content
FROM notifications n
LEFT JOIN users actor ON n.actor_id = actor.id AND actor.deleted_at IS NULL
LEFT JOIN posts p ON n.post_id = p.id AND p.deleted_at IS NULL
LEFT JOIN posts pp ON n.parent_post_id = pp.id AND pp.deleted_at IS NULL
WHERE n.user_id = $1 
    AND n.deleted_at IS NULL
ORDER BY n.created_at DESC
LIMIT $2
OFFSET $3;

-- name: GetUnreadNotificationCount :one
SELECT COUNT(*)
FROM notifications
WHERE user_id = $1 
    AND read = false 
    AND deleted_at IS NULL;

-- name: MarkNotificationAsRead :one
UPDATE notifications
SET read = true,
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: MarkAllNotificationsAsRead :exec
UPDATE notifications
SET read = true,
    updated_at = NOW()
WHERE user_id = $1
    AND read = false
    AND deleted_at IS NULL;

-- name: DeleteNotification :exec
UPDATE notifications
SET deleted_at = NOW()
WHERE id = $1; 