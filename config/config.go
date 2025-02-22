package config

import (
	"os"
	"strconv"
)

type Config struct {
<<<<<<< HEAD:config/config.go
	DBHost     string
	DBPort     int
	DBUser     string
	DBPassword string
	DBName     string
	ServerPort string
=======
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
>>>>>>> 9e8674d (inital tf s3 setup):horizon-backend/config/config.go
}

func Load() *Config {
	return &Config{
<<<<<<< HEAD:config/config.go
		DBHost:     getEnv("DB_HOST", "localhost"),
		DBPort:     getEnvAsInt("DB_PORT", 5432),
		DBUser:     getEnv("DB_USER", "postgres"),
		DBPassword: getEnv("DB_PASSWORD", ""),
		DBName:     getEnv("DB_NAME", "horizon"),
		ServerPort: getEnv("SERVER_PORT", "8080"),
=======
		DBHost:             getEnv("DB_HOST", "localhost"),
		DBPort:             getEnvAsInt("DB_PORT", 5432),
		DBUser:             getEnv("DB_USER", "postgres"),
		DBPassword:         getEnv("DB_PASSWORD", ""),
		DBName:             getEnv("DB_NAME", "horizon"),
		ServerPort:         getEnv("SERVER_PORT", "8080"),
		AWSRegion:          getEnv("AWS_REGION", "us-east-2"),
		S3BucketName:       getEnv("S3_BUCKET", "horizon-media-dev"),
		AWSAccessKeyID:     getEnv("AWS_ACCESS_KEY_ID", ""),
		AWSSecretAccessKey: getEnv("AWS_SECRET_ACCESS_KEY", ""),
>>>>>>> 9e8674d (inital tf s3 setup):horizon-backend/config/config.go
	}
}

// Helper functions
func getEnv(key, defaultValue string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultValue
}

func getEnvAsInt(key string, defaultValue int) int {
	strValue := getEnv(key, "")
	if value, err := strconv.Atoi(strValue); err == nil {
		return value
	}
	return defaultValue
}
