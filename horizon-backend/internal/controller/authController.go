package controller

import (
	"encoding/hex"
	"horizon-backend/internal/auth"
	"horizon-backend/internal/middleware"
	"horizon-backend/internal/service"
	"horizon-backend/internal/validation"
	"net/http"

	"github.com/labstack/echo/v4"
)

// AuthController handles authentication-related requests
type AuthController struct {
	authProvider auth.AuthProvider
	userService  *service.UserService
}

// NewAuthController creates a new auth controller
func NewAuthController(authProvider auth.AuthProvider, userService *service.UserService) *AuthController {
	return &AuthController{
		authProvider: authProvider,
		userService:  userService,
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
		return echo.NewHTTPError(http.StatusBadRequest, map[string]interface{}{
			"message": "Invalid request format",
			"errors":  []string{"Request format is invalid"},
		})
	}

	// Validate request with specific error messages
	var errors []string
	if req.Username == "" {
		errors = append(errors, "Username is required")
	}
	if req.Password == "" {
		errors = append(errors, "Password is required")
	}

	if len(errors) > 0 {
		return echo.NewHTTPError(http.StatusBadRequest, map[string]interface{}{
			"message": "Validation failed",
			"errors":  errors,
		})
	}

	// Authenticate user
	accessToken, refreshToken, err := c.authProvider.Login(ctx.Request().Context(), req.Username, req.Password)
	if err != nil {
		// Return appropriate error
		switch err {
		case auth.ErrUserNotFound:
			return echo.NewHTTPError(http.StatusUnauthorized, map[string]interface{}{
				"message": "Authentication failed",
				"errors":  []string{"User not found"},
			})
		case auth.ErrInvalidPassword:
			return echo.NewHTTPError(http.StatusUnauthorized, map[string]interface{}{
				"message": "Authentication failed",
				"errors":  []string{"Invalid password"},
			})
		default:
			return echo.NewHTTPError(http.StatusInternalServerError, map[string]interface{}{
				"message": "Authentication failed",
				"errors":  []string{"An unexpected error occurred"},
			})
		}
	}

	// Get user from token to include in response
	user, err := c.authProvider.GetUserFromToken(ctx.Request().Context(), accessToken)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, map[string]interface{}{
			"message": "Error getting user information",
			"errors":  []string{"Failed to retrieve user information"},
		})
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
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid request format")
	}

	// Validate each field individually and collect errors
	var errors []string

	if req.Username == "" {
		errors = append(errors, "Username is required")
	} else if len(req.Username) < 3 {
		errors = append(errors, "Username must be at least 3 characters long")
	} else if len(req.Username) > 30 {
		errors = append(errors, "Username cannot exceed 30 characters")
	}

	if req.Email == "" {
		errors = append(errors, "Email is required")
	} else if !validation.IsValidEmail(req.Email) {
		errors = append(errors, "Invalid email format")
	}

	if req.Password == "" {
		errors = append(errors, "Password is required")
	} else if len(req.Password) < 8 {
		errors = append(errors, "Password must be at least 8 characters long")
	}

	if req.DisplayName == "" {
		errors = append(errors, "Display name is required")
	} else if len(req.DisplayName) < 2 {
		errors = append(errors, "Display name must be at least 2 characters long")
	} else if len(req.DisplayName) > 50 {
		errors = append(errors, "Display name cannot exceed 50 characters")
	}

	if len(errors) > 0 {
		return echo.NewHTTPError(http.StatusBadRequest, map[string]interface{}{
			"message": "Validation failed",
			"errors":  errors,
		})
	}

	// Register user
	user, err := c.authProvider.Register(ctx.Request().Context(), req.Username, req.Email, req.Password, req.DisplayName)
	if err != nil {
		// Handle specific registration errors
		switch {
		case err.Error() == "username already exists":
			return echo.NewHTTPError(http.StatusConflict, map[string]interface{}{
				"message": "Registration failed",
				"errors":  []string{"Username is already taken"},
			})
		case err.Error() == "email already exists":
			return echo.NewHTTPError(http.StatusConflict, map[string]interface{}{
				"message": "Registration failed",
				"errors":  []string{"Email is already registered"},
			})
		default:
			return echo.NewHTTPError(http.StatusBadRequest, map[string]interface{}{
				"message": "Registration failed",
				"errors":  []string{err.Error()},
			})
		}
	}

	// Login the newly registered user
	accessToken, refreshToken, err := c.authProvider.Login(ctx.Request().Context(), req.Username, req.Password)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, map[string]interface{}{
			"message": "Registration successful but login failed",
			"errors":  []string{"Unable to log in after registration"},
		})
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

// GetMe returns the current user's information
func (c *AuthController) GetMe(ctx echo.Context) error {
	// Get user ID from context
	userID := middleware.GetUserIDFromContext(ctx)
	if !userID.Valid {
		return echo.NewHTTPError(http.StatusUnauthorized, "Unauthorized")
	}

	// Get user from user service
	user, err := c.userService.GetUserByID(ctx.Request().Context(), userID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to get user information")
	}

	return ctx.JSON(http.StatusOK, user)
}
