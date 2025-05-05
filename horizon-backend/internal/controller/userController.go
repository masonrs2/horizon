package controller

import (
	"horizon-backend/internal/middleware"
	"horizon-backend/internal/model"
	"horizon-backend/internal/service"
	"horizon-backend/internal/validation"
	"net/http"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/labstack/echo/v4"
)

type UserController struct {
	service   *service.UserService
	s3Service *service.S3Service
}

func NewUserController(service *service.UserService, s3Service *service.S3Service) *UserController {
	return &UserController{
		service:   service,
		s3Service: s3Service,
	}
}

func (c *UserController) CreateUser(ctx echo.Context) error {
	var request struct {
		Username    string `json:"username"`
		Email       string `json:"email"`
		Password    string `json:"password"`
		DisplayName string `json:"display_name"`
	}

	if err := ctx.Bind(&request); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, map[string]interface{}{
			"message": "Invalid request format",
			"errors":  []string{"Request format is invalid"},
		})
	}

	// Validate each field individually and collect errors
	var errors []string

	if request.Username == "" {
		errors = append(errors, "Username is required")
	} else if len(request.Username) < 3 {
		errors = append(errors, "Username must be at least 3 characters long")
	} else if len(request.Username) > 30 {
		errors = append(errors, "Username cannot exceed 30 characters")
	}

	if request.Email == "" {
		errors = append(errors, "Email is required")
	} else if !validation.IsValidEmail(request.Email) {
		errors = append(errors, "Invalid email format")
	}

	if request.Password == "" {
		errors = append(errors, "Password is required")
	} else if len(request.Password) < 8 {
		errors = append(errors, "Password must be at least 8 characters long")
	}

	if request.DisplayName == "" {
		errors = append(errors, "Display name is required")
	} else if len(request.DisplayName) < 2 {
		errors = append(errors, "Display name must be at least 2 characters long")
	} else if len(request.DisplayName) > 50 {
		errors = append(errors, "Display name cannot exceed 50 characters")
	}

	if len(errors) > 0 {
		return echo.NewHTTPError(http.StatusBadRequest, map[string]interface{}{
			"message": "Validation failed",
			"errors":  errors,
		})
	}

	user := &model.User{
		Username:    request.Username,
		Email:       request.Email,
		Password:    request.Password,
		DisplayName: pgtype.Text{String: request.DisplayName, Valid: request.DisplayName != ""},
	}

	createdUser, err := c.service.RegisterUser(ctx.Request().Context(), user)
	if err != nil {
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
			return echo.NewHTTPError(http.StatusInternalServerError, map[string]interface{}{
				"message": "Registration failed",
				"errors":  []string{err.Error()},
			})
		}
	}

	return ctx.JSON(http.StatusCreated, createdUser)
}

func (c *UserController) GetUserByUsername(ctx echo.Context) error {
	username := ctx.Param("username")

	user, err := c.service.GetUserByUsername(ctx.Request().Context(), username)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return ctx.JSON(http.StatusOK, user)
}

// UpdateUser handles updating a user's profile
func (c *UserController) UpdateUser(ctx echo.Context) error {
	// Get user ID from path parameter
	userID := ctx.Param("id")
	if userID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "user ID is required")
	}

	// Get current user from context
	currentUserID := middleware.GetUserIDFromContext(ctx)
	if !currentUserID.Valid {
		return echo.NewHTTPError(http.StatusUnauthorized, "unauthorized")
	}

	// Convert current user ID to string for comparison
	currentUserIDStr := uuid.UUID(currentUserID.Bytes).String()

	// Check if user is updating their own profile
	if userID != currentUserIDStr {
		return echo.NewHTTPError(http.StatusForbidden, "you can only update your own profile")
	}

	// Parse request body
	var request struct {
		DisplayName string `json:"display_name"`
		Bio         string `json:"bio"`
		Location    string `json:"location"`
		Website     string `json:"website"`
	}

	if err := ctx.Bind(&request); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request format")
	}

	// Validate fields
	if len(request.DisplayName) > 50 {
		return echo.NewHTTPError(http.StatusBadRequest, "display name cannot exceed 50 characters")
	}
	if len(request.Bio) > 160 {
		return echo.NewHTTPError(http.StatusBadRequest, "bio cannot exceed 160 characters")
	}
	if len(request.Location) > 30 {
		return echo.NewHTTPError(http.StatusBadRequest, "location cannot exceed 30 characters")
	}
	if len(request.Website) > 100 {
		return echo.NewHTTPError(http.StatusBadRequest, "website cannot exceed 100 characters")
	}

	// Update user
	updatedUser, err := c.service.UpdateUser(ctx.Request().Context(), currentUserID.Bytes, request.DisplayName, request.Bio, request.Location, request.Website)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to update user")
	}

	return ctx.JSON(http.StatusOK, updatedUser)
}

// UpdateUserAvatar handles updating a user's avatar
func (c *UserController) UpdateUserAvatar(ctx echo.Context) error {
	// Get user ID from path parameter
	userID := ctx.Param("id")
	if userID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "user ID is required")
	}

	// Get current user from context
	currentUserID := middleware.GetUserIDFromContext(ctx)
	if !currentUserID.Valid {
		return echo.NewHTTPError(http.StatusUnauthorized, "unauthorized")
	}

	// Convert current user ID to string for comparison
	currentUserIDStr := uuid.UUID(currentUserID.Bytes).String()

	// Check if user is updating their own profile
	if userID != currentUserIDStr {
		return echo.NewHTTPError(http.StatusForbidden, "you can only update your own avatar")
	}

	// Get the file from the request
	file, err := ctx.FormFile("avatar")
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "avatar file is required")
	}

	// Validate file size (max 5MB)
	if file.Size > 5*1024*1024 {
		return echo.NewHTTPError(http.StatusBadRequest, "file size cannot exceed 5MB")
	}

	// Validate file type
	contentType := file.Header.Get("Content-Type")
	if !isValidImageType(contentType) {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid file type. Only JPEG and PNG are allowed")
	}

	// Open the file
	src, err := file.Open()
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to read file")
	}
	defer src.Close()

	// Upload to S3
	s3URL, err := c.s3Service.UploadFile(ctx.Request().Context(), src, file.Filename, contentType)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to upload file")
	}

	// Update user's avatar URL in database
	updatedUser, err := c.service.UpdateUserAvatar(ctx.Request().Context(), currentUserID.Bytes, s3URL)
	if err != nil {
		// Try to clean up the uploaded file if database update fails
		_ = c.s3Service.DeleteFile(ctx.Request().Context(), s3URL)
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to update user")
	}

	return ctx.JSON(http.StatusOK, updatedUser)
}

// isValidImageType checks if the content type is a valid image type
func isValidImageType(contentType string) bool {
	validTypes := map[string]bool{
		"image/jpeg": true,
		"image/png":  true,
	}
	return validTypes[contentType]
}
