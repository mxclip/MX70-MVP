from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import User, Gig, Submission, Credit
from ..schemas import GigCreate, GigResponse, SubmissionCreate, SubmissionResponse, SubmissionUpdate
from ..auth import get_current_active_user, require_role

router = APIRouter(prefix="/gigs", tags=["gigs"])

@router.post("/post-gig", response_model=GigResponse)
def post_gig(
    gig: GigCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("business_local"))
):
    """Post a new gig (business only)"""
    # Validate budget is reasonable
    if gig.budget < 50:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Minimum budget is $50"
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
    
    # Add gig posting credit ($5 per gig posted)
    credit = Credit(
        user_id=current_user.id,
        amount=5.0,
        source="gig_post"
    )
    db.add(credit)
    
    db.commit()
    db.refresh(db_gig)
    
    return db_gig

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
def claim_gig(
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
    """Calculate bonus based on tiered engagement metrics"""
    # Minimum thresholds
    if views < 300 or likes < 30:
        return 0.0
    
    bonus = 0.0
    
    # Views bonus (tiered)
    if views < 500:
        bonus += views * 0.005
    elif views < 2000:
        bonus += views * 0.01
    else:
        bonus += views * 0.015
    
    # Likes bonus (tiered)
    if likes < 50:
        bonus += likes * 0.03
    elif likes < 200:
        bonus += likes * 0.05
    else:
        bonus += likes * 0.07
    
    # Outcomes bonus (hybrid 30% weight)
    bonus += outcomes * 0.10 * 0.3
    
    # Cap at $75
    return min(bonus, 75.0) 