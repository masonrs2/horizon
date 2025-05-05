package middleware

import (
	"horizon-backend/internal/auth"
	"horizon-backend/internal/model"
	"net/http"
	"strings"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/labstack/echo/v4"
)

// AuthMiddleware creates a middleware that validates the JWT token
func AuthMiddleware(authProvider auth.AuthProvider) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			// Skip auth for public endpoints
			if isPublicEndpoint(c.Request().URL.Path) {
				return next(c)
			}

			// Get token from header
			authHeader := c.Request().Header.Get("Authorization")
			if authHeader == "" {
				return echo.NewHTTPError(http.StatusUnauthorized, "missing authorization header")
			}

			// Extract token from "Bearer <token>"
			authParts := strings.Split(authHeader, " ")
			if len(authParts) != 2 || authParts[0] != "Bearer" {
				return echo.NewHTTPError(http.StatusUnauthorized, "invalid authorization header format")
			}
			tokenString := authParts[1]

			// Verify token
			userID, err := authProvider.VerifyToken(c.Request().Context(), tokenString)
			if err != nil {
				return echo.NewHTTPError(http.StatusUnauthorized, "invalid token")
			}

			// Get user from token
			user, err := authProvider.GetUserFromToken(c.Request().Context(), tokenString)
			if err != nil {
				return echo.NewHTTPError(http.StatusUnauthorized, "invalid token")
			}

			// Set user info in context
			c.Set("user", user)
			c.Set("user_id", userID)

			return next(c)
		}
	}
}

// isPublicEndpoint checks if an endpoint is public (doesn't require authentication)
func isPublicEndpoint(path string) bool {
	// Define public endpoints
	publicEndpoints := []string{
		"/health",
		"/api/auth/login",
		"/api/auth/register",
		"/api/auth/refresh",
		"/api/auth/providers",
	}

	// Check if path is in the public endpoints list
	for _, endpoint := range publicEndpoints {
		if strings.HasPrefix(path, endpoint) {
			return true
		}
	}

	return false
}

// GetUserFromContext gets the user from the context
func GetUserFromContext(c echo.Context) *model.User {
	if user, ok := c.Get("user").(*model.User); ok {
		return user
	}
	return nil
}

// GetUserIDFromContext gets the user ID from the context
func GetUserIDFromContext(c echo.Context) pgtype.UUID {
	if userID, ok := c.Get("user_id").(pgtype.UUID); ok {
		return userID
	}
	return pgtype.UUID{}
}

// RequireAuth middleware ensures that requests are authenticated
func RequireAuth(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		userID := c.Get("user_id")
		if userID == nil {
			return echo.NewHTTPError(http.StatusUnauthorized, "unauthorized")
		}
		return next(c)
	}
}
