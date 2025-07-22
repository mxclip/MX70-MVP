from fastapi import Request, HTTPException
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import redis
from .config import get_settings

settings = get_settings()

# Initialize Redis for rate limiting
try:
    redis_client = redis.from_url(settings.redis_url)
    redis_client.ping()  # Test connection
except:
    # Fallback to in-memory for development
    redis_client = None

limiter = Limiter(
    key_func=get_remote_address,
    storage_uri=settings.redis_url if redis_client else "memory://",
    default_limits=["100/minute"]
)

def setup_rate_limiting(app):
    """Setup rate limiting for the FastAPI app"""
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler) 