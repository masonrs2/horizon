package main

import (
	"horizon-backend/internal/controller"
	"horizon-backend/internal/db"
	"horizon-backend/internal/repository"
	"horizon-backend/internal/service"

	"horizon-backend/config"

	"github.com/joho/godotenv"
	"github.com/labstack/echo/v4"
)

func main() {
	// Load environment variables first
	if err := godotenv.Load(); err != nil {
		panic("Error loading .env file")
	}

	// Initialize Echo web framework
	e := echo.New()

	// Load configuration first
	cfg := config.Load()

	// Create database connection pool
	pool, err := db.NewPool(cfg)
	if err != nil {
		e.Logger.Fatal("Failed to create database pool: ", err)
	}

	// Initialize layers
	queries := db.New(pool)
	healthRepo := repository.NewHealthRepository(queries)
	healthService := service.NewHealthService(healthRepo)
	healthController := controller.NewHealthController(healthService)

	userRepo := repository.NewUserRepository(queries)
	userService := service.NewUserService(userRepo)
	userController := controller.NewUserController(userService)

	// Register routes with controller
	e.GET("/health", healthController.Check)
	e.POST("/user", userController.CreateUser)
	e.GET("/user/:username", userController.GetUserByUsername)

	// Start server on port 8080
	e.Logger.Fatal(e.Start(":8080"))
}
