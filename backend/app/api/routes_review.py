from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from typing import Optional
from models.review_request import ReviewRequest
from models.review_response import ReviewResponse
from models.issue import Issue
from services.reviewer import run_review
from utils.file_utils import detect_language, validate_file
from fastapi.responses import StreamingResponse
from services.exporter import generate_pdf
from sqlalchemy.orm import Session
from core.database import get_db
from services.history_service import save_review
import io

router = APIRouter()

@router.post("/", response_model=ReviewResponse)
async def review_code(request: ReviewRequest, db: Session = Depends(get_db)):
    try:
        result = run_review(request)
        save_review(db, result, filename=request.filename, context=request.context)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload", response_model=ReviewResponse)
async def review_file(
    file: UploadFile = File(...),
    context: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    contents = await file.read()

    error = validate_file(file.filename, len(contents))
    if error:
        raise HTTPException(status_code=400, detail=error)

    code = contents.decode("utf-8")
    language = detect_language(file.filename)

    request = ReviewRequest(
        code=code,
        language=language,
        filename=file.filename,
        context=context
    )

    try:
        result = run_review(request)
        save_review(db, result, filename=file.filename, context=context)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/export")
async def export_review(result: ReviewResponse, filename: str = "review"):
    pdf_bytes = generate_pdf(result, filename)
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=codeguard_{filename}.pdf"
        }
    )