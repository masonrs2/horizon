package controller

import (
	"horizon-backend/internal/model"
	"horizon-backend/internal/service"
	"net/http"

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
		UserID        pgtype.UUID `json:"user_id"`
		Content       string      `json:"content"`
		IsPrivate     bool        `json:"is_private"`
		ReplyToPostID pgtype.UUID `json:"reply_to_post_id"`
		MediaUrls     []string    `json:"media_urls"`
	}

	if err := ctx.Bind(&request); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request format")
	}

	post := model.Post{
		UserID:        request.UserID,
		Content:       request.Content,
		IsPrivate:     request.IsPrivate,
		ReplyToPostID: request.ReplyToPostID,
		MediaUrls:     request.MediaUrls,
	}

	createdPost, err := c.service.CreatePost(ctx.Request().Context(), &post)

	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
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

func (c *PostController) LikePost(ctx echo.Context) error {
	postIdStr := ctx.Param("id")

	var postId pgtype.UUID
	if err := postId.Scan(postIdStr); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid post ID format")
	}

	// Parse request body to get user ID
	var request struct {
		UserID pgtype.UUID `json:"user_id"`
	}

	if err := ctx.Bind(&request); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request format")
	}

	// Call service method to like	 the post
	err := c.service.LikePost(ctx.Request().Context(), postId, request.UserID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return ctx.NoContent(http.StatusOK)
}
