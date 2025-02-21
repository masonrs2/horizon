package main

import (
	"horizon-backend/internal/db"
	"horizon-backend/internal/handler"

	"github.com/labstack/echo/v4"
	"horizon-backend/config"
)

func main() {
	// Initialize Echo web framework
	e := echo.New()

	// Load configuration first
	cfg := config.Load()

	// Create database connection pool
	pool, err := db.NewPool(cfg)
	if err != nil {
		e.Logger.Fatal("Failed to create database pool: ", err)
	}

	// Initialize health check handler with DB pool
	healthHandler := handler.NewHealthHandler(pool)

	// Register health check endpoint
	e.GET("/health", healthHandler.Check)

	// Start server on port 8080
	e.Logger.Fatal(e.Start(":8080"))
}
