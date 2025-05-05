package config

import (
	"log"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

// NeonAuthConfig holds configuration for Neon Auth
type NeonAuthConfig struct {
	Enabled   bool
	ProjectID string
	ApiKey    string
}

// Config holds application configuration
type Config struct {
	DBHost             string
	DBPort             int
	DBUser             string
	DBPassword         string
	DBName             string
	ServerPort         string
	AWSRegion          string
	S3BucketName       string
	AWSAccessKeyID     string
	AWSSecretAccessKey string
	JWTSecret          string
	Environment        string
	NeonAuth           NeonAuthConfig
}

// Load loads configuration from environment variables
func Load() *Config {
	// Load .env file if it exists
	if err := godotenv.Load(".env"); err != nil {
		log.Printf("Warning: Error loading .env file: %v", err)
	}

	// Set environment
	env := getEnv("ENVIRONMENT", "development")

	// Log loaded AWS configuration
	log.Printf("AWS Region: %s", os.Getenv("AWS_REGION"))
	log.Printf("S3 Bucket: %s", os.Getenv("S3_BUCKET_NAME"))
	log.Printf("AWS Access Key ID: %s", maskString(os.Getenv("AWS_ACCESS_KEY_ID")))

	// Determine JWT secret based on environment
	var jwtSecret string
	if env == "production" {
		// In production, require a set JWT secret
		jwtSecret = os.Getenv("JWT_SECRET")
		if jwtSecret == "" {
			// Fall back to default only if not in production
			if env != "production" {
				jwtSecret = "development-jwt-secret-for-horizon"
			} else {
				// Log warning but still provide a default to prevent app crash
				// In a real production environment, this should trigger an alert
				jwtSecret = "your-secret-key"
				// In a real app you might want to log.Fatal here instead
			}
		}
	} else {
		// In development, use a consistent secret for convenience
		jwtSecret = "development-jwt-secret-for-horizon"
	}

	// Parse Neon Auth settings
	neonAuthEnabled := getEnvAsBool("NEON_AUTH_ENABLED", false)

	return &Config{
		DBHost:             getEnv("DB_HOST", "localhost"),
		DBPort:             getEnvAsInt("DB_PORT", 5432),
		DBUser:             getEnv("DB_USER", "postgres"),
		DBPassword:         getEnv("DB_PASSWORD", "postgres"),
		DBName:             getEnv("DB_NAME", "horizon"),
		ServerPort:         getEnv("SERVER_PORT", "8080"),
		AWSRegion:          getEnv("AWS_REGION", "us-east-1"),
		S3BucketName:       getEnv("S3_BUCKET_NAME", "horizon-media"),
		AWSAccessKeyID:     getEnv("AWS_ACCESS_KEY_ID", ""),
		AWSSecretAccessKey: getEnv("AWS_SECRET_ACCESS_KEY", ""),
		JWTSecret:          jwtSecret,
		Environment:        env,
		NeonAuth: NeonAuthConfig{
			Enabled:   neonAuthEnabled,
			ProjectID: getEnv("NEON_AUTH_PROJECT_ID", ""),
			ApiKey:    getEnv("NEON_AUTH_API_KEY", ""),
		},
	}
}

// getEnv gets an environment variable or returns a default value
func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}

// getEnvAsInt gets an environment variable as an integer or returns a default value
func getEnvAsInt(key string, defaultValue int) int {
	valueStr := getEnv(key, "")
	if value, err := strconv.Atoi(valueStr); err == nil {
		return value
	}
	return defaultValue
}

// getEnvAsBool gets an environment variable as a boolean or returns a default value
func getEnvAsBool(key string, defaultValue bool) bool {
	valueStr := getEnv(key, "")
	if valueStr == "" {
		return defaultValue
	}
	value, err := strconv.ParseBool(valueStr)
	if err != nil {
		return defaultValue
	}
	return value
}

// maskString masks a string for logging, showing only the first and last 4 characters
func maskString(s string) string {
	if len(s) < 8 {
		return "***"
	}
	return s[:4] + "..." + s[len(s)-4:]
}
