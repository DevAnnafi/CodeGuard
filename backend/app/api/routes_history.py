from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from app.api.deps import get_current_user
from services.history_service import get_history, get_review, delete_review
from models.user import User

router = APIRouter()

@router.get("/")
def list_history(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    records = get_history(db, user_id=current_user.id)
    return [
        {
            "id": r.id,
            "filename": r.filename,
            "language": r.language,
            "context": r.context,
            "overall_severity": r.overall_severity,
            "summary": r.summary,
            "findings": r.findings,
            "created_at": r.created_at.isoformat()
        }
        for r in records
    ]

@router.get("/{review_id}")
def get_single(review_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    record = get_review(db, review_id)
    if not record or record.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Review not found")
    return {
        "id": record.id,
        "filename": record.filename,
        "language": record.language,
        "context": record.context,
        "overall_severity": record.overall_severity,
        "summary": record.summary,
        "findings": record.findings,
        "created_at": record.created_at.isoformat()
    }

@router.delete("/{review_id}")
def delete_single(review_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    success = delete_review(db, review_id)
    if not success:
        raise HTTPException(status_code=404, detail="Review not found")
    return {"deleted": True}