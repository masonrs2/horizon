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