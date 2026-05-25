from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from services.prompt_builder import build_prompt, SYSTEM_PROMPT
from integrations.claude_client import stream_review
from services.history_service import save_review
from models.review_request import ReviewRequest
from models.review_response import ReviewResponse
from models.issue import Issue
from core.database import SessionLocal
import json

router = APIRouter()

@router.websocket("/ws/review")
async def websocket_review(websocket: WebSocket):
    await websocket.accept()
    try:
        data = await websocket.receive_json()
        request = ReviewRequest(**data)
        prompt = build_prompt(request)

        raw = ""
        for chunk in stream_review(prompt, SYSTEM_PROMPT):
            raw += chunk
            await websocket.send_json({
                "type": "chunk",
                "content": chunk
            })

        raw = raw.strip()
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[1]
        if raw.endswith("```"):
            raw = raw.rsplit("\n", 1)[0]
        raw = raw.strip()

        parsed = json.loads(raw)

        # save to history
        review_result = ReviewResponse(
            findings=[Issue(**f) for f in parsed.get("findings", [])],
            summary=parsed.get("summary", ""),
            overall_severity=parsed.get("overall_severity", "info"),
            language=request.language
        )
        db = SessionLocal()
        try:
            save_review(db, review_result, filename=request.filename, context=request.context)
        finally:
            db.close()

        await websocket.send_json({
            "type": "done",
            "result": parsed
        })

    except WebSocketDisconnect:
        print("Client disconnected")
    except Exception as e:
        await websocket.send_json({
            "type": "error",
            "detail": str(e)
        })
    finally:
        await websocket.close()