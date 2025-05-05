package controller

import (
	"context"
	"database/sql"
	"fmt"
	"horizon-backend/internal/middleware"
	"horizon-backend/internal/model"
	"horizon-backend/internal/service"
	"net/http"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/labstack/echo/v4"
)

type PostController struct {
	postService *service.PostService
	userService service.AuthService
	s3Client    *s3.Client
	bucket      string
}

func NewPostController(postService *service.PostService, userService service.AuthService, s3Client *s3.Client, bucket string) *PostController {
	return &PostController{
		postService: postService,
		userService: userService,
		s3Client:    s3Client,
		bucket:      bucket,
	}
}

func (c *PostController) CreatePost(ctx echo.Context) error {
	var request struct {
		Content       string      `json:"content"`
		IsPrivate     bool        `json:"is_private"`
		ReplyToPostID pgtype.UUID `json:"reply_to_post_id"`
		MediaUrls     []string    `json:"media_urls"`
	}

	if err := ctx.Bind(&request); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request format")
	}

	// Get user ID from the authenticated user context
	userID := middleware.GetUserIDFromContext(ctx)
	if !userID.Valid {
		return echo.NewHTTPError(http.StatusUnauthorized, "user not authenticated")
	}

	post := model.Post{
		UserID:        userID,
		Content:       request.Content,
		IsPrivate:     request.IsPrivate,
		ReplyToPostID: request.ReplyToPostID,
		MediaUrls:     request.MediaUrls,
	}

	createdPost, err := c.postService.CreatePost(ctx.Request().Context(), &post)

	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to create post: "+err.Error())
	}

	return ctx.JSON(http.StatusCreated, createdPost)
}

func (c *PostController) UpdatePostContent(ctx echo.Context) error {
	postIdStr := ctx.Param("id")

	var postId pgtype.UUID
	if err := postId.Scan(postIdStr); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid post ID format")
	}

	var request struct {
		ID      pgtype.UUID `json:"id"`
		Content string      `json:"content"`
		UserID  pgtype.UUID `json:"user_id"`
	}

	if err := ctx.Bind(&request); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request format")
	}

	updatedPost, err := c.postService.UpdatePostContent(ctx.Request().Context(), postId, request.UserID, request.Content)

	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return ctx.JSON(http.StatusOK, updatedPost)
}

// LikePost likes a post
func (c *PostController) LikePost(ctx echo.Context) error {
	// Get post ID from path parameter
	postIDStr := ctx.Param("id")
	if postIDStr == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "post ID is required")
	}

	// Convert string ID to UUID
	postUUID, err := uuid.Parse(postIDStr)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid post ID format")
	}

	// Convert to pgtype.UUID
	postID := pgtype.UUID{
		Bytes: postUUID,
		Valid: true,
	}

	// Get user ID from context
	userID := middleware.GetUserIDFromContext(ctx)
	if !userID.Valid {
		return echo.NewHTTPError(http.StatusUnauthorized, "unauthorized")
	}

	// Like the post
	err = c.postService.LikePost(ctx.Request().Context(), postID.Bytes, userID.Bytes)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, fmt.Sprintf("failed to like post: %v", err))
	}

	return ctx.NoContent(http.StatusOK)
}

// HasLiked checks if a user has liked a post
func (c *PostController) HasLiked(ctx echo.Context) error {
	// Get post ID from path parameter
	postIDStr := ctx.Param("id")
	if postIDStr == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "post ID is required")
	}

	// Convert string ID to UUID
	postUUID, err := uuid.Parse(postIDStr)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid post ID format")
	}

	// Convert to pgtype.UUID
	postID := pgtype.UUID{
		Bytes: postUUID,
		Valid: true,
	}

	// Get user ID from context
	userID := middleware.GetUserIDFromContext(ctx)
	if !userID.Valid {
		return echo.NewHTTPError(http.StatusUnauthorized, "unauthorized")
	}

	// Check if user has liked the post
	hasLiked, err := c.postService.HasLiked(ctx.Request().Context(), postID, userID)
	if err != nil {
		if err.Error() == "failed to find post: no rows in result set" {
			return echo.NewHTTPError(http.StatusNotFound, "post not found")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to check like status: "+err.Error())
	}

	return ctx.JSON(http.StatusOK, map[string]bool{"has_liked": hasLiked})
}

// UnlikePost unlikes a post
func (c *PostController) UnlikePost(ctx echo.Context) error {
	// Get post ID from path parameter
	postIDStr := ctx.Param("id")
	if postIDStr == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "post ID is required")
	}

	// Convert string ID to UUID
	postUUID, err := uuid.Parse(postIDStr)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid post ID format")
	}

	// Convert to pgtype.UUID
	postID := pgtype.UUID{
		Bytes: postUUID,
		Valid: true,
	}

	// Get user ID from context
	userID := middleware.GetUserIDFromContext(ctx)
	if !userID.Valid {
		return echo.NewHTTPError(http.StatusUnauthorized, "unauthorized")
	}

	// Unlike the post
	err = c.postService.UnlikePost(ctx.Request().Context(), postID, userID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to unlike post: "+err.Error())
	}

	return ctx.JSON(http.StatusOK, map[string]string{"message": "post unliked"})
}

// GetPosts retrieves a paginated list of posts
func (c *PostController) GetPosts(ctx echo.Context) error {
	// Get pagination parameters from query string
	limitStr := ctx.QueryParam("limit")
	offsetStr := ctx.QueryParam("offset")

	var limit int32 = 10 // Default limit
	var offset int32 = 0 // Default offset

	if limitStr != "" {
		if parsedLimit, err := strconv.Atoi(limitStr); err == nil && parsedLimit > 0 {
			limit = int32(parsedLimit)
			if limit > 50 {
				limit = 50 // Cap at 50 to prevent abuse
			}
		}
	}

	if offsetStr != "" {
		if parsedOffset, err := strconv.Atoi(offsetStr); err == nil && parsedOffset >= 0 {
			offset = int32(parsedOffset)
		}
	}

	// Create a context with the user ID
	userID := middleware.GetUserIDFromContext(ctx)
	reqCtx := context.WithValue(ctx.Request().Context(), "user_id", userID)

	// Get posts from service with the user context
	posts, err := c.postService.GetPosts(reqCtx, limit, offset)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to get posts: "+err.Error())
	}

	return ctx.JSON(http.StatusOK, posts)
}

// GetUserPosts retrieves posts by a specific user
func (c *PostController) GetUserPosts(ctx echo.Context) error {
	// Get username from path parameter
	username := ctx.Param("username")
	if username == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "username is required")
	}

	// Get pagination parameters
	limitStr := ctx.QueryParam("limit")
	offsetStr := ctx.QueryParam("offset")

	var limit int32 = 10 // Default limit
	var offset int32 = 0 // Default offset

	if limitStr != "" {
		if parsedLimit, err := strconv.Atoi(limitStr); err == nil && parsedLimit > 0 {
			limit = int32(parsedLimit)
			if limit > 50 {
				limit = 50 // Cap at 50
			}
		}
	}

	if offsetStr != "" {
		if parsedOffset, err := strconv.Atoi(offsetStr); err == nil && parsedOffset >= 0 {
			offset = int32(parsedOffset)
		}
	}

	// Create a context with the user ID
	userID := middleware.GetUserIDFromContext(ctx)
	reqCtx := context.WithValue(ctx.Request().Context(), "user_id", userID)

	// Get posts from service
	posts, err := c.postService.GetUserPostsByUsername(reqCtx, username, limit, offset)
	if err != nil {
		if err.Error() == "user not found" {
			return echo.NewHTTPError(http.StatusNotFound, "user not found")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to get user posts: "+err.Error())
	}

	return ctx.JSON(http.StatusOK, posts)
}

// GetPostByID retrieves a specific post by ID
func (c *PostController) GetPostByID(ctx echo.Context) error {
	// Get post ID from path parameter
	postIdStr := ctx.Param("id")
	if postIdStr == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "post ID is required")
	}

	// Convert to UUID
	postUUID, err := uuid.Parse(postIdStr)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid post ID format")
	}

	// Convert to pgtype.UUID
	postId := pgtype.UUID{
		Bytes: postUUID,
		Valid: true,
	}

	// Create a context with the user ID
	userID := middleware.GetUserIDFromContext(ctx)
	reqCtx := context.WithValue(ctx.Request().Context(), "user_id", userID)

	// Get post from service with the user context
	post, err := c.postService.GetPostById(reqCtx, postId)
	if err != nil {
		if err.Error() == "failed to find post: no rows in result set" {
			return echo.NewHTTPError(http.StatusNotFound, "post not found")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to get post: "+err.Error())
	}

	return ctx.JSON(http.StatusOK, post)
}

// GetPostReplies retrieves replies for a specific post
func (c *PostController) GetPostReplies(ctx echo.Context) error {
	// Get post ID from path parameter
	postIDStr := ctx.Param("id")
	if postIDStr == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "post ID is required")
	}

	// Convert string ID to UUID
	postUUID, err := uuid.Parse(postIDStr)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid post ID format")
	}

	// Convert to pgtype.UUID
	postID := pgtype.UUID{
		Bytes: postUUID,
		Valid: true,
	}

	// Get pagination parameters
	limitStr := ctx.QueryParam("limit")
	offsetStr := ctx.QueryParam("offset")

	var limit int32 = 10 // Default limit
	var offset int32 = 0 // Default offset

	if limitStr != "" {
		if parsedLimit, err := strconv.Atoi(limitStr); err == nil && parsedLimit > 0 {
			limit = int32(parsedLimit)
			if limit > 50 {
				limit = 50 // Cap at 50
			}
		}
	}

	if offsetStr != "" {
		if parsedOffset, err := strconv.Atoi(offsetStr); err == nil && parsedOffset >= 0 {
			offset = int32(parsedOffset)
		}
	}

	// Get replies from service
	replies, err := c.postService.GetPostReplies(ctx.Request().Context(), postID, limit, offset)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to get post replies: "+err.Error())
	}

	return ctx.JSON(http.StatusOK, replies)
}

// DeletePost deletes a post
func (c *PostController) DeletePost(ctx echo.Context) error {
	// Get post ID from path parameter
	postIDStr := ctx.Param("id")
	if postIDStr == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "post ID is required")
	}

	// Convert string ID to UUID
	postUUID, err := uuid.Parse(postIDStr)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid post ID format")
	}

	// Convert to pgtype.UUID
	postID := pgtype.UUID{
		Bytes: postUUID,
		Valid: true,
	}

	// Get user ID from context
	userID := middleware.GetUserIDFromContext(ctx)
	if !userID.Valid {
		return echo.NewHTTPError(http.StatusUnauthorized, "unauthorized")
	}

	// Delete the post
	err = c.postService.DeletePost(ctx.Request().Context(), postID, userID)
	if err != nil {
		if err.Error() == "failed to find post: no rows in result set" {
			return echo.NewHTTPError(http.StatusNotFound, "post not found")
		}
		if err.Error() == "unauthorized: post doesn't belong to you" {
			return echo.NewHTTPError(http.StatusForbidden, "you can only delete your own posts")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to delete post: "+err.Error())
	}

	return ctx.NoContent(http.StatusOK)
}

// GetUserReplies retrieves replies by a specific user
func (c *PostController) GetUserReplies(ctx echo.Context) error {
	// Get username from path parameter
	username := ctx.Param("username")
	if username == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "username is required")
	}

	// Get pagination parameters
	limitStr := ctx.QueryParam("limit")
	offsetStr := ctx.QueryParam("offset")

	var limit int32 = 10 // Default limit
	var offset int32 = 0 // Default offset

	if limitStr != "" {
		if parsedLimit, err := strconv.Atoi(limitStr); err == nil && parsedLimit > 0 {
			limit = int32(parsedLimit)
			if limit > 50 {
				limit = 50 // Cap at 50
			}
		}
	}

	if offsetStr != "" {
		if parsedOffset, err := strconv.Atoi(offsetStr); err == nil && parsedOffset >= 0 {
			offset = int32(parsedOffset)
		}
	}

	// Get user's replies with their parent posts
	replies, err := c.postService.GetUserRepliesByUsername(ctx.Request().Context(), username, limit, offset)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to get user replies")
	}

	// Convert to response format
	response := make([]map[string]interface{}, 0, len(replies))
	for _, reply := range replies {
		// Get the parent post
		parentPost, err := c.postService.GetPostById(ctx.Request().Context(), reply.ReplyToPostID)
		if err != nil {
			if err != sql.ErrNoRows {
				return echo.NewHTTPError(http.StatusInternalServerError, "failed to get parent post")
			}
			continue // Skip if parent post not found
		}

		// Convert to response format
		replyResponse := map[string]interface{}{
			"id":               reply.ID,
			"content":          reply.Content,
			"created_at":       reply.CreatedAt,
			"updated_at":       reply.UpdatedAt,
			"deleted_at":       reply.DeletedAt,
			"user_id":          reply.UserID,
			"reply_to_post_id": reply.ReplyToPostID,
			"is_private":       reply.IsPrivate,
			"allow_replies":    reply.AllowReplies,
			"media_urls":       reply.MediaUrls,
			"like_count":       reply.LikeCount,
			"repost_count":     reply.RepostCount,
			"reply_count":      reply.ReplyCount,
			"has_liked":        reply.HasLiked,
			"user": map[string]interface{}{
				"id":           reply.UserID,
				"username":     reply.Username,
				"display_name": reply.DisplayName.String,
				"avatar_url":   reply.AvatarUrl.String,
			},
		}

		parentResponse := map[string]interface{}{
			"id":               parentPost.ID,
			"content":          parentPost.Content,
			"created_at":       parentPost.CreatedAt,
			"updated_at":       parentPost.UpdatedAt,
			"deleted_at":       parentPost.DeletedAt,
			"user_id":          parentPost.UserID,
			"reply_to_post_id": parentPost.ReplyToPostID,
			"is_private":       parentPost.IsPrivate,
			"allow_replies":    parentPost.AllowReplies,
			"media_urls":       parentPost.MediaUrls,
			"like_count":       parentPost.LikeCount,
			"repost_count":     parentPost.RepostCount,
			"reply_count":      parentPost.ReplyCount,
			"has_liked":        parentPost.HasLiked,
			"user": map[string]interface{}{
				"id":           parentPost.UserID,
				"username":     parentPost.Username,
				"display_name": parentPost.DisplayName.String,
				"avatar_url":   parentPost.AvatarUrl.String,
			},
		}

		response = append(response, map[string]interface{}{
			"reply":      replyResponse,
			"parentPost": parentResponse,
		})
	}

	return ctx.JSON(http.StatusOK, response)
}

// GetUserLikedPosts retrieves posts liked by a specific user
func (c *PostController) GetUserLikedPosts(ctx echo.Context) error {
	// Get username from path parameter
	username := ctx.Param("username")
	if username == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "username is required")
	}

	// Get pagination parameters
	limitStr := ctx.QueryParam("limit")
	offsetStr := ctx.QueryParam("offset")

	var limit int32 = 10 // Default limit
	var offset int32 = 0 // Default offset

	if limitStr != "" {
		if parsedLimit, err := strconv.Atoi(limitStr); err == nil && parsedLimit > 0 {
			limit = int32(parsedLimit)
			if limit > 50 {
				limit = 50 // Cap at 50
			}
		}
	}

	if offsetStr != "" {
		if parsedOffset, err := strconv.Atoi(offsetStr); err == nil && parsedOffset >= 0 {
			offset = int32(parsedOffset)
		}
	}

	// Get user's liked posts
	posts, err := c.postService.GetUserLikedPostsByUsername(ctx.Request().Context(), username, limit, offset)
	if err != nil {
		if err.Error() == "failed to find user: no rows in result set" {
			return echo.NewHTTPError(http.StatusNotFound, "user not found")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to get user's liked posts")
	}

	return ctx.JSON(http.StatusOK, posts)
}

// BookmarkPost handles bookmarking a post
func (c *PostController) BookmarkPost(ctx echo.Context) error {
	// Get post ID from path parameter
	postID := ctx.Param("postId")
	if postID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "post ID is required")
	}

	// Get user ID from context using the middleware helper
	userID := middleware.GetUserIDFromContext(ctx)
	if !userID.Valid {
		return echo.NewHTTPError(http.StatusUnauthorized, "user not authenticated")
	}

	// Convert UUID to string
	userIDStr := uuid.UUID(userID.Bytes).String()

	// Create bookmark
	err := c.postService.BookmarkPost(ctx.Request().Context(), postID, userIDStr)
	if err != nil {
		switch {
		case err.Error() == "post already bookmarked":
			return echo.NewHTTPError(http.StatusConflict, "post already bookmarked")
		case err.Error() == "post not found":
			return echo.NewHTTPError(http.StatusNotFound, "post not found")
		case err.Error() == "invalid post ID":
			return echo.NewHTTPError(http.StatusBadRequest, "invalid post ID format")
		case err.Error() == "invalid user ID":
			return echo.NewHTTPError(http.StatusBadRequest, "invalid user ID format")
		default:
			return echo.NewHTTPError(http.StatusInternalServerError, "failed to bookmark post: "+err.Error())
		}
	}

	return ctx.NoContent(http.StatusCreated)
}

// UnbookmarkPost handles removing a bookmark
func (c *PostController) UnbookmarkPost(ctx echo.Context) error {
	// Get post ID from path parameter
	postID := ctx.Param("postId")
	if postID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "post ID is required")
	}

	// Get user ID from context using the middleware helper
	userID := middleware.GetUserIDFromContext(ctx)
	if !userID.Valid {
		return echo.NewHTTPError(http.StatusUnauthorized, "user not authenticated")
	}

	// Convert UUID to string
	userIDStr := uuid.UUID(userID.Bytes).String()

	// Remove bookmark
	err := c.postService.UnbookmarkPost(ctx.Request().Context(), postID, userIDStr)
	if err != nil {
		if err.Error() == "bookmark not found" {
			return echo.NewHTTPError(http.StatusNotFound, "bookmark not found")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to remove bookmark")
	}

	return ctx.NoContent(http.StatusOK)
}

// GetUserBookmarks returns all bookmarked posts for a user
func (c *PostController) GetUserBookmarks(ctx echo.Context) error {
	// Get user ID from context using the middleware helper
	userID := middleware.GetUserIDFromContext(ctx)
	if !userID.Valid {
		return echo.NewHTTPError(http.StatusUnauthorized, "user not authenticated")
	}

	// Convert UUID to string
	userIDStr := uuid.UUID(userID.Bytes).String()

	// Get pagination parameters
	limitStr := ctx.QueryParam("limit")
	offsetStr := ctx.QueryParam("offset")

	var limit int32 = 10 // Default limit
	var offset int32 = 0 // Default offset

	if limitStr != "" {
		if parsedLimit, err := strconv.Atoi(limitStr); err == nil && parsedLimit > 0 {
			limit = int32(parsedLimit)
			if limit > 50 {
				limit = 50 // Cap at 50
			}
		}
	}

	if offsetStr != "" {
		if parsedOffset, err := strconv.Atoi(offsetStr); err == nil && parsedOffset >= 0 {
			offset = int32(parsedOffset)
		}
	}

	// Get bookmarked posts
	posts, err := c.postService.GetUserBookmarks(ctx.Request().Context(), userIDStr, limit, offset)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to get bookmarked posts")
	}

	return ctx.JSON(http.StatusOK, posts)
}

// GetUploadURL generates a presigned URL for uploading post media
func (c *PostController) GetUploadURL(ctx echo.Context) error {
	// Get file extension from the request
	fileType := ctx.QueryParam("fileType")
	if fileType == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "fileType is required")
	}

	// Validate file type
	fileType = strings.ToLower(fileType)
	allowedTypes := map[string]bool{
		"image/jpeg": true,
		"image/png":  true,
		"image/gif":  true,
		"image/webp": true,
	}
	if !allowedTypes[fileType] {
		return echo.NewHTTPError(http.StatusBadRequest, "unsupported file type")
	}

	// Generate unique filename with proper extension
	ext := filepath.Ext(fileType)
	if ext == "" {
		switch fileType {
		case "image/jpeg":
			ext = ".jpg"
		case "image/png":
			ext = ".png"
		case "image/gif":
			ext = ".gif"
		case "image/webp":
			ext = ".webp"
		}
	}
	filename := fmt.Sprintf("%s%s", uuid.New().String(), ext)
	key := fmt.Sprintf("media/posts/%s", filename)

	// Generate presigned URL
	presignClient := s3.NewPresignClient(c.s3Client)
	presignedURL, err := presignClient.PresignPutObject(ctx.Request().Context(), &s3.PutObjectInput{
		Bucket:      aws.String(c.bucket),
		Key:         aws.String(key),
		ContentType: aws.String(fileType),
	}, s3.WithPresignExpires(time.Minute*5))

	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to generate presigned URL")
	}

	// Return the presigned URL and the final URL where the image will be accessible
	return ctx.JSON(http.StatusOK, map[string]string{
		"uploadURL": presignedURL.URL,
		"fileURL":   fmt.Sprintf("https://%s.s3.amazonaws.com/%s", c.bucket, key),
	})
}
