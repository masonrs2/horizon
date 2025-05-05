resource "aws_s3_bucket" "horizon_media" {
    for_each = toset(["dev", "prod"])

    bucket = "${var.bucket_name}-${each.value}"
    lifecycle {
      prevent_destroy = true
    }

    tags = {
      Name = "${var.bucket_name}-${each.value}"
    }
}

# Enable public access to objects
resource "aws_s3_bucket_public_access_block" "horizon_media" {
    for_each = toset(["dev", "prod"])
    
    bucket = aws_s3_bucket.horizon_media[each.key].id

    block_public_acls       = false
    block_public_policy     = false
    ignore_public_acls      = false
    restrict_public_buckets = false
}

# Bucket policy to allow public read access
resource "aws_s3_bucket_policy" "horizon_media" {
    for_each = toset(["dev", "prod"])
    
    bucket = aws_s3_bucket.horizon_media[each.key].id
    policy = jsonencode({
        Version = "2012-10-17"
        Statement = [
            {
                Sid = "PublicReadGetObject"
                Effect = "Allow"
                Principal = "*"
                Action = "s3:GetObject"
                Resource = "${aws_s3_bucket.horizon_media[each.key].arn}/*"
            }
        ]
    })

    # Wait for public access block to be configured first
    depends_on = [aws_s3_bucket_public_access_block.horizon_media]
}

# CORS configuration
resource "aws_s3_bucket_cors_configuration" "horizon_media" {
    for_each = toset(["dev", "prod"])
    
    bucket = aws_s3_bucket.horizon_media[each.key].id

    cors_rule {
        allowed_headers = ["*"]
        allowed_methods = ["GET", "PUT", "POST", "DELETE", "HEAD"]
        allowed_origins = ["*"]  # In production, you should restrict this to your domain
        expose_headers  = ["ETag"]
        max_age_seconds = 3000
    }
}