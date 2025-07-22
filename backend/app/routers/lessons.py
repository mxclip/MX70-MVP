from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from datetime import datetime

from ..database import get_db
from ..models import User, Lesson, Certification
from ..schemas import LessonResponse, CertificationResponse
from ..auth import get_current_active_user, require_role

router = APIRouter(prefix="/lessons", tags=["lessons"])

# Sample lesson data for MVP
SAMPLE_LESSONS = [
    {
        "id": 1,
        "title": "Creating Compelling Content",
        "content": """
        Learn how to create engaging content that drives results:
        
        1. Hook viewers in the first 3 seconds
        2. Show the problem and solution clearly
        3. Use dynamic camera movements
        4. Include strong call-to-actions
        5. Optimize for mobile viewing
        
        Video tutorial: https://example.com/lesson1
        """,
        "quiz": {
            "questions": [
                {
                    "question": "How long do you have to hook viewers?",
                    "options": ["1 second", "3 seconds", "5 seconds", "10 seconds"],
                    "correct": 1
                },
                {
                    "question": "What's most important for mobile optimization?",
                    "options": ["High resolution", "Vertical format", "Long duration", "Complex editing"],
                    "correct": 1
                },
                {
                    "question": "A strong call-to-action should be:",
                    "options": ["Subtle", "At the end only", "Clear and direct", "Optional"],
                    "correct": 2
                }
            ]
        }
    },
    {
        "id": 2,
        "title": "Performance Metrics That Matter",
        "content": """
        Understanding key metrics for success:
        
        1. View completion rates vs raw views
        2. Engagement depth (likes, comments, shares)
        3. Conversion tracking through outcomes
        4. Time-of-day posting optimization
        5. Hashtag strategy for discoverability
        
        Video tutorial: https://example.com/lesson2
        """,
        "quiz": {
            "questions": [
                {
                    "question": "Which metric indicates content quality best?",
                    "options": ["Total views", "View completion rate", "Number of hashtags", "Video length"],
                    "correct": 1
                },
                {
                    "question": "When should you track outcomes?",
                    "options": ["Only after 1000 views", "Within 24 hours", "Throughout the campaign", "Never"],
                    "correct": 2
                },
                {
                    "question": "Optimal posting time depends on:",
                    "options": ["Your schedule", "Target audience behavior", "Platform algorithm", "Video length"],
                    "correct": 1
                }
            ]
        }
    }
]

@router.get("/", response_model=List[LessonResponse])
def get_lessons(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("clipper"))
):
    """Get all available lessons for clippers"""
    # In MVP, return sample lessons. In production, query from database
    lessons = []
    for lesson_data in SAMPLE_LESSONS:
        lessons.append(LessonResponse(
            id=lesson_data["id"],
            title=lesson_data["title"],
            content=lesson_data["content"],
            quiz=lesson_data["quiz"],
            created_at=datetime.utcnow()
        ))
    return lessons

@router.get("/{lesson_id}", response_model=LessonResponse)
def get_lesson(
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("clipper"))
):
    """Get a specific lesson by ID"""
    lesson_data = next((l for l in SAMPLE_LESSONS if l["id"] == lesson_id), None)
    
    if not lesson_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found"
        )
    
    return LessonResponse(
        id=lesson_data["id"],
        title=lesson_data["title"],
        content=lesson_data["content"],
        quiz=lesson_data["quiz"],
        created_at=datetime.utcnow()
    )

@router.post("/{lesson_id}/complete-quiz")
def complete_quiz(
    lesson_id: int,
    answers: Dict[str, Any],  # {"answers": [0, 1, 2]} - array of answer indices
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("clipper"))
):
    """Complete a lesson quiz and get certification if passed"""
    lesson_data = next((l for l in SAMPLE_LESSONS if l["id"] == lesson_id), None)
    
    if not lesson_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found"
        )
    
    if "answers" not in answers:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing 'answers' field in request"
        )
    
    user_answers = answers["answers"]
    quiz = lesson_data["quiz"]
    
    if len(user_answers) != len(quiz["questions"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Number of answers doesn't match number of questions"
        )
    
    # Calculate score
    correct_answers = 0
    for i, question in enumerate(quiz["questions"]):
        if i < len(user_answers) and user_answers[i] == question["correct"]:
            correct_answers += 1
    
    score = (correct_answers / len(quiz["questions"])) * 100
    passed = score >= 70  # 70% passing grade
    
    result = {
        "lesson_id": lesson_id,
        "score": score,
        "passed": passed,
        "correct_answers": correct_answers,
        "total_questions": len(quiz["questions"])
    }
    
    # If passed, create or update certification
    if passed:
        # Check if user already has certification for this lesson
        certification = db.query(Certification).filter(
            Certification.clipper_id == current_user.id,
            Certification.level == "basic"  # For MVP, we only have basic certification
        ).first()
        
        if not certification:
            # Create new certification
            certification = Certification(
                clipper_id=current_user.id,
                level="basic",
                completed=True,
                completed_at=datetime.utcnow()
            )
            db.add(certification)
            db.commit()
            result["certification_earned"] = True
        else:
            result["certification_earned"] = False
            result["message"] = "You already have this certification"
    
    return result

@router.get("/certifications/my", response_model=List[CertificationResponse])
def get_my_certifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("clipper"))
):
    """Get current user's certifications"""
    certifications = db.query(Certification).filter(
        Certification.clipper_id == current_user.id
    ).all()
    return certifications

@router.get("/certifications/check-eligibility")
def check_gig_eligibility(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("clipper"))
):
    """Check if clipper is eligible to claim gigs (has basic certification)"""
    certification = db.query(Certification).filter(
        Certification.clipper_id == current_user.id,
        Certification.level == "basic",
        Certification.completed == True
    ).first()
    
    return {
        "eligible": certification is not None,
        "certification_required": "basic",
        "message": "Complete lesson quizzes to earn basic certification" if not certification else "You are eligible to claim gigs"
    } 