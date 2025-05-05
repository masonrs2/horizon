package controller

import (
	"net/http"
	"strconv"

	"horizon-backend/internal/service"
	"horizon-backend/internal/util"

	"github.com/labstack/echo/v4"
)

type NotificationController struct {
	notificationService *service.NotificationService
}

func NewNotificationController(notificationService *service.NotificationService) *NotificationController {
	return &NotificationController{
		notificationService: notificationService,
	}
}

// GetNotifications handles GET /api/notifications
func (c *NotificationController) GetNotifications(ctx echo.Context) error {
	// Get user ID from context
	userID, err := util.GetUserIDFromContext(ctx.Request().Context())
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "unauthorized")
	}

	// Get pagination params
	limit := int32(20)
	offset := int32(0)
	if limitStr := ctx.QueryParam("limit"); limitStr != "" {
		if l, err := strconv.ParseInt(limitStr, 10, 32); err == nil {
			limit = int32(l)
		}
	}
	if offsetStr := ctx.QueryParam("offset"); offsetStr != "" {
		if o, err := strconv.ParseInt(offsetStr, 10, 32); err == nil {
			offset = int32(o)
		}
	}

	// Get notifications
	notifications, err := c.notificationService.GetNotifications(ctx.Request().Context(), userID, limit, offset)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to get notifications")
	}

	return ctx.JSON(http.StatusOK, notifications)
}

// GetUnreadCount handles GET /api/notifications/unread-count
func (c *NotificationController) GetUnreadCount(ctx echo.Context) error {
	// Get user ID from context
	userID, err := util.GetUserIDFromContext(ctx.Request().Context())
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "unauthorized")
	}

	// Get unread count
	count, err := c.notificationService.GetUnreadCount(ctx.Request().Context(), userID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to get unread count")
	}

	return ctx.JSON(http.StatusOK, map[string]int64{"count": count})
}

// MarkAsRead handles PUT /api/notifications/:id/read
func (c *NotificationController) MarkAsRead(ctx echo.Context) error {
	// Get notification ID from URL
	notificationID, err := util.GetUUIDFromString(ctx.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid notification ID")
	}

	// Mark as read
	err = c.notificationService.MarkAsRead(ctx.Request().Context(), notificationID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to mark notification as read")
	}

	return ctx.NoContent(http.StatusNoContent)
}

// MarkAllAsRead handles PUT /api/notifications/mark-all-read
func (c *NotificationController) MarkAllAsRead(ctx echo.Context) error {
	// Get user ID from context
	userID, err := util.GetUserIDFromContext(ctx.Request().Context())
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "unauthorized")
	}

	// Mark all as read
	err = c.notificationService.MarkAllAsRead(ctx.Request().Context(), userID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to mark all notifications as read")
	}

	return ctx.NoContent(http.StatusNoContent)
}
