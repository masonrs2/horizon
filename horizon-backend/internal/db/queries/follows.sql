-- name: CreateFollow :one
INSERT INTO follows (follower_id, followed_id, is_accepted)
VALUES ($1, $2, CASE WHEN (
    SELECT is_private FROM users WHERE id = $2
) THEN false ELSE true END)
RETURNING *;

-- name: AcceptFollow :one
UPDATE follows
SET is_accepted = true
WHERE follower_id = $1 AND followed_id = $2
RETURNING *;

-- name: DeleteFollow :exec
DELETE FROM follows
WHERE follower_id = $1 AND followed_id = $2;

-- name: GetFollowStatus :one
SELECT EXISTS (
    SELECT 1 FROM follows
    WHERE follower_id = $1 AND followed_id = $2
    AND is_accepted = true
) as is_following;

-- name: GetFollowers :many
SELECT 
    u.id,
    u.username,
    u.display_name,
    u.avatar_url,
    u.created_at,
    u.updated_at,
    u.is_private,
    f.created_at as followed_at
FROM users u
JOIN follows f ON u.id = f.follower_id
WHERE f.followed_id = $1
AND f.is_accepted = true
ORDER BY f.created_at DESC
LIMIT $2 OFFSET $3;

-- name: GetFollowing :many
SELECT 
    u.id,
    u.username,
    u.display_name,
    u.avatar_url,
    u.created_at,
    u.updated_at,
    u.is_private,
    f.created_at as followed_at
FROM users u
JOIN follows f ON u.id = f.followed_id
WHERE f.follower_id = $1
AND f.is_accepted = true
ORDER BY f.created_at DESC
LIMIT $2 OFFSET $3;

-- name: GetFollowersCount :one
SELECT COUNT(*)
FROM follows
WHERE followed_id = $1
AND is_accepted = true;

-- name: GetFollowingCount :one
SELECT COUNT(*)
FROM follows
WHERE follower_id = $1
AND is_accepted = true;

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