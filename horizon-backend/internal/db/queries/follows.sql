-- name: CreateFollow :one
INSERT INTO follows (follower_id, followed_id, is_accepted)
VALUES ($1, $2, CASE WHEN (
    SELECT is_private FROM users WHERE id = $2 AND deleted_at IS NULL
) THEN false ELSE true END)
RETURNING follower_id, followed_id, is_accepted, created_at;

-- name: AcceptFollow :one
UPDATE follows
SET is_accepted = true
WHERE follower_id = $1 AND followed_id = $2
RETURNING follower_id, followed_id, is_accepted, created_at;

-- name: DeleteFollow :exec
DELETE FROM follows
WHERE follower_id = $1 AND followed_id = $2;

-- name: GetFollowStatus :one
SELECT EXISTS (
    SELECT 1 FROM follows f
    WHERE f.follower_id = $1 AND f.followed_id = $2
) as is_following,
COALESCE(
    (SELECT f.is_accepted::boolean FROM follows f
    WHERE f.follower_id = $1 AND f.followed_id = $2),
    false
)::boolean as is_accepted;

-- name: GetFollowers :many
SELECT 
    u.id,
    u.username,
    u.display_name,
    u.avatar_url,
    u.bio,
    u.is_private,
    f.is_accepted,
    f.created_at
FROM follows f
JOIN users u ON f.follower_id = u.id
WHERE f.followed_id = $1 AND u.deleted_at IS NULL
ORDER BY f.created_at DESC
LIMIT $2 OFFSET $3;

-- name: GetFollowing :many
SELECT 
    u.id,
    u.username,
    u.display_name,
    u.avatar_url,
    u.bio,
    u.is_private,
    f.is_accepted,
    f.created_at
FROM follows f
JOIN users u ON f.followed_id = u.id
WHERE f.follower_id = $1 AND u.deleted_at IS NULL
ORDER BY f.created_at DESC
LIMIT $2 OFFSET $3;

-- name: GetPendingFollowRequests :many
SELECT 
    u.id,
    u.username,
    u.display_name,
    u.avatar_url,
    u.bio,
    u.is_private,
    f.created_at
FROM follows f
JOIN users u ON f.follower_id = u.id
WHERE f.followed_id = $1 AND f.is_accepted = false AND u.deleted_at IS NULL
ORDER BY f.created_at DESC
LIMIT $2 OFFSET $3; 