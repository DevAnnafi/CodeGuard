from sqlalchemy import Column, Integer, String, DateTime, JSON, Text
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class ReviewHistory(Base):
    __tablename__ = "review_history"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=True)
    language = Column(String, nullable=False)
    context = Column(String, nullable=True)
    overall_severity = Column(String, nullable=False)
    summary = Column(Text, nullable=False)
    findings = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)