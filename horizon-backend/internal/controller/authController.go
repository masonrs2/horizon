package controller

import (
	"encoding/hex"
	"horizon-backend/internal/auth"
	"horizon-backend/internal/middleware"
	"net/http"

	"github.com/labstack/echo/v4"
)

// AuthController handles authentication-related requests
type AuthController struct {
	authProvider auth.AuthProvider
}

// NewAuthController creates a new auth controller
func NewAuthController(authProvider auth.AuthProvider) *AuthController {
	return &AuthController{
		authProvider: authProvider,
	}
}

// LoginRequest represents login credentials
type LoginRequest struct {
	Username string `json:"username" validate:"required"`
	Password string `json:"password" validate:"required"`
}

// RegisterRequest represents registration data
type RegisterRequest struct {
	Username    string `json:"username" validate:"required,min=3,max=30"`
	Email       string `json:"email" validate:"required,email"`
	Password    string `json:"password" validate:"required,min=8"`
	DisplayName string `json:"display_name" validate:"required"`
}

// TokenResponse represents the response for authentication endpoints
type TokenResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	UserID       string `json:"user_id,omitempty"`
	Username     string `json:"username,omitempty"`
	Email        string `json:"email,omitempty"`
	DisplayName  string `json:"display_name,omitempty"`
	Message      string `json:"message,omitempty"`
	IsNewUser    bool   `json:"is_new_user,omitempty"`
}

// Login authenticates a user and returns a token
func (c *AuthController) Login(ctx echo.Context) error {
	// Parse request
	req := new(LoginRequest)
	if err := ctx.Bind(req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request")
	}

	// Validate request
	if req.Username == "" || req.Password == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "username and password are required")
	}

	// Authenticate user
	accessToken, refreshToken, err := c.authProvider.Login(ctx.Request().Context(), req.Username, req.Password)
	if err != nil {
		// Return appropriate error
		switch err {
		case auth.ErrUserNotFound, auth.ErrInvalidPassword:
			return echo.NewHTTPError(http.StatusUnauthorized, "invalid username or password")
		default:
			return echo.NewHTTPError(http.StatusInternalServerError, "authentication failed")
		}
	}

	// Get user from token to include in response
	user, err := c.authProvider.GetUserFromToken(ctx.Request().Context(), accessToken)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "error getting user information")
	}

	// Format UUID as string
	userIDStr := hex.EncodeToString(user.ID.Bytes[:])

	// Return token and user info
	return ctx.JSON(http.StatusOK, TokenResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		UserID:       userIDStr,
		Username:     user.Username,
		Email:        user.Email,
		DisplayName:  user.DisplayName.String,
	})
}

// Register creates a new user account
func (c *AuthController) Register(ctx echo.Context) error {
	// Parse request
	req := new(RegisterRequest)
	if err := ctx.Bind(req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request")
	}

	// Validate request
	if req.Username == "" || req.Email == "" || req.Password == "" || req.DisplayName == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "all fields are required")
	}

	// Register user
	user, err := c.authProvider.Register(ctx.Request().Context(), req.Username, req.Email, req.Password, req.DisplayName)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "registration failed: "+err.Error())
	}

	// Login the newly registered user
	accessToken, refreshToken, err := c.authProvider.Login(ctx.Request().Context(), req.Username, req.Password)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "registration successful but login failed")
	}

	// Format UUID as string
	userIDStr := hex.EncodeToString(user.ID.Bytes[:])

	// Return token and user info
	return ctx.JSON(http.StatusCreated, TokenResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		UserID:       userIDStr,
		Username:     user.Username,
		Email:        user.Email,
		DisplayName:  user.DisplayName.String,
		IsNewUser:    true,
	})
}

// RefreshToken refreshes an access token using a refresh token
func (c *AuthController) RefreshToken(ctx echo.Context) error {
	// Get refresh token from request
	type RefreshRequest struct {
		RefreshToken string `json:"refresh_token"`
	}
	req := new(RefreshRequest)
	if err := ctx.Bind(req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request")
	}

	// Validate request
	if req.RefreshToken == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "refresh token is required")
	}

	// Refresh token
	accessToken, refreshToken, err := c.authProvider.RefreshToken(ctx.Request().Context(), req.RefreshToken)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "invalid refresh token")
	}

	// Return new tokens
	return ctx.JSON(http.StatusOK, TokenResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	})
}

// GetMe gets the authenticated user's profile
func (c *AuthController) GetMe(ctx echo.Context) error {
	// Get user from context (set by auth middleware)
	user := middleware.GetUserFromContext(ctx)
	if user == nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "not authenticated")
	}

	// Format UUID as string
	userIDStr := hex.EncodeToString(user.ID.Bytes[:])

	// Return user info
	return ctx.JSON(http.StatusOK, map[string]interface{}{
		"id":           userIDStr,
		"username":     user.Username,
		"email":        user.Email,
		"display_name": user.DisplayName.String,
		"avatar_url":   user.AvatarUrl.String,
		"bio":          user.Bio.String,
		"is_private":   user.IsPrivate,
	})
}
