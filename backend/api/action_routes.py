"""
action_routes.py
POST /confirm-action — executes a confirmed agentic action.
Called when user clicks "Confirm" on the action card in the frontend.
"""
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from db.models import get_db
from actions.executor import execute_action

router = APIRouter()


class ActionConfirmRequest(BaseModel):
    action_type: str    # "raise_ticket" | "apply_leave" | "book_room"
    details: dict       # extracted parameters from the query route
    thread_id: str | None = None
    message_id: str | None = None


@router.post("/confirm-action")
async def confirm_action(request: ActionConfirmRequest, db: Session = Depends(get_db)):
    """
    Execute a confirmed action. Only called after user clicks Confirm.
    This is the human-in-the-loop gate — no action happens without this call.
    """
    result = execute_action(
        action_type=request.action_type,
        details=request.details,
        db=db
    )

    # If action executed successfully, persist executed flag to ChatMessage in DB
    if result.get("success"):
        try:
            import json
            from db.models import ChatMessage

            msg = None
            if request.message_id:
                try:
                    int_id = int(request.message_id)
                    msg = db.query(ChatMessage).filter(ChatMessage.id == int_id).first()
                except (ValueError, TypeError):
                    pass

            # Fallback: find the most recent bot message with an action_proposal in this thread
            if not msg and request.thread_id:
                msg = (
                    db.query(ChatMessage)
                    .filter(
                        ChatMessage.thread_id == request.thread_id,
                        ChatMessage.sender == "bot",
                        ChatMessage.action_proposal.isnot(None),
                    )
                    .order_by(ChatMessage.id.desc())
                    .first()
                )

            if msg and msg.action_proposal:
                try:
                    prop = json.loads(msg.action_proposal)
                except Exception:
                    prop = {}

                prop["executed"] = True
                prop["result_message"] = result.get("message", "")
                ticket_num = result.get("ticket_number") or result.get("booking_id") or ""
                if ticket_num:
                    prop["ticket_number"] = ticket_num

                msg.action_proposal = json.dumps(prop)
                db.commit()
                print(f"✅ [confirm-action] Auto-marked message {msg.id} in thread {msg.thread_id} as executed")
        except Exception as e:
            print(f"⚠️ [confirm-action] Could not auto-mark message executed: {e}")

    return result
