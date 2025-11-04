package storage

import (
	"context"
	"fmt"
	"io"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"

	"codehustle/backend/internal/config"
)

var minioClient *minio.Client

// InitMinIO initializes the MinIO client
func InitMinIO() error {
	endpoint := config.Get("MINIO_ENDPOINT")
	accessKey := config.Get("MINIO_ACCESS_KEY")
	secretKey := config.Get("MINIO_SECRET_KEY")
	secure := config.Get("MINIO_SECURE") == "true"

	client, err := minio.New(endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(accessKey, secretKey, ""),
		Secure: secure,
	})
	if err != nil {
		return fmt.Errorf("failed to initialize MinIO client: %w", err)
	}

	minioClient = client
	return nil
}

// GetMinIOClient returns the MinIO client instance
func GetMinIOClient() *minio.Client {
	return minioClient
}

// UploadFile uploads a file to MinIO and returns the object key
func UploadFile(bucketName string, objectKey string, file io.Reader, fileSize int64, contentType string) error {
	ctx := context.Background()

	// Ensure bucket exists
	exists, err := minioClient.BucketExists(ctx, bucketName)
	if err != nil {
		return fmt.Errorf("failed to check bucket existence: %w", err)
	}

	if !exists {
		err = minioClient.MakeBucket(ctx, bucketName, minio.MakeBucketOptions{})
		if err != nil {
			return fmt.Errorf("failed to create bucket: %w", err)
		}
	}

	// Upload file
	_, err = minioClient.PutObject(ctx, bucketName, objectKey, file, fileSize, minio.PutObjectOptions{
		ContentType: contentType,
	})
	if err != nil {
		return fmt.Errorf("failed to upload file: %w", err)
	}

	return nil
}

// GetFile retrieves file content from MinIO
func GetFile(bucketName string, objectKey string) ([]byte, error) {
	ctx := context.Background()

	obj, err := minioClient.GetObject(ctx, bucketName, objectKey, minio.GetObjectOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to get object: %w", err)
	}
	defer obj.Close()

	content, err := io.ReadAll(obj)
	if err != nil {
		return nil, fmt.Errorf("failed to read object: %w", err)
	}

	return content, nil
}

// GetProblemStatementsBucket returns the bucket name for problem statements
func GetProblemStatementsBucket() string {
	return config.Get("BUCKET_PROBLEM_STATEMENTS")
}
