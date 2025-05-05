package controller

import (
	"fmt"
	"net/http"
	"strconv"

	"horizon-backend/internal/model"
	"horizon-backend/internal/service"

	"github.com/labstack/echo/v4"
)

type FollowController struct {
	followService *service.FollowService
	userService   *service.UserService
}

func NewFollowController(followService *service.FollowService, userService *service.UserService) *FollowController {
	return &FollowController{
		followService: followService,
		userService:   userService,
	}
}

// GetUserFromContext gets the current user from the context
func GetUserFromContext(ctx echo.Context) (*model.User, error) {
	user, ok := ctx.Get("user").(*model.User)
	if !ok || user == nil {
		return nil, echo.NewHTTPError(http.StatusUnauthorized, "unauthorized")
	}
	return user, nil
}

// GetPaginationParams gets pagination parameters from the request
func GetPaginationParams(ctx echo.Context) (limit, offset int32) {
	limitStr := ctx.QueryParam("limit")
	offsetStr := ctx.QueryParam("offset")

	limit = 10 // Default limit
	if limitStr != "" {
		if parsedLimit, err := strconv.Atoi(limitStr); err == nil && parsedLimit > 0 {
			limit = int32(parsedLimit)
			if limit > 50 {
				limit = 50 // Cap at 50
			}
		}
	}

	offset = 0 // Default offset
	if offsetStr != "" {
		if parsedOffset, err := strconv.Atoi(offsetStr); err == nil && parsedOffset >= 0 {
			offset = int32(parsedOffset)
		}
	}

	return limit, offset
}

// FollowUser handles the follow user request
func (c *FollowController) FollowUser(ctx echo.Context) error {
	// Get current user from context
	currentUser, err := GetUserFromContext(ctx)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "unauthorized")
	}

	// Get username from path parameter
	username := ctx.Param("username")
	if username == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "username is required")
	}

	// Get user to follow
	userToFollow, err := c.userService.GetUserByUsername(ctx.Request().Context(), username)
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "user not found")
	}

	// Follow the user
	response, err := c.followService.FollowUser(ctx.Request().Context(), currentUser.ID.Bytes, userToFollow.ID.Bytes)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, fmt.Sprintf("failed to follow user: %v", err))
	}

	return ctx.JSON(http.StatusOK, response)
}

// UnfollowUser handles the unfollow user request
func (c *FollowController) UnfollowUser(ctx echo.Context) error {
	// Get current user from context
	currentUser, err := GetUserFromContext(ctx)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "unauthorized")
	}

	// Get username from path parameter
	username := ctx.Param("username")
	if username == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "username is required")
	}

	// Get user to unfollow
	userToUnfollow, err := c.userService.GetUserByUsername(ctx.Request().Context(), username)
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "user not found")
	}

	// Unfollow user
	err = c.followService.UnfollowUser(ctx.Request().Context(), currentUser.ID, userToUnfollow.ID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to unfollow user")
	}

	return ctx.NoContent(http.StatusOK)
}

// GetFollowers handles the get followers request
func (c *FollowController) GetFollowers(ctx echo.Context) error {
	// Get username from path parameter
	username := ctx.Param("username")
	if username == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "username is required")
	}

	// Get user
	user, err := c.userService.GetUserByUsername(ctx.Request().Context(), username)
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "user not found")
	}

	// Get pagination parameters
	limit, offset := GetPaginationParams(ctx)

	// Get followers
	followers, err := c.followService.GetFollowers(ctx.Request().Context(), user.ID, limit, offset)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to get followers")
	}

	return ctx.JSON(http.StatusOK, followers)
}

// GetFollowing handles the get following request
func (c *FollowController) GetFollowing(ctx echo.Context) error {
	// Get username from path parameter
	username := ctx.Param("username")
	if username == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "username is required")
	}

	// Get user
	user, err := c.userService.GetUserByUsername(ctx.Request().Context(), username)
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "user not found")
	}

	// Get pagination parameters
	limit, offset := GetPaginationParams(ctx)

	// Get following
	following, err := c.followService.GetFollowing(ctx.Request().Context(), user.ID, limit, offset)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to get following")
	}

	return ctx.JSON(http.StatusOK, following)
}

// GetFollowStatus handles the get follow status request
func (c *FollowController) GetFollowStatus(ctx echo.Context) error {
	// Get current user from context
	currentUser, err := GetUserFromContext(ctx)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "You must be logged in to check follow status")
	}

	// Get username from path parameter
	username := ctx.Param("username")
	if username == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "Username parameter is required")
	}

	// Check if user is trying to check follow status with themselves
	if username == currentUser.Username {
		return ctx.JSON(http.StatusOK, &service.FollowStatus{
			IsFollowing: false,
			IsAccepted:  false,
		})
	}

	// Get target user
	targetUser, err := c.userService.GetUserByUsername(ctx.Request().Context(), username)
	if err != nil {
		if err.Error() == "user not found" {
			return echo.NewHTTPError(http.StatusNotFound, "The user you're looking for doesn't exist")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "Error finding user: "+err.Error())
	}

	// Get follow status
	status, err := c.followService.GetFollowStatus(ctx.Request().Context(), currentUser.ID, targetUser.ID)
	if err != nil {
		if err.Error() == "invalid user IDs provided" {
			return echo.NewHTTPError(http.StatusBadRequest, "Invalid user IDs provided")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "Error checking follow status: "+err.Error())
	}

	return ctx.JSON(http.StatusOK, status)
}

// AcceptFollowRequest handles the accept follow request
func (c *FollowController) AcceptFollowRequest(ctx echo.Context) error {
	// Get current user from context
	currentUser, err := GetUserFromContext(ctx)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "unauthorized")
	}

	// Get username from path parameter
	username := ctx.Param("username")
	if username == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "username is required")
	}

	// Get follower user
	followerUser, err := c.userService.GetUserByUsername(ctx.Request().Context(), username)
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "user not found")
	}

	// Accept follow request
	err = c.followService.AcceptFollowRequest(ctx.Request().Context(), followerUser.ID, currentUser.ID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to accept follow request")
	}

	return ctx.NoContent(http.StatusOK)
}
