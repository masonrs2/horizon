output "s3_bucket_arns" {
  value = {
    dev  = aws_s3_bucket.media["dev"].arn
    prod = aws_s3_bucket.media["prod"].arn
  }
}

output "iam_access_key" {
  value     = aws_iam_access_key.app_key.id
  sensitive = true
}

output "iam_secret_key" {
  value     = aws_iam_access_key.app_key.secret
  sensitive = true
} 