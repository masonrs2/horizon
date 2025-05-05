package controller

import (
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"

	hmiddleware "horizon-backend/internal/middleware"
	"horizon-backend/internal/model"
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
	// Get user ID from context using the middleware helper
	userID := hmiddleware.GetUserIDFromContext(ctx)
	if !userID.Valid {
		return echo.NewHTTPError(http.StatusUnauthorized, "unauthorized: invalid user ID in context")
	}

	// Get pagination params
	limit := int32(20)
	offset := int32(0)
	if limitStr := ctx.QueryParam("limit"); limitStr != "" {
		if l, err := strconv.ParseInt(limitStr, 10, 32); err == nil {
			limit = int32(l)
		} else {
			return echo.NewHTTPError(http.StatusBadRequest, fmt.Sprintf("invalid limit parameter: %v", err))
		}
	}
	if offsetStr := ctx.QueryParam("offset"); offsetStr != "" {
		if o, err := strconv.ParseInt(offsetStr, 10, 32); err == nil {
			offset = int32(o)
		} else {
			return echo.NewHTTPError(http.StatusBadRequest, fmt.Sprintf("invalid offset parameter: %v", err))
		}
	}

	// Get notifications
	notifications, err := c.notificationService.GetNotifications(ctx.Request().Context(), userID.Bytes, limit, offset)
	if err != nil {
		// Log the detailed error
		log.Printf("Error getting notifications: %v", err)

		// Check for specific error types and return appropriate status codes
		if strings.Contains(err.Error(), "invalid notification ID") ||
			strings.Contains(err.Error(), "invalid user ID") ||
			strings.Contains(err.Error(), "invalid actor ID") {
			return echo.NewHTTPError(http.StatusInternalServerError, fmt.Sprintf("data integrity error: %v", err))
		}

		return echo.NewHTTPError(http.StatusInternalServerError, fmt.Sprintf("failed to get notifications: %v", err))
	}

	// Always return a JSON array, even if empty
	if notifications == nil {
		notifications = []*model.Notification{}
	}

	return ctx.JSON(http.StatusOK, notifications)
}

// GetUnreadCount handles GET /api/notifications/unread-count
func (c *NotificationController) GetUnreadCount(ctx echo.Context) error {
	// Get user ID from context using the middleware helper
	userID := hmiddleware.GetUserIDFromContext(ctx)
	if !userID.Valid {
		return echo.NewHTTPError(http.StatusUnauthorized, "unauthorized")
	}

	// Get unread count
	count, err := c.notificationService.GetUnreadCount(ctx.Request().Context(), userID.Bytes)
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
	// Get user ID from context using the middleware helper
	userID := hmiddleware.GetUserIDFromContext(ctx)
	if !userID.Valid {
		return echo.NewHTTPError(http.StatusUnauthorized, "unauthorized")
	}

	// Mark all as read
	err := c.notificationService.MarkAllAsRead(ctx.Request().Context(), userID.Bytes)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to mark all notifications as read")
	}

	return ctx.NoContent(http.StatusNoContent)
}
