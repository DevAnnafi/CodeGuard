from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app.api.routes_review import router as review_router
from app.api.routes_ws import router as ws_router
from app.api.routes_history import router as history_router
from core.database import init_db

load_dotenv()

init_db()

app = FastAPI(title="AI Code Reviewer")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(review_router, prefix="/api/review", tags=["review"])
app.include_router(ws_router, tags=["websocket"])
app.include_router(history_router, prefix="/api/history", tags=["history"])

@app.get("/health")
async def health():
    return {"status": "ok"}