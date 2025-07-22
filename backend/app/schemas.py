from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime

# User schemas
class UserBase(BaseModel):
    email: EmailStr
    role: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Auth schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# Gig schemas
class GigBase(BaseModel):
    budget: float
    goals: str
    story_type: str
    raw_footage_url: Optional[str] = None

class GigCreate(GigBase):
    pass

class GigResponse(GigBase):
    id: int
    business_id: int
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True

# Submission schemas
class SubmissionBase(BaseModel):
    edited_video_url: Optional[str] = None
    social_post_link: Optional[str] = None

class SubmissionCreate(SubmissionBase):
    gig_id: int

class SubmissionUpdate(BaseModel):
    views: Optional[int] = None
    likes: Optional[int] = None
    outcomes: Optional[int] = None

class SubmissionResponse(SubmissionBase):
    id: int
    gig_id: int
    clipper_id: int
    views: int
    likes: int
    outcomes: int
    bonus: float
    approved: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Lesson schemas
class LessonBase(BaseModel):
    title: str
    content: str
    quiz: Dict[str, Any]

class LessonResponse(LessonBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Certification schemas
class CertificationResponse(BaseModel):
    id: int
    clipper_id: int
    level: str
    completed: bool
    completed_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Credit schemas
class CreditResponse(BaseModel):
    id: int
    user_id: int
    amount: float
    source: str
    created_at: datetime
    
    class Config:
        from_attributes = True

# Self promo schemas
class SelfPromoCreate(BaseModel):
    post_link: str

class SelfPromoResponse(BaseModel):
    id: int
    business_id: int
    post_link: str
    views: int
    likes: int
    credit_earned: float
    created_at: datetime
    
    class Config:
        from_attributes = True

# Dashboard schemas
class DashboardResponse(BaseModel):
    user: UserResponse
    gigs: List[GigResponse]
    submissions: List[SubmissionResponse]
    credits: List[CreditResponse]
    total_credits: float

# Payment schemas
class PaymentCreate(BaseModel):
    amount: float
    description: str

class PaymentResponse(BaseModel):
    id: str
    amount: float
    status: str 