variable "environment" {
  description = "Deployment environment (dev/prod)"
  type        = string
  default     = "dev"
}

variable "bucket_name" {
  description = "S3 bucket name prefix"
  type        = string
  default     = "horizon-media"
}

variable "expiration_days" {
  description = "Days until object expiration in dev environment"
  type        = number
  default     = 7
}

variable "allowed_mime_types" {
  description = "Allowed file types for media uploads"
  type        = list(string)
  default     = ["image/jpeg", "image/png", "video/mp4"]
}

variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-east-2"
}

variable "aws_profile" {
  description = "AWS CLI profile name"
  type        = string
  default     = "default"
}