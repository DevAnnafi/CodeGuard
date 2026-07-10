from sqlalchemy.orm import Session
from sqlalchemy import func
from models.history import ReviewHistory
from datetime import datetime, timezone

FREE_TIER_DAILY_LIMIT = 5

def get_daily_review_count(db: Session, user_id: int) -> int:
    today = datetime.now(timezone.utc).date()
    return db.query(func.count(ReviewHistory.id)).filter(
        ReviewHistory.user_id == user_id,
        func.date(ReviewHistory.created_at) == today
    ).scalar()

def is_rate_limited(db: Session, user_id: int) -> bool:
    return get_daily_review_count(db, user_id) >= FREE_TIER_DAILY_LIMIT

def get_remaining_reviews(db: Session, user_id: int) -> int:
    used = get_daily_review_count(db, user_id)
    return max(0, FREE_TIER_DAILY_LIMIT - used)