import boto3
import os

S3_ENDPOINT = os.getenv("S3_ENDPOINT", "http://localhost:9000")
S3_ACCESS_KEY = os.getenv("S3_ACCESS_KEY", "youraccesskey")
S3_SECRET_KEY = os.getenv("S3_SECRET_KEY", "yoursecretkey")
S3_BUCKET = os.getenv("S3_BUCKET", "deeptrack")

s3 = boto3.client(
    "s3",
    endpoint_url=S3_ENDPOINT,
    aws_access_key_id=S3_ACCESS_KEY,
    aws_secret_access_key=S3_SECRET_KEY,
)

def upload_to_s3(file_path, key):
    s3.upload_file(file_path, S3_BUCKET, key)

def get_s3_url(key):
    return f"{S3_ENDPOINT}/{S3_BUCKET}/{key}"
