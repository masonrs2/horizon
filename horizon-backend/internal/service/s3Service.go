package service

import (
	"context"
	"fmt"
	"io"
	"path/filepath"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

type S3Service struct {
	client     *s3.Client
	bucketName string
}

func NewS3Service(bucketName string, awsRegion string, awsAccessKeyID string, awsSecretAccessKey string) (*S3Service, error) {
	if bucketName == "" || awsRegion == "" || awsAccessKeyID == "" || awsSecretAccessKey == "" {
		return nil, fmt.Errorf("missing required AWS configuration")
	}

	// Create AWS credentials provider
	creds := credentials.NewStaticCredentialsProvider(awsAccessKeyID, awsSecretAccessKey, "")

	// Load AWS configuration with explicit credentials and region
	cfg, err := config.LoadDefaultConfig(context.Background(),
		config.WithCredentialsProvider(creds),
		config.WithRegion(awsRegion),
	)
	if err != nil {
		return nil, fmt.Errorf("unable to load SDK config: %v", err)
	}

	client := s3.NewFromConfig(cfg)

	return &S3Service{
		client:     client,
		bucketName: bucketName,
	}, nil
}

func (s *S3Service) UploadFile(ctx context.Context, file io.Reader, filename string, contentType string) (string, error) {
	// Generate a unique filename to avoid collisions
	ext := filepath.Ext(filename)
	uniqueFilename := fmt.Sprintf("%d%s", time.Now().UnixNano(), ext)

	// Create the input for the PutObject operation
	input := &s3.PutObjectInput{
		Bucket:      aws.String(s.bucketName),
		Key:         aws.String(uniqueFilename),
		Body:        file,
		ContentType: aws.String(contentType),
	}

	// Upload the file
	_, err := s.client.PutObject(ctx, input)
	if err != nil {
		return "", fmt.Errorf("failed to upload file: %v", err)
	}

	// Return the URL of the uploaded file
	return fmt.Sprintf("https://%s.s3.amazonaws.com/%s", s.bucketName, uniqueFilename), nil
}

func (s *S3Service) DeleteFile(ctx context.Context, fileURL string) error {
	// Extract the key from the URL
	parts := strings.Split(fileURL, "/")
	key := parts[len(parts)-1]

	// Create the input for the DeleteObject operation
	input := &s3.DeleteObjectInput{
		Bucket: aws.String(s.bucketName),
		Key:    aws.String(key),
	}

	// Delete the file
	_, err := s.client.DeleteObject(ctx, input)
	if err != nil {
		return fmt.Errorf("failed to delete file: %v", err)
	}

	return nil
}
