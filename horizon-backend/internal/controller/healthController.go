package controller

import (
	"horizon-backend/internal/service"
	"net/http"

	"github.com/labstack/echo/v4"
)

// HealthController manages health check operations
type HealthController struct {
	service *service.HealthService
}

// NewHealthController creates a new health controller instance
func NewHealthController(service *service.HealthService) *HealthController {
	return &HealthController{service: service}
}

// Check performs database connectivity verification
func (c *HealthController) Check(ctx echo.Context) error {
	health, err := c.service.Check(ctx.Request().Context())
	if err != nil {
		// Return 500 if database connection fails
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	return ctx.JSON(http.StatusOK, health)
}
