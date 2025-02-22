resource "aws_iam_user" "horizon_user" {
    name = "horizon-app-user"
}

resource "aws_iam_access_key" "app_key" {
    user = aws_iam_user.horizon_user.name
}

resource "aws_iam_user_policy" "s3_acecss" {
    name = "HorizonS3Access"
    user = aws_iam_user.horizon_user.name

    policy = jsonencode({
        Version = "2012-10-17"
        Statement = [{
            Effect = "Allow"
            Action = [
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject"
            ]
            Resource = [
                "${aws_s3_bucket.media["dev"].arn}/*",
                "${aws_s3_bucket.media["prod"].arn}/*"
            ]
        }]
    })
}