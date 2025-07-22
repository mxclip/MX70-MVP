from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.types import DateTime
from .database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False)  # business_local or clipper
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    gigs = relationship("Gig", back_populates="business", foreign_keys="Gig.business_id")
    submissions = relationship("Submission", back_populates="clipper", foreign_keys="Submission.clipper_id")
    certifications = relationship("Certification", back_populates="clipper")
    credits = relationship("Credit", back_populates="user")
    self_promos = relationship("SelfPromo", back_populates="business")

class Gig(Base):
    __tablename__ = "gigs"
    
    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    budget = Column(Float, nullable=False)  # minimum $50
    goals = Column(String, nullable=False)  # "1k views", "100 likes", "10 check-ins", "10% sales lift"
    story_type = Column(String, nullable=False)  # "morning rush", "lunch specials", "closing", "unboxing", "try-on", "demo"
    raw_footage_url = Column(String)  # S3 URL for uploaded raw footage
    status = Column(String, default="pending")  # pending/claimed/completed
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    business = relationship("User", back_populates="gigs", foreign_keys=[business_id])
    submissions = relationship("Submission", back_populates="gig")

class Submission(Base):
    __tablename__ = "submissions"
    
    id = Column(Integer, primary_key=True, index=True)
    gig_id = Column(Integer, ForeignKey("gigs.id"), nullable=False)
    clipper_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    edited_video_url = Column(String)
    social_post_link = Column(String)
    views = Column(Integer, default=0)
    likes = Column(Integer, default=0)
    outcomes = Column(Integer, default=0)  # e.g., check-ins
    bonus = Column(Float, default=0.0)
    approved = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    gig = relationship("Gig", back_populates="submissions")
    clipper = relationship("User", back_populates="submissions", foreign_keys=[clipper_id])

class Lesson(Base):
    __tablename__ = "lessons"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)  # e.g., "Compelling Content"
    content = Column(Text)  # text/video url
    quiz = Column(JSON)  # questions in JSON format
    created_at = Column(DateTime, server_default=func.now())

class Certification(Base):
    __tablename__ = "certifications"
    
    id = Column(Integer, primary_key=True, index=True)
    clipper_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    level = Column(String, nullable=False)  # basic/pro
    completed = Column(Boolean, default=False)
    completed_at = Column(DateTime)
    
    # Relationships
    clipper = relationship("User", back_populates="certifications")

class Credit(Base):
    __tablename__ = "credits"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount = Column(Float, nullable=False)
    source = Column(String, nullable=False)  # self-promo/gig_post
    expiry = Column(DateTime, nullable=False)  # +6 months from creation
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="credits")

class SelfPromo(Base):
    __tablename__ = "self_promos"
    
    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    post_link = Column(String, nullable=False)
    views = Column(Integer, default=0)
    likes = Column(Integer, default=0)
    credit_earned = Column(Float, default=0.0)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    business = relationship("User", back_populates="self_promos") 