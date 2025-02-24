-- name: CreatePost :one
INSERT INTO posts (
    user_id,
    content,
    is_private,
    reply_to_post_id,
    media_urls
) VALUES (
    $1, $2, $3, $4, $5
)
RETURNING *;

-- name: GetPostByID :one
SELECT * FROM posts 
WHERE id = $1 AND deleted_at IS NULL;

-- name: GetPostsByUserID :many
SELECT * FROM posts 
WHERE user_id = $1 
AND deleted_at IS NULL 
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: GetUserFeed :many
SELECT p.* FROM posts p
INNER JOIN follows f ON p.user_id = f.followed_id
WHERE f.follower_id = $1 
AND p.deleted_at IS NULL
AND (NOT p.is_private OR p.user_id IN (
    SELECT followed_id FROM follows 
    WHERE follower_id = $1 AND is_accepted = true
))
ORDER BY p.created_at DESC
LIMIT $2 OFFSET $3;

-- name: GetPostReplies :many
SELECT * FROM posts
WHERE reply_to_post_id = $1 
AND deleted_at IS NULL
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: DeletePost :exec
UPDATE posts 
SET deleted_at = NOW()
WHERE id = $1 AND user_id = $2
RETURNING id;

-- name: GetPostsWithHashtag :many
SELECT p.* FROM posts p
INNER JOIN post_hashtags ph ON p.id = ph.post_id
WHERE ph.hashtag = $1 
AND p.deleted_at IS NULL
ORDER BY p.created_at DESC
LIMIT $2 OFFSET $3;

-- name: LikePost :one
INSERT INTO post_likes (post_id, user_id)
VALUES ($1, $2)
RETURNING *;

-- name: UnlikePost :exec
DELETE FROM post_likes 
WHERE post_id = $1 AND user_id = $2;

-- name: GetPostLikeCount :one
SELECT COUNT(*) FROM post_likes
WHERE post_id = $1;

-- name: RepostPost :one
INSERT INTO reposts (post_id, user_id)
VALUES ($1, $2)
RETURNING *;

-- name: GetPostRepostCount :one
SELECT COUNT(*) FROM reposts
WHERE post_id = $1;

-- name: GetPostStats :one
SELECT 
    (SELECT COUNT(*) FROM post_likes WHERE post_id = $1) as like_count,
    (SELECT COUNT(*) FROM reposts WHERE post_id = $1) as repost_count,
    (SELECT COUNT(*) FROM posts WHERE reply_to_post_id = $1 AND deleted_at IS NULL) as reply_count
FROM posts 
WHERE id = $1 AND deleted_at IS NULL; 