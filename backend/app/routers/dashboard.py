from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from datetime import datetime, timedelta

from ..database import get_db
from ..models import User, Gig, Submission, Credit, SelfPromo
from ..schemas import (
    DashboardResponse, 
    SelfPromoCreate, 
    SelfPromoResponse, 
    GigResponse, 
    SubmissionResponse,
    CreditResponse,
    UserResponse
)
from ..auth import get_current_active_user

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/", response_model=DashboardResponse)
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get comprehensive dashboard data for current user"""
    
    # Get user's gigs
    if current_user.role == "business_local":
        gigs = db.query(Gig).filter(Gig.business_id == current_user.id).all()
        submissions = []
        # Get submissions for business's gigs
        for gig in gigs:
            gig_submissions = db.query(Submission).filter(Submission.gig_id == gig.id).all()
            submissions.extend(gig_submissions)
    else:  # clipper
        submissions = db.query(Submission).filter(Submission.clipper_id == current_user.id).all()
        gig_ids = [sub.gig_id for sub in submissions]
        gigs = db.query(Gig).filter(Gig.id.in_(gig_ids)).all() if gig_ids else []
    
    # Get user's credits
    credits = db.query(Credit).filter(Credit.user_id == current_user.id).all()
    total_credits = sum(credit.amount for credit in credits)
    
    return DashboardResponse(
        user=UserResponse.from_orm(current_user),
        gigs=[GigResponse.from_orm(gig) for gig in gigs],
        submissions=[SubmissionResponse.from_orm(sub) for sub in submissions],
        credits=[CreditResponse.from_orm(credit) for credit in credits],
        total_credits=total_credits
    )

@router.get("/analytics")
def get_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get detailed analytics for the user"""
    
    if current_user.role == "business_local":
        return get_business_analytics(db, current_user)
    else:
        return get_clipper_analytics(db, current_user)

def get_business_analytics(db: Session, user: User) -> Dict[str, Any]:
    """Get analytics for business users"""
    
    # Get all gigs and their submissions
    gigs = db.query(Gig).filter(Gig.business_id == user.id).all()
    all_submissions = []
    for gig in gigs:
        submissions = db.query(Submission).filter(Submission.gig_id == gig.id).all()
        all_submissions.extend(submissions)
    
    # Calculate metrics
    total_views = sum(sub.views for sub in all_submissions)
    total_likes = sum(sub.likes for sub in all_submissions)
    total_outcomes = sum(sub.outcomes for sub in all_submissions)
    total_spent = sum(gig.budget for gig in gigs)
    
    # ROI calculation (simplified)
    roi_percentage = (total_outcomes * 10 / total_spent * 100) if total_spent > 0 else 0
    
    # Performance by story type
    story_performance = {}
    for gig in gigs:
        story_type = gig.story_type
        if story_type not in story_performance:
            story_performance[story_type] = {
                "gigs_count": 0,
                "total_views": 0,
                "total_likes": 0,
                "total_outcomes": 0,
                "avg_views": 0
            }
        
        story_performance[story_type]["gigs_count"] += 1
        gig_submissions = [s for s in all_submissions if s.gig_id == gig.id]
        story_views = sum(s.views for s in gig_submissions)
        story_likes = sum(s.likes for s in gig_submissions)
        story_outcomes = sum(s.outcomes for s in gig_submissions)
        
        story_performance[story_type]["total_views"] += story_views
        story_performance[story_type]["total_likes"] += story_likes
        story_performance[story_type]["total_outcomes"] += story_outcomes
    
    # Calculate averages
    for story_type in story_performance:
        count = story_performance[story_type]["gigs_count"]
        if count > 0:
            story_performance[story_type]["avg_views"] = story_performance[story_type]["total_views"] / count
    
    return {
        "role": "business_local",
        "summary": {
            "total_gigs": len(gigs),
            "active_gigs": len([g for g in gigs if g.status in ["pending", "claimed"]]),
            "completed_gigs": len([g for g in gigs if g.status == "completed"]),
            "total_spent": total_spent,
            "total_views": total_views,
            "total_likes": total_likes,
            "total_outcomes": total_outcomes,
            "roi_percentage": roi_percentage
        },
        "performance_by_story_type": story_performance,
        "recent_activity": get_recent_activity(db, user, "business_local")
    }

def get_clipper_analytics(db: Session, user: User) -> Dict[str, Any]:
    """Get analytics for clipper users"""
    
    submissions = db.query(Submission).filter(Submission.clipper_id == user.id).all()
    
    # Calculate earnings
    total_earnings = 0
    total_bonuses = 0
    for submission in submissions:
        if submission.approved:
            base_pay = 100.0
            bonus = submission.bonus
            platform_fee = (base_pay + bonus) * 0.12  # 12% platform fee
            earnings = (base_pay + bonus) - platform_fee
            total_earnings += earnings
            total_bonuses += bonus
    
    # Performance metrics
    total_views = sum(sub.views for sub in submissions)
    total_likes = sum(sub.likes for sub in submissions)
    total_outcomes = sum(sub.outcomes for sub in submissions)
    
    # Average performance per gig
    completed_submissions = [s for s in submissions if s.approved]
    avg_views = total_views / len(completed_submissions) if completed_submissions else 0
    avg_likes = total_likes / len(completed_submissions) if completed_submissions else 0
    
    # Check certifications
    from ..models import Certification
    certifications = db.query(Certification).filter(
        Certification.clipper_id == user.id,
        Certification.completed == True
    ).all()
    
    return {
        "role": "clipper",
        "summary": {
            "total_gigs": len(submissions),
            "completed_gigs": len(completed_submissions),
            "pending_approval": len([s for s in submissions if not s.approved]),
            "total_earnings": total_earnings,
            "total_bonuses": total_bonuses,
            "total_views": total_views,
            "total_likes": total_likes,
            "total_outcomes": total_outcomes,
            "avg_views_per_gig": avg_views,
            "avg_likes_per_gig": avg_likes
        },
        "certifications": [{"level": cert.level, "completed_at": cert.completed_at} for cert in certifications],
        "recent_activity": get_recent_activity(db, user, "clipper")
    }

def get_recent_activity(db: Session, user: User, role: str) -> List[Dict[str, Any]]:
    """Get recent activity for user"""
    activities = []
    
    if role == "business_local":
        # Recent gigs posted
        recent_gigs = db.query(Gig).filter(
            Gig.business_id == user.id
        ).order_by(Gig.created_at.desc()).limit(5).all()
        
        for gig in recent_gigs:
            activities.append({
                "type": "gig_posted",
                "description": f"Posted gig: {gig.story_type}",
                "amount": gig.budget,
                "date": gig.created_at,
                "status": gig.status
            })
    
    else:  # clipper
        # Recent submissions
        recent_submissions = db.query(Submission).filter(
            Submission.clipper_id == user.id
        ).order_by(Submission.created_at.desc()).limit(5).all()
        
        for submission in recent_submissions:
            gig = db.query(Gig).filter(Gig.id == submission.gig_id).first()
            activities.append({
                "type": "submission",
                "description": f"Submitted video for: {gig.story_type if gig else 'Unknown'}",
                "views": submission.views,
                "likes": submission.likes,
                "bonus": submission.bonus,
                "date": submission.created_at,
                "approved": submission.approved
            })
    
    return activities

@router.post("/self-promo-upload", response_model=SelfPromoResponse)
def upload_self_promo(
    self_promo: SelfPromoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Upload self-promotion post to earn credits (businesses only)"""
    
    if current_user.role != "business_local":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only businesses can upload self-promotion posts"
        )
    
    # Check monthly credit limit ($15/month cap)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    recent_credits = db.query(Credit).filter(
        Credit.user_id == current_user.id,
        Credit.source == "self-promo",
        Credit.created_at >= thirty_days_ago
    ).all()
    
    total_recent_credits = sum(credit.amount for credit in recent_credits)
    
    if total_recent_credits >= 15.0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Monthly self-promo credit limit reached ($15/month)"
        )
    
    # Create self-promo record
    db_self_promo = SelfPromo(
        business_id=current_user.id,
        post_link=self_promo.post_link,
        views=0,  # Will be updated manually in MVP
        likes=0,  # Will be updated manually in MVP
        credit_earned=0.0  # Will be calculated after metrics update
    )
    
    db.add(db_self_promo)
    db.commit()
    db.refresh(db_self_promo)
    
    return db_self_promo

@router.put("/self-promo/{promo_id}/metrics")
def update_self_promo_metrics(
    promo_id: int,
    metrics: Dict[str, int],  # {"views": 1000, "likes": 50}
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update self-promo metrics and calculate credits"""
    
    self_promo = db.query(SelfPromo).filter(SelfPromo.id == promo_id).first()
    
    if not self_promo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Self-promo post not found"
        )
    
    if self_promo.business_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own self-promo posts"
        )
    
    # Update metrics
    self_promo.views = metrics.get("views", self_promo.views)
    self_promo.likes = metrics.get("likes", self_promo.likes)
    
    # Calculate credit earned (minimum thresholds: 300 views, 30 likes)
    if self_promo.views >= 300 and self_promo.likes >= 30:
        credit_amount = 10.0  # $10 for qualifying self-promo
        
        # Check if credit already awarded
        if self_promo.credit_earned == 0:
            self_promo.credit_earned = credit_amount
            
            # Add credit to user account
            credit = Credit(
                user_id=current_user.id,
                amount=credit_amount,
                source="self-promo"
            )
            db.add(credit)
    
    db.commit()
    db.refresh(self_promo)
    
    return {
        "self_promo_id": promo_id,
        "views": self_promo.views,
        "likes": self_promo.likes,
        "credit_earned": self_promo.credit_earned,
        "qualified": self_promo.views >= 300 and self_promo.likes >= 30
    }

@router.get("/calculate-bonus/{submission_id}")
def calculate_bonus_preview(
    submission_id: int,
    views: int,
    likes: int,
    outcomes: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Calculate bonus preview for given metrics (doesn't save)"""
    
    submission = db.query(Submission).filter(Submission.id == submission_id).first()
    
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found"
        )
    
    # Verify permissions
    if current_user.role == "clipper" and submission.clipper_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view calculations for your own submissions"
        )
    elif current_user.role == "business_local":
        gig = db.query(Gig).filter(Gig.id == submission.gig_id).first()
        if gig.business_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view calculations for your own gig submissions"
            )
    
    # Calculate bonus using the same logic as in gigs.py
    bonus = calculate_bonus_amount(views, likes, outcomes)
    
    return {
        "submission_id": submission_id,
        "input_metrics": {
            "views": views,
            "likes": likes,
            "outcomes": outcomes
        },
        "bonus_calculation": {
            "bonus_amount": bonus,
            "meets_minimum": views >= 300 and likes >= 30,
            "breakdown": get_bonus_breakdown(views, likes, outcomes)
        }
    }

def calculate_bonus_amount(views: int, likes: int, outcomes: int) -> float:
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

def get_bonus_breakdown(views: int, likes: int, outcomes: int) -> Dict[str, Any]:
    """Get detailed breakdown of bonus calculation"""
    breakdown = {
        "views_bonus": 0.0,
        "likes_bonus": 0.0,
        "outcomes_bonus": 0.0,
        "total_before_cap": 0.0,
        "cap_applied": False
    }
    
    if views < 300 or likes < 30:
        return breakdown
    
    # Views calculation
    if views < 500:
        breakdown["views_bonus"] = views * 0.005
        breakdown["views_rate"] = "$0.005/view"
    elif views < 2000:
        breakdown["views_bonus"] = views * 0.01
        breakdown["views_rate"] = "$0.01/view"
    else:
        breakdown["views_bonus"] = views * 0.015
        breakdown["views_rate"] = "$0.015/view"
    
    # Likes calculation
    if likes < 50:
        breakdown["likes_bonus"] = likes * 0.03
        breakdown["likes_rate"] = "$0.03/like"
    elif likes < 200:
        breakdown["likes_bonus"] = likes * 0.05
        breakdown["likes_rate"] = "$0.05/like"
    else:
        breakdown["likes_bonus"] = likes * 0.07
        breakdown["likes_rate"] = "$0.07/like"
    
    # Outcomes calculation
    breakdown["outcomes_bonus"] = outcomes * 0.10 * 0.3
    breakdown["outcomes_rate"] = "$0.10/outcome (30% weight)"
    
    breakdown["total_before_cap"] = breakdown["views_bonus"] + breakdown["likes_bonus"] + breakdown["outcomes_bonus"]
    
    if breakdown["total_before_cap"] > 75.0:
        breakdown["cap_applied"] = True
        breakdown["final_bonus"] = 75.0
    else:
        breakdown["final_bonus"] = breakdown["total_before_cap"]
    
    return breakdown 