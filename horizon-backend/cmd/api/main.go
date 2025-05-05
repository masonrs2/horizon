package main

import (
	"context"
	"fmt"
	"horizon-backend/config"
	"horizon-backend/internal/auth"
	"horizon-backend/internal/controller"
	"horizon-backend/internal/db"
	"horizon-backend/internal/middleware"
	"horizon-backend/internal/service"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/labstack/echo/v4"
	echoMiddleware "github.com/labstack/echo/v4/middleware"
)

func main() {
	// Load configuration
	cfg := config.Load()

	// Initialize database connection
	dbPool, err := db.NewPool(cfg)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer dbPool.Close()

	// Initialize query client
	queries := db.New(dbPool)

	// Initialize services
	healthService := service.NewHealthService(queries)
	userService := service.NewUserService(queries)
	postService := service.NewPostService(queries, dbPool, userService)
	followService := service.NewFollowService(queries)

	// Initialize auth provider
	authProvider := auth.GetAuthProvider(queries, cfg)

	// Initialize controllers
	healthController := controller.NewHealthController(healthService)
	userController := controller.NewUserController(userService)
	postController := controller.NewPostController(postService, userService)
	followController := controller.NewFollowController(followService, userService)
	authController := controller.NewAuthController(authProvider, userService)

	// Initialize middleware
	authMiddleware := middleware.AuthMiddleware(authProvider)

	// Initialize Echo
	e := echo.New()

	// Middleware
	e.Use(echoMiddleware.Logger())
	e.Use(echoMiddleware.Recover())
	e.Use(echoMiddleware.CORS())

	// Routes
	e.GET("/health", healthController.Check)

	// Auth routes
	authGroup := e.Group("/api/auth")
	authGroup.POST("/login", authController.Login)
	authGroup.POST("/register", authController.Register)
	authGroup.POST("/refresh", authController.RefreshToken)
	authGroup.GET("/me", authController.GetMe, authMiddleware)

	// User routes
	userGroup := e.Group("/api/users")
	userGroup.GET("/:username", userController.GetUserByUsername, authMiddleware)
	userGroup.GET("/:username/posts", postController.GetUserPosts, authMiddleware)
	userGroup.GET("/:username/replies", postController.GetUserReplies, authMiddleware)
	userGroup.GET("/:username/likes", postController.GetUserLikedPosts, authMiddleware)
	userGroup.GET("/:username/followers", followController.GetFollowers, authMiddleware)
	userGroup.GET("/:username/following", followController.GetFollowing, authMiddleware)
	userGroup.GET("/:username/follow-status", followController.GetFollowStatus, authMiddleware)
	userGroup.POST("/:username/follow", followController.FollowUser, authMiddleware)
	userGroup.DELETE("/:username/follow", followController.UnfollowUser, authMiddleware)
	userGroup.POST("/:username/accept-follow", followController.AcceptFollowRequest, authMiddleware)

	// Post routes
	postGroup := e.Group("/api/posts")
	postGroup.GET("", postController.GetPosts, authMiddleware)
	postGroup.POST("", postController.CreatePost, authMiddleware)
	postGroup.GET("/:id", postController.GetPostByID, authMiddleware)
	postGroup.PUT("/:id", postController.UpdatePostContent, authMiddleware)
	postGroup.DELETE("/:id", postController.DeletePost, authMiddleware)
	postGroup.GET("/:id/replies", postController.GetPostReplies, authMiddleware)
	postGroup.POST("/:id/likes", postController.LikePost, authMiddleware)
	postGroup.DELETE("/:id/likes", postController.UnlikePost, authMiddleware)
	postGroup.GET("/:id/likes/status", postController.HasLiked, authMiddleware)

	// Start server
	serverAddr := fmt.Sprintf(":%s", cfg.ServerPort)
	go func() {
		if err := e.Start(serverAddr); err != nil && err != http.ErrServerClosed {
			e.Logger.Fatal("shutting down the server: %v", err)
		}
	}()

	// Log server start
	log.Printf("Server started on port %s", cfg.ServerPort)
	log.Printf("Environment: %s", cfg.Environment)
	if cfg.Environment == "production" && cfg.NeonAuth.Enabled {
		log.Printf("Using Neon Auth for authentication")
	} else {
		log.Printf("Using local JWT authentication")
	}

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down server...")

	// Wait for interrupt signal
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := e.Shutdown(ctx); err != nil {
		e.Logger.Fatal(err)
	}

	log.Println("Server gracefully stopped")
}
