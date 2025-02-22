package handler

import (
	"net/http"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"
)

// HealthHandler manages health check operations
type HealthHandler struct {
	pool *pgxpool.Pool // Database connection pool
}

// NewHealthHandler creates a new health handler instance
func NewHealthHandler(pool *pgxpool.Pool) *HealthHandler {
	return &HealthHandler{pool: pool}
}

// Check performs database connectivity verification
func (h *HealthHandler) Check(c echo.Context) error {
	var dbTime time.Time

	// Execute query to verify DB connection
	err := h.pool.QueryRow(c.Request().Context(), "SELECT NOW()").Scan(&dbTime)
	if err != nil {
		// Return 500 if database connection fails
		return echo.NewHTTPError(
			http.StatusInternalServerError,
			"Database connection failed: "+err.Error(),
		)
	}

	// Return success response with current DB time
	return c.JSON(http.StatusOK, map[string]interface{}{
		"status":  "ok",                        // Service status
		"db_time": dbTime.Format(time.RFC3339), // Format time as string
	})
}
