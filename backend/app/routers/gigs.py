from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta

from ..database import get_db
from ..models import User, Gig, Submission, Credit
from ..schemas import GigCreate, GigResponse, SubmissionCreate, SubmissionResponse, SubmissionUpdate
from ..auth import get_current_active_user, require_role
from ..services.file_upload import upload_video_to_s3
from ..services.email import send_gig_claimed_notification, send_video_submitted_notification
from ..config import get_settings

settings = get_settings()

router = APIRouter(prefix="/gigs", tags=["gigs"])

@router.post("/post-gig", response_model=GigResponse)
def post_gig(
    gig: GigCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("business_local"))
):
    """Post a new gig (business only)"""
    # Validate minimum budget
    if gig.budget < settings.minimum_gig_budget:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Minimum budget is ${settings.minimum_gig_budget}"
        )
    
    # Create the gig
    db_gig = Gig(
        business_id=current_user.id,
        budget=gig.budget,
        goals=gig.goals,
        story_type=gig.story_type,
        raw_footage_url=gig.raw_footage_url,
        status="pending"
    )
    db.add(db_gig)
    
    # Add gig posting credit ($5 per gig posted) with 6-month expiry
    credit_expiry = datetime.utcnow() + timedelta(days=30 * settings.credit_expiry_months)
    credit = Credit(
        user_id=current_user.id,
        amount=settings.gig_post_credit,
        source="gig_post",
        expiry=credit_expiry
    )
    db.add(credit)
    
    db.commit()
    db.refresh(db_gig)
    
    return db_gig

@router.post("/upload-raw-footage")
async def upload_raw_footage(
    file: UploadFile = File(...),
    current_user: User = Depends(require_role("business_local"))
):
    """Upload raw footage for a gig"""
    try:
        file_url = await upload_video_to_s3(file, "raw-footage")
        return {"raw_footage_url": file_url}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Upload failed: {str(e)}"
        )

@router.get("/available", response_model=List[GigResponse])
def get_available_gigs(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("clipper"))
):
    """Get available gigs for clippers"""
    gigs = db.query(Gig).filter(Gig.status == "pending").all()
    return gigs

@router.get("/my-gigs", response_model=List[GigResponse])
def get_my_gigs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get user's gigs (posted if business, claimed if clipper)"""
    if current_user.role == "business_local":
        # Return gigs posted by this business
        gigs = db.query(Gig).filter(Gig.business_id == current_user.id).all()
    else:
        # Return gigs claimed by this clipper
        submissions = db.query(Submission).filter(Submission.clipper_id == current_user.id).all()
        gig_ids = [sub.gig_id for sub in submissions]
        gigs = db.query(Gig).filter(Gig.id.in_(gig_ids)).all() if gig_ids else []
    
    return gigs

@router.post("/{gig_id}/claim")
async def claim_gig(
    gig_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("clipper"))
):
    """Claim a gig (clipper only)"""
    # Check if gig exists and is available
    gig = db.query(Gig).filter(Gig.id == gig_id).first()
    if not gig:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Gig not found"
        )
    
    if gig.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Gig is not available for claiming"
        )
    
    # Check if clipper already claimed this gig
    existing_submission = db.query(Submission).filter(
        Submission.gig_id == gig_id,
        Submission.clipper_id == current_user.id
    ).first()
    
    if existing_submission:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already claimed this gig"
        )
    
    # Create submission record and update gig status
    submission = Submission(
        gig_id=gig_id,
        clipper_id=current_user.id
    )
    gig.status = "claimed"
    
    db.add(submission)
    db.commit()
    db.refresh(submission)
    
    # Send notification to business
    business = db.query(User).filter(User.id == gig.business_id).first()
    if business:
        await send_gig_claimed_notification(
            business.email, 
            gig.story_type, 
            current_user.email
        )
    
    return {"message": "Gig claimed successfully", "submission_id": submission.id}

@router.post("/submit-video", response_model=SubmissionResponse)
def submit_video(
    submission: SubmissionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("clipper"))
):
    """Submit edited video for a claimed gig"""
    # Find the submission for this gig and clipper
    db_submission = db.query(Submission).filter(
        Submission.gig_id == submission.gig_id,
        Submission.clipper_id == current_user.id
    ).first()
    
    if not db_submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No claimed gig found. You must claim the gig first."
        )
    
    # Update submission with video details
    db_submission.edited_video_url = submission.edited_video_url
    db_submission.social_post_link = submission.social_post_link
    
    # Update gig status to completed
    gig = db.query(Gig).filter(Gig.id == submission.gig_id).first()
    gig.status = "completed"
    
    db.commit()
    db.refresh(db_submission)
    
    return db_submission

@router.put("/submissions/{submission_id}/metrics", response_model=SubmissionResponse)
def update_submission_metrics(
    submission_id: int,
    metrics: SubmissionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update submission metrics (views, likes, outcomes)"""
    submission = db.query(Submission).filter(Submission.id == submission_id).first()
    
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found"
        )
    
    # Check permissions - clipper can update their own, business can update their gig's submissions
    if current_user.role == "clipper" and submission.clipper_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own submissions"
        )
    elif current_user.role == "business_local":
        gig = db.query(Gig).filter(Gig.id == submission.gig_id).first()
        if gig.business_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only update submissions for your own gigs"
            )
    
    # Update metrics
    if metrics.views is not None:
        submission.views = metrics.views
    if metrics.likes is not None:
        submission.likes = metrics.likes
    if metrics.outcomes is not None:
        submission.outcomes = metrics.outcomes
    
    # Calculate bonus based on updated metrics
    submission.bonus = calculate_bonus(submission.views, submission.likes, submission.outcomes)
    
    db.commit()
    db.refresh(submission)
    
    return submission

def calculate_bonus(views: int, likes: int, outcomes: int) -> float:
    """Calculate pure performance bonus (no base pay)"""
    # Minimum thresholds - must meet both
    if views < 300 or likes < 30:
        return 0.0
    
    bonus = 0.0
    
    # Views bonus (tiered) - 70% weight
    views_bonus = 0.0
    if views < 500:
        views_bonus = views * 0.005
    elif views < 2000:
        views_bonus = views * 0.01
    else:
        views_bonus = views * 0.015
    
    # Likes bonus (tiered) - 70% weight  
    likes_bonus = 0.0
    if likes < 50:
        likes_bonus = likes * 0.03
    elif likes < 200:
        likes_bonus = likes * 0.05
    else:
        likes_bonus = likes * 0.07
    
    # Combine engagements (70% weight)
    engagement_bonus = (views_bonus + likes_bonus) * 0.7
    
    # Outcomes bonus (30% weight) - check-ins or sales
    outcome_bonus = outcomes * 0.10 * 0.3
    
    # Total bonus
    bonus = engagement_bonus + outcome_bonus
    
    # Cap at $75
    return min(bonus, 75.0) 