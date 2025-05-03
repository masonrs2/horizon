package controller

import (
	"horizon-backend/internal/model"
	"horizon-backend/internal/service"
	"horizon-backend/internal/validation"
	"net/http"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/labstack/echo/v4"
)

type UserController struct {
	service *service.UserService
}

func NewUserController(service *service.UserService) *UserController {
	return &UserController{
		service: service,
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
