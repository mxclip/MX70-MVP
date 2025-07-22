import boto3
import uuid
import magic
from typing import Optional
from fastapi import HTTPException, UploadFile
from PIL import Image
import io
import os
from ..config import get_settings

settings = get_settings()

# Initialize S3 client
s3_client = boto3.client(
    's3',
    aws_access_key_id=settings.aws_access_key_id,
    aws_secret_access_key=settings.aws_secret_access_key,
    region_name=settings.aws_region
)

async def upload_video_to_s3(file: UploadFile, folder: str = "videos") -> str:
    """Upload video file to S3 and return the URL"""
    
    # Validate file size
    contents = await file.read()
    if len(contents) > settings.max_file_size:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is {settings.max_file_size / 1024 / 1024:.0f}MB"
        )
    
    # Validate file type
    file_type = magic.from_buffer(contents, mime=True)
    if file_type not in settings.allowed_video_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed types: {', '.join(settings.allowed_video_types)}"
        )
    
    # Generate unique filename
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{folder}/{uuid.uuid4()}{file_extension}"
    
    try:
        # Upload to S3
        s3_client.put_object(
            Bucket=settings.s3_bucket_name,
            Key=unique_filename,
            Body=contents,
            ContentType=file_type,
            Metadata={
                'original-filename': file.filename,
                'uploaded-by': 'mx70-platform'
            }
        )
        
        # Return S3 URL
        return f"https://{settings.s3_bucket_name}.s3.{settings.aws_region}.amazonaws.com/{unique_filename}"
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload file: {str(e)}"
        )

async def generate_video_thumbnail(video_url: str) -> Optional[str]:
    """Generate thumbnail for video (stub for MVP)"""
    # In production, this would use FFmpeg or similar to extract a frame
    # For MVP, we'll return a placeholder
    return f"{video_url}_thumbnail.jpg"

def delete_file_from_s3(file_url: str) -> bool:
    """Delete file from S3"""
    try:
        # Extract key from URL
        key = file_url.split(f"{settings.s3_bucket_name}.s3.{settings.aws_region}.amazonaws.com/")[1]
        
        s3_client.delete_object(
            Bucket=settings.s3_bucket_name,
            Key=key
        )
        return True
    except Exception:
        return False 