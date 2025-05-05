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
	pool, err := db.NewPool(cfg)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer pool.Close()

	// Initialize query client
	queries := db.New(pool)

	// Initialize services
	healthService := service.NewHealthService(queries)
	userService := service.NewUserService(queries)
	notificationService := service.NewNotificationService(queries)
	postService := service.NewPostService(queries, pool, userService, notificationService)
	followService := service.NewFollowService(queries, notificationService)

	// Initialize auth provider
	authProvider := auth.NewLocalAuthProvider(queries, cfg)

	// Initialize S3 service
	s3Service, err := service.NewS3Service(
		cfg.S3BucketName,
		cfg.AWSRegion,
		cfg.AWSAccessKeyID,
		cfg.AWSSecretAccessKey,
	)
	if err != nil {
		log.Fatalf("Failed to initialize S3 service: %v", err)
	}

	// Initialize controllers
	healthController := controller.NewHealthController(healthService)
	userController := controller.NewUserController(userService, s3Service)
	postController := controller.NewPostController(postService, userService)
	followController := controller.NewFollowController(followService, userService)
	authController := controller.NewAuthController(authProvider, userService)
	notificationController := controller.NewNotificationController(notificationService)

	// Initialize middleware
	authMiddleware := middleware.AuthMiddleware(authProvider)

	// Initialize Echo
	e := echo.New()

	// Middleware
	e.Use(echoMiddleware.Logger())
	e.Use(echoMiddleware.Recover())
	e.Use(echoMiddleware.CORSWithConfig(echoMiddleware.CORSConfig{
		AllowOrigins: []string{"*"},
		AllowMethods: []string{http.MethodGet, http.MethodPut, http.MethodPost, http.MethodDelete, http.MethodOptions},
		AllowHeaders: []string{echo.HeaderOrigin, echo.HeaderContentType, echo.HeaderAccept, echo.HeaderAuthorization},
	}))

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
	userGroup.PUT("/:id", userController.UpdateUser, authMiddleware)
	userGroup.POST("/:id/avatar", userController.UpdateUserAvatar, authMiddleware)
	userGroup.GET("/:username/posts", postController.GetUserPosts, authMiddleware)
	userGroup.GET("/:username/replies", postController.GetUserReplies, authMiddleware)
	userGroup.GET("/:username/likes", postController.GetUserLikedPosts, authMiddleware)
	userGroup.GET("/:username/followers", followController.GetFollowers, authMiddleware)
	userGroup.GET("/:username/following", followController.GetFollowing, authMiddleware)
	userGroup.GET("/:username/follow-status", followController.GetFollowStatus, authMiddleware)
	userGroup.POST("/:username/follow", followController.FollowUser, authMiddleware)
	userGroup.DELETE("/:username/follow", followController.UnfollowUser, authMiddleware)
	userGroup.POST("/:username/accept-follow", followController.AcceptFollowRequest, authMiddleware)

	// Bookmark routes
	userGroup.GET("/me/bookmarks", postController.GetUserBookmarks, authMiddleware)
	userGroup.POST("/me/bookmarks/:postId", postController.BookmarkPost, authMiddleware)
	userGroup.DELETE("/me/bookmarks/:postId", postController.UnbookmarkPost, authMiddleware)

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

	// Notification routes
	notificationGroup := e.Group("/api/notifications")
	notificationGroup.GET("", notificationController.GetNotifications, authMiddleware)
	notificationGroup.GET("/unread-count", notificationController.GetUnreadCount, authMiddleware)
	notificationGroup.PUT("/:id/read", notificationController.MarkAsRead, authMiddleware)
	notificationGroup.PUT("/mark-all-read", notificationController.MarkAllAsRead, authMiddleware)

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
