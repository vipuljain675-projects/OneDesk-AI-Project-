"""
threads_routes.py
CRUD API for GPT/Gemini-style persistent chat threads stored in Supabase.

GET    /api/threads                        - List all threads for employee
POST   /api/threads                        - Create new thread
DELETE /api/threads/{thread_id}            - Delete thread + all its messages
PATCH  /api/threads/{thread_id}            - Rename thread title
GET    /api/threads/{thread_id}/messages   - Load all messages for a thread
"""
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

import uuid
import json
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime

from db.models import get_db, ChatThread, ChatMessage

router = APIRouter()


# ─── Pydantic schemas ──────────────────────────────────────────────────────────

class CreateThreadRequest(BaseModel):
    employee_id: str = "EMP001"
    user_email: str = ""
    user_name: str = ""
    title: str = "New Chat"

class RenameThreadRequest(BaseModel):
    title: str

class ThreadOut(BaseModel):
    thread_id: str
    title: str
    employee_id: str
    user_email: str | None
    user_name: str | None
    created_at: str
    updated_at: str
    message_count: int = 0

class MessageOut(BaseModel):
    id: int
    thread_id: str
    sender: str
    text: str
    user_email: str | None = None
    user_name: str | None = None
    domain: str | None
    confidence: float | None
    sources: list | None
    action_proposal: dict | None = None
    created_at: str


# ─── Routes ───────────────────────────────────────────────────────────────────

@router.get("/threads", response_model=list[ThreadOut])
def list_threads(employee_id: str = "EMP001", db: Session = Depends(get_db)):
    """List all threads for an employee, ordered by most recently updated."""
    threads = (
        db.query(ChatThread)
        .filter(ChatThread.employee_id == employee_id)
        .order_by(ChatThread.updated_at.desc())
        .all()
    )
    result = []
    for t in threads:
        msg_count = db.query(ChatMessage).filter(ChatMessage.thread_id == t.thread_id).count()
        result.append(ThreadOut(
            thread_id=t.thread_id,
            title=t.title,
            employee_id=t.employee_id,
            user_email=t.user_email,
            user_name=t.user_name,
            created_at=t.created_at.isoformat() + "+00:00",
            updated_at=t.updated_at.isoformat() + "+00:00",
            message_count=msg_count,
        ))
    return result


@router.post("/threads", response_model=ThreadOut)
def create_thread(req: CreateThreadRequest, db: Session = Depends(get_db)):
    """Create a new chat thread."""
    new_thread = ChatThread(
        thread_id=str(uuid.uuid4()),
        employee_id=req.employee_id,
        user_email=req.user_email or req.employee_id or None,
        user_name=req.user_name or None,
        title=req.title,
    )
    db.add(new_thread)
    db.commit()
    db.refresh(new_thread)
    return ThreadOut(
        thread_id=new_thread.thread_id,
        title=new_thread.title,
        employee_id=new_thread.employee_id,
        user_email=new_thread.user_email,
        user_name=new_thread.user_name,
        created_at=new_thread.created_at.isoformat() + "+00:00",
        updated_at=new_thread.updated_at.isoformat() + "+00:00",
        message_count=0,
    )


@router.delete("/threads/{thread_id}")
def delete_thread(thread_id: str, db: Session = Depends(get_db)):
    """Delete a thread and all its messages."""
    thread = db.query(ChatThread).filter(ChatThread.thread_id == thread_id).first()
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")
    # Delete all messages first
    db.query(ChatMessage).filter(ChatMessage.thread_id == thread_id).delete()
    db.delete(thread)
    db.commit()
    return {"success": True, "deleted_thread_id": thread_id}


@router.patch("/threads/{thread_id}", response_model=ThreadOut)
def rename_thread(thread_id: str, req: RenameThreadRequest, db: Session = Depends(get_db)):
    """Rename a thread's title."""
    thread = db.query(ChatThread).filter(ChatThread.thread_id == thread_id).first()
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")
    thread.title = req.title
    thread.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(thread)
    msg_count = db.query(ChatMessage).filter(ChatMessage.thread_id == thread_id).count()
    return ThreadOut(
        thread_id=thread.thread_id,
        title=thread.title,
        employee_id=thread.employee_id,
        created_at=thread.created_at.isoformat() + "+00:00",
        updated_at=thread.updated_at.isoformat() + "+00:00",
        message_count=msg_count,
    )


@router.get("/threads/{thread_id}/messages", response_model=list[MessageOut])
def get_thread_messages(thread_id: str, db: Session = Depends(get_db)):
    """Load all messages for a thread, oldest first."""
    thread = db.query(ChatThread).filter(ChatThread.thread_id == thread_id).first()
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")
    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.thread_id == thread_id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )
    result = []
    for m in messages:
        sources = None
        if m.sources:
            try:
                sources = json.loads(m.sources)
            except Exception:
                sources = []
        action_prop = None
        if getattr(m, "action_proposal", None):
            try:
                action_prop = json.loads(m.action_proposal)
            except Exception:
                action_prop = None

        result.append(MessageOut(
            id=m.id,
            thread_id=m.thread_id,
            sender=m.sender,
            text=m.text,
            user_email=m.user_email,
            user_name=m.user_name,
            domain=m.domain,
            confidence=m.confidence,
            sources=sources,
            action_proposal=action_prop,
            created_at=m.created_at.isoformat() + "+00:00",
        ))
    return result


class MarkExecutedRequest(BaseModel):
    result_message: str = ""
    ticket_number: str = ""
    thread_id: str | None = None


@router.patch("/messages/{message_id}/mark-executed")
def mark_message_executed(message_id: str, req: MarkExecutedRequest, db: Session = Depends(get_db)):
    """Mark a chat message's action_proposal as executed in the DB."""
    msg = None
    try:
        int_id = int(message_id)
        msg = db.query(ChatMessage).filter(ChatMessage.id == int_id).first()
    except (ValueError, TypeError):
        pass

    # Fallback to finding the message by thread_id if ID was a client string
    if not msg and req.thread_id:
        msg = (
            db.query(ChatMessage)
            .filter(
                ChatMessage.thread_id == req.thread_id,
                ChatMessage.sender == "bot",
                ChatMessage.action_proposal.isnot(None),
            )
            .order_by(ChatMessage.id.desc())
            .first()
        )

    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")

    # Parse existing action_proposal and merge executed flag
    try:
        proposal = json.loads(msg.action_proposal) if msg.action_proposal else {}
    except Exception:
        proposal = {}

    proposal["executed"] = True
    proposal["result_message"] = req.result_message
    if req.ticket_number:
        proposal["ticket_number"] = req.ticket_number

    msg.action_proposal = json.dumps(proposal)
    db.commit()
    print(f"✅ [mark_message_executed] Persisted executed=True for message {msg.id}")
    return {"success": True, "message_id": msg.id}
