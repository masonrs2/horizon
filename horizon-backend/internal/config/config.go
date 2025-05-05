package config

import (
	"github.com/kelseyhightower/envconfig"
)

type Config struct {
	// Server configuration
	ServerPort string `envconfig:"SERVER_PORT" default:"8080"`

	// Database configuration
	DBHost     string `envconfig:"DB_HOST" required:"true"`
	DBPort     string `envconfig:"DB_PORT" default:"5432"`
	DBName     string `envconfig:"DB_NAME" required:"true"`
	DBUser     string `envconfig:"DB_USER" required:"true"`
	DBPassword string `envconfig:"DB_PASSWORD" required:"true"`

	// JWT configuration
	JWTSecret string `envconfig:"JWT_SECRET" required:"true"`

	// S3 configuration
	S3BucketName string `envconfig:"S3_BUCKET_NAME" default:"horizon-media-dev"`
}

// LoadConfig loads the configuration from environment variables
func LoadConfig() (*Config, error) {
	var cfg Config
	err := envconfig.Process("", &cfg)
	if err != nil {
		return nil, err
	}
	return &cfg, nil
}
