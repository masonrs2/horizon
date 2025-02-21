package main

import (
	"horizon/internal/handler"

	"github.com/labstack/echo/v4"
)

func main() {
	// Initialize Echo web framework
	e := echo.New()

	// Create database connection pool
	pool, err := NewPool()
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
