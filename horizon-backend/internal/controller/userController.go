package controller

import (
	"horizon-backend/internal/model"
	"horizon-backend/internal/service"
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
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request format")
	}

	user := &model.User{
		Username:    request.Username,
		Email:       request.Email,
		Password:    request.Password,
		DisplayName: pgtype.Text{String: request.DisplayName, Valid: request.DisplayName != ""},
	}

	createdUser, err := c.service.CreateUser(ctx.Request().Context(), user)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return ctx.JSON(http.StatusCreated, createdUser)
}

func (c* UserController) GetUserByUsername(ctx echo.Context) error {
	username := ctx.Param("username")

	user, err := c.service.GetUserByUsername(ctx.Request().Context(), username)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return ctx.JSON(http.StatusOK, user)
}
