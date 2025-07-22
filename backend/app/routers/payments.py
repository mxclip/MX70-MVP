from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any
import stripe
import os
from datetime import datetime

from ..database import get_db
from ..models import User, Gig, Submission
from ..schemas import PaymentCreate, PaymentResponse
from ..auth import get_current_active_user, require_role

router = APIRouter(prefix="/payments", tags=["payments"])

# Stripe configuration
stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "sk_test_placeholder")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "whsec_placeholder")

# Platform fees
BUSINESS_FEE_RATE = 0.08  # 8%
CLIPPER_FEE_RATE = 0.12   # 12% average (10-15%)

@router.post("/deposit", response_model=PaymentResponse)
def create_deposit(
    payment: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("business_local"))
):
    """Create escrow deposit for gig (business only)"""
    try:
        # Calculate total amount including platform fee
        base_amount = payment.amount
        platform_fee = base_amount * BUSINESS_FEE_RATE
        total_amount = base_amount + platform_fee
        
        # For MVP, we'll create a payment intent stub
        # In production, this would integrate with actual Stripe
        payment_intent = {
            "id": f"pi_mock_{datetime.utcnow().timestamp()}",
            "amount": int(total_amount * 100),  # Convert to cents
            "currency": "usd",
            "status": "requires_payment_method",
            "client_secret": f"pi_mock_{datetime.utcnow().timestamp()}_secret"
        }
        
        # In production, use actual Stripe:
        # payment_intent = stripe.PaymentIntent.create(
        #     amount=int(total_amount * 100),
        #     currency='usd',
        #     description=payment.description,
        #     metadata={
        #         'business_id': current_user.id,
        #         'base_amount': base_amount,
        #         'platform_fee': platform_fee
        #     }
        # )
        
        return PaymentResponse(
            id=payment_intent["id"],
            amount=total_amount,
            status=payment_intent["status"]
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Payment creation failed: {str(e)}"
        )

@router.post("/payout/{submission_id}")
def process_payout(
    submission_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("business_local"))
):
    """Process payout to clipper after gig completion and approval"""
    
    # Get submission and verify ownership
    submission = db.query(Submission).filter(Submission.id == submission_id).first()
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found"
        )
    
    gig = db.query(Gig).filter(Gig.id == submission.gig_id).first()
    if gig.business_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only approve payouts for your own gigs"
        )
    
    if not submission.approved:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Submission must be approved before payout"
        )
    
    try:
        # Calculate payout amounts
        base_pay = 100.0  # Base $100 payment as specified
        bonus = submission.bonus
        total_earnings = base_pay + bonus
        platform_fee = total_earnings * CLIPPER_FEE_RATE
        payout_amount = total_earnings - platform_fee
        
        # For MVP, simulate payout
        payout = {
            "id": f"po_mock_{datetime.utcnow().timestamp()}",
            "amount": int(payout_amount * 100),
            "currency": "usd",
            "status": "paid",
            "arrival_date": datetime.utcnow().timestamp() + 86400  # Next day
        }
        
        # In production, use actual Stripe:
        # clipper = db.query(User).filter(User.id == submission.clipper_id).first()
        # payout = stripe.Payout.create(
        #     amount=int(payout_amount * 100),
        #     currency='usd',
        #     destination=clipper.stripe_account_id,  # Would need to be set up
        #     metadata={
        #         'submission_id': submission_id,
        #         'base_pay': base_pay,
        #         'bonus': bonus,
        #         'platform_fee': platform_fee
        #     }
        # )
        
        return {
            "payout_id": payout["id"],
            "amount": payout_amount,
            "base_pay": base_pay,
            "bonus": bonus,
            "platform_fee": platform_fee,
            "status": payout["status"],
            "message": "Payout processed successfully"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Payout failed: {str(e)}"
        )

@router.post("/approve-submission/{submission_id}")
def approve_submission(
    submission_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("business_local"))
):
    """Approve a submission for payout (business only)"""
    
    submission = db.query(Submission).filter(Submission.id == submission_id).first()
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found"
        )
    
    gig = db.query(Gig).filter(Gig.id == submission.gig_id).first()
    if gig.business_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only approve submissions for your own gigs"
        )
    
    # Approve the submission
    submission.approved = True
    db.commit()
    
    return {
        "message": "Submission approved successfully",
        "submission_id": submission_id,
        "ready_for_payout": True
    }

@router.get("/balance")
def get_balance(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get user's balance and earnings summary"""
    
    if current_user.role == "business_local":
        # Business balance: credits earned
        from ..models import Credit
        credits = db.query(Credit).filter(Credit.user_id == current_user.id).all()
        total_credits = sum(credit.amount for credit in credits)
        
        # Total spent on gigs
        gigs = db.query(Gig).filter(Gig.business_id == current_user.id).all()
        total_spent = sum(gig.budget for gig in gigs)
        
        return {
            "role": "business_local",
            "credits_balance": total_credits,
            "total_spent": total_spent,
            "active_gigs": len([g for g in gigs if g.status in ["pending", "claimed"]])
        }
    
    else:  # clipper
        # Clipper earnings: approved submissions
        submissions = db.query(Submission).filter(
            Submission.clipper_id == current_user.id,
            Submission.approved == True
        ).all()
        
        total_earnings = 0
        for submission in submissions:
            base_pay = 100.0
            bonus = submission.bonus
            platform_fee = (base_pay + bonus) * CLIPPER_FEE_RATE
            earnings = (base_pay + bonus) - platform_fee
            total_earnings += earnings
        
        return {
            "role": "clipper",
            "total_earnings": total_earnings,
            "completed_gigs": len(submissions),
            "pending_approval": len([s for s in db.query(Submission).filter(
                Submission.clipper_id == current_user.id,
                Submission.approved == False
            ).all()])
        }

@router.post("/webhook")
def stripe_webhook(request: Dict[str, Any]):
    """Handle Stripe webhooks (for production)"""
    # For MVP, this is a placeholder
    # In production, this would handle actual Stripe events
    
    event_type = request.get("type", "unknown")
    
    # Handle different event types
    webhook_handlers = {
        "payment_intent.succeeded": handle_payment_success,
        "payout.paid": handle_payout_success,
        "payment_intent.payment_failed": handle_payment_failure,
    }
    
    handler = webhook_handlers.get(event_type)
    if handler:
        return handler(request.get("data", {}))
    
    return {"status": "event_ignored", "type": event_type}

def handle_payment_success(data: Dict[str, Any]) -> Dict[str, str]:
    """Handle successful payment"""
    return {"status": "payment_processed"}

def handle_payout_success(data: Dict[str, Any]) -> Dict[str, str]:
    """Handle successful payout"""
    return {"status": "payout_completed"}

def handle_payment_failure(data: Dict[str, Any]) -> Dict[str, str]:
    """Handle failed payment"""
    return {"status": "payment_failed"} 