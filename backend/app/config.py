import os
from functools import lru_cache
from pydantic import BaseSettings

class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql://postgres:password@localhost/mx70_db"
    
    # Security
    secret_key: str = "your-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # AWS S3
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    aws_region: str = "us-east-1"
    s3_bucket_name: str = "mx70-uploads"
    
    # Redis (for rate limiting)
    redis_url: str = "redis://localhost:6379"
    
    # Email (AWS SES)
    ses_region: str = "us-east-1"
    from_email: str = "noreply@mx70.com"
    
    # Stripe
    stripe_secret_key: str = "sk_test_placeholder"
    stripe_webhook_secret: str = "whsec_placeholder"
    
    # File Upload Limits
    max_file_size: int = 50 * 1024 * 1024  # 50MB
    allowed_video_types: list = ["video/mp4", "video/quicktime", "video/x-msvideo"]
    
    # Platform Settings
    minimum_gig_budget: float = 50.0
    gig_post_credit: float = 5.0
    self_promo_credit: float = 10.0
    monthly_self_promo_cap: float = 15.0
    credit_expiry_months: int = 6
    
    class Config:
        env_file = ".env"

@lru_cache()
def get_settings():
    return Settings() 