from sqlalchemy.orm import Session
from models.history import ReviewHistory
from models.review_response import ReviewResponse
from typing import List, Optional

def save_review(db: Session, review: ReviewResponse, filename: str = None, context: str = None, user_id: int = None) -> ReviewHistory:
    record = ReviewHistory(
        user_id=user_id,
        filename=filename,
        language=review.language,
        context=context,
        overall_severity=review.overall_severity,
        summary=review.summary,
        findings=[f.model_dump() for f in review.findings]
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record

def get_history(db: Session, user_id: int, limit: int = 50) -> List[ReviewHistory]:
    return db.query(ReviewHistory).filter(
        ReviewHistory.user_id == user_id
    ).order_by(ReviewHistory.created_at.desc()).limit(limit).all()

def get_review(db: Session, review_id: int) -> ReviewHistory:
    return db.query(ReviewHistory).filter(ReviewHistory.id == review_id).first()

def delete_review(db: Session, review_id: int) -> bool:
    record = db.query(ReviewHistory).filter(ReviewHistory.id == review_id).first()
    if not record:
        return False
    db.delete(record)
    db.commit()
    return True