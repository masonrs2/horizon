package controller

import (
	"context"
	"horizon-backend/internal/middleware"
	"horizon-backend/internal/model"
	"horizon-backend/internal/service"
	"net/http"
	"strconv"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/labstack/echo/v4"
)

type PostController struct {
	service *service.PostService
}

func NewPostController(service *service.PostService) *PostController {
	return &PostController{
		service: service,
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

	createdPost, err := c.service.CreatePost(ctx.Request().Context(), &post)

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

	updatedPost, err := c.service.UpdatePostContent(ctx.Request().Context(), postId, request.UserID, request.Content)

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
	err = c.service.LikePost(ctx.Request().Context(), postID, userID)
	if err != nil {
		if err.Error() == "user has already liked this post" {
			return echo.NewHTTPError(http.StatusConflict, "you have already liked this post")
		}
		if err.Error() == "failed to find post: no rows in result set" {
			return echo.NewHTTPError(http.StatusNotFound, "post not found")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to like post: "+err.Error())
	}

	return ctx.JSON(http.StatusOK, map[string]string{"message": "post liked"})
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
	hasLiked, err := c.service.HasLiked(ctx.Request().Context(), postID, userID)
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
	err = c.service.UnlikePost(ctx.Request().Context(), postID, userID)
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
	posts, err := c.service.GetPosts(reqCtx, limit, offset)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to get posts: "+err.Error())
	}

	return ctx.JSON(http.StatusOK, posts)
}

// GetUserPosts retrieves posts by a specific user
func (c *PostController) GetUserPosts(ctx echo.Context) error {
	// Get user ID from path parameter
	userIdStr := ctx.Param("id")
	if userIdStr == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "user ID is required")
	}

	// Parse user ID
	var userId pgtype.UUID
	if userIdStr == "me" {
		// Get the current user's ID from context
		userId = middleware.GetUserIDFromContext(ctx)
		if !userId.Valid {
			return echo.NewHTTPError(http.StatusUnauthorized, "user not authenticated")
		}
	} else {
		// Parse the provided user ID
		userUUID, err := uuid.Parse(userIdStr)
		if err != nil {
			return echo.NewHTTPError(http.StatusBadRequest, "invalid user ID format")
		}
		userId = pgtype.UUID{
			Bytes: userUUID,
			Valid: true,
		}
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

	// Get posts from service
	posts, err := c.service.GetUserPosts(ctx.Request().Context(), userId, limit, offset)
	if err != nil {
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
	post, err := c.service.GetPostById(reqCtx, postId)
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
	replies, err := c.service.GetPostReplies(ctx.Request().Context(), postID, limit, offset)
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
	err = c.service.DeletePost(ctx.Request().Context(), postID, userID)
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
