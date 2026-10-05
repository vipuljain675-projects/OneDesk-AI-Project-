"""
query_routes.py
POST /query — main chat endpoint with multi-turn conversation memory and contextual domain continuity.
Handles: history retrieval → domain classification (with carryover) → semantic search → intent detection → natural generation
Also auto-saves user + bot messages to ChatMessage table for persistent GPT-style threads.
"""
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from fastapi import APIRouter, Depends
from auth.middleware import optional_auth
from pydantic import BaseModel
from sqlalchemy.orm import Session

from db.models import get_db, ConversationLog, ChatMessage, ChatThread
from retrieval.domain_classifier import classify_domain
from retrieval.semantic_retriever import retrieve_chunks
from augmentation.prompt_builder import build_prompt, build_action_detection_prompt
from generation.answer_generator import generate_answer, detect_action_intent, get_telemetry_summary
from actions.tools import get_tool_by_name
from config import DOMAINS

import uuid
import time

router = APIRouter()


class QueryRequest(BaseModel):
    query: str
    session_id: str = None
    thread_id: str = None      # GPT-style thread for persistent storage
    force_domain: str = None   # user can override domain after "clarify" prompt
    history: list[dict] = None # optional client chat history
    user_name: str = "Employee"
    department: str = "General"
    employee_id: str = "EMP001"


class QueryResponse(BaseModel):
    answer: str
    domain: str
    confidence: float
    routing_decision: str
    sources: list[dict]
    action_proposal: dict | None  # populated if agent wants to take an action
    session_id: str
    message_id: int | None = None
    user_message_id: int | None = None


@router.post("/query", response_model=QueryResponse)
async def handle_query(
    request: QueryRequest,
    db: Session = Depends(get_db),
    current_user: dict | None = Depends(optional_auth),  # JWT auth (optional — admin console bhi support karta hai)
):
    session_id = request.session_id or str(uuid.uuid4())
    query = request.query.strip()
    query_lower = query.lower()

    # ── JWT Auth: Agar token valid hai toh verified email use karo ──────────
    # current_user = { "email": "vipul@gmail.com", "user_id": "uuid", "role": "..." }
    # Agar admin console (no token) → request.employee_id as-is use hoga
    if current_user and current_user.get("email"):
        request.employee_id = current_user["email"]  # Token se verified email

    # ── Step 0: Retrieve past conversation context for this session ──────────
    past_logs = db.query(ConversationLog).filter(
        ConversationLog.session_id == session_id
    ).order_by(ConversationLog.created_at.asc()).all()

    conversation_history = []
    last_domain = None

    for log in past_logs[-4:]:
        conversation_history.append({"user": log.user_query, "bot": log.bot_response})
        if log.domain_classified and log.domain_classified != "unknown":
            last_domain = log.domain_classified

    # If client passed additional in-memory history, merge it
    if request.history:
        for item in request.history[-4:]:
            if item.get("sender") == "user":
                conversation_history.append({"user": item.get("text", "")})
            elif item.get("sender") == "bot":
                conversation_history.append({"bot": item.get("text", "")})

    # ── Step 1: Classify domain with conversational continuity ────────────────
    classification = classify_domain(query)
    raw_domain = classification["domain"]
    confidence = classification["confidence"]
    routing_decision = classification["routing_decision"]

    domain = request.force_domain or raw_domain

    # Domain Carry-over check:
    # If the user is having an ongoing conversation in a domain (e.g. HR or IT),
    # and their follow-up is conversational ("No no since start of the year...", "What about next week?", "Can you do that?"),
    # maintain the ongoing domain context rather than jumping!
    conversational_cues = ["no no", "actually", "since", "what about", "and", "so", "can you", "then", "how come", "why", "yes please", "okay"]
    is_followup = any(cue in query_lower for cue in conversational_cues) or len(query.split()) <= 6

    if last_domain and not request.force_domain:
        # If current classification is weak (< 0.65) OR query looks like a follow-up to previous topic
        if is_followup or confidence < 0.65:
            # If previous was HR and current discusses time off/holidays/days/leaves:
            if last_domain == "HR" and any(w in query_lower for w in ["holiday", "holidays", "leave", "day", "days", "salary", "deduct", "time off", "absence", "pto", "workday"]):
                domain = "HR"
                confidence = max(confidence, 0.95)
                routing_decision = "direct"
            # If previous was IT and current discusses issue/screen/laptop/fix:
            elif last_domain == "IT" and any(w in query_lower for w in ["screen", "laptop", "pc", "device", "reboot", "restart", "fix", "ticket", "issue", "problem"]):
                domain = "IT"
                confidence = max(confidence, 0.95)
                routing_decision = "direct"
            # General follow-up continuity
            elif is_followup and confidence < 0.60:
                domain = last_domain
                confidence = 0.90
                routing_decision = "direct"

    # ── Step 2: If too ambiguous and no prior context, ask user to clarify ────
    if routing_decision == "ask_user" and not request.force_domain and not last_domain:
        return QueryResponse(
            answer="I'm not sure which department this falls under. Could you clarify — is this an IT, HR, Finance, or Facilities question?",
            domain="unknown",
            confidence=confidence,
            routing_decision="ask_user",
            sources=[],
            action_proposal=None,
            session_id=session_id
        )

    # ── Step 3: Retrieve relevant chunks from vector store ────────────────────
    multi_domains = classification.get("secondary_domains", [])
    chunks = retrieve_chunks(query, domain, top_k=5, domains_list=multi_domains)

    # ── Step 4: Detect if this is an automated agentic action request ─────────
    action_prompt = build_action_detection_prompt(query, domain, conversation_history)
    intent_result = detect_action_intent(action_prompt)
    intent_type = intent_result.get("intent_type", "query")
    intent_details = intent_result.get("details", {})

    action_proposal = None
    if intent_type != "query":
        tool = get_tool_by_name(intent_type)
        if tool:
            if not intent_details.get("employee_id"):
                intent_details["employee_id"] = request.employee_id or "EMP001"
            action_proposal = {
                "action_type": intent_type,
                "display_name": tool["display_name"],
                "description": tool["description"],
                "details": intent_details
            }

    # ── Step 5: Generate contextual RAG answer ────────────────────────────────
    t_request_start = time.time()
    prompt = build_prompt(
        query=query,
        chunks=chunks,
        domain=domain,
        history=conversation_history,
        user_name=request.user_name,
        department=request.department,
    )
    gen_result = generate_answer(prompt)
    answer = gen_result["answer"]
    gen_telemetry = gen_result["telemetry"]
    total_request_ms = round((time.time() - t_request_start) * 1000, 1)

    # ── Step 6: Format sources for frontend ──────────────────────────────────
    sources = [
        {
            "filename": c["filename"],
            "text": c["text"][:300] + "..." if len(c["text"]) > 300 else c["text"],
            "score": c["score"],
            "domain": c["primary_domain"]
        }
        for c in chunks[:3]  # top 3 sources
    ]

    # ── Step 7: Log to database for telemetry & audit trail ──────────────────
    log = ConversationLog(
        session_id=session_id,
        user_query=query,
        domain_classified=domain,
        confidence_score=confidence,
        bot_response=answer,
        source_cited=sources[0]["filename"] if sources else None
    )
    print(f"[Request] total_pipeline_ms={total_request_ms} | tokens={gen_telemetry.get('total_tokens')} | cost≈${gen_telemetry.get('estimated_cost_usd')}")
    db.add(log)

    # ── Step 8: Persist messages to ChatThread for GPT-style UI ──────────────
    # ── Step 8: Persist messages to ChatThread for GPT-style UI ──────────────
    bot_message_id = None
    user_message_id = None
    if request.thread_id:
        import json as _json
        from datetime import datetime as _dt

        # Save user message — with real user identity
        user_msg = ChatMessage(
            thread_id=request.thread_id,
            sender="user",
            text=query,
            user_email=request.employee_id,   # employee_id is user's email
            user_name=request.user_name,
        )
        db.add(user_msg)
        # Save bot response — no user identity (it's the bot)
        bot_msg = ChatMessage(
            thread_id=request.thread_id,
            sender="bot",
            text=answer,
            domain=domain,
            confidence=confidence,
            sources=_json.dumps(sources) if sources else None,
            action_proposal=_json.dumps(action_proposal) if action_proposal else None,
        )
        db.add(bot_msg)
        # Update thread metadata with user identity + updated_at
        thread = db.query(ChatThread).filter(ChatThread.thread_id == request.thread_id).first()
        if thread:
            thread.updated_at = _dt.utcnow()
            # Store user identity on the thread too (for easy lookup)
            if not thread.user_email:
                thread.user_email = request.employee_id
            if not thread.user_name:
                thread.user_name = request.user_name
            # Also keep employee_id in sync
            if thread.employee_id == "EMP001" and request.employee_id:
                thread.employee_id = request.employee_id
            # Auto-title thread from first user message
            if thread.title == "New Chat":
                thread.title = query[:60] + ("..." if len(query) > 60 else "")

        db.commit()
        db.refresh(user_msg)
        db.refresh(bot_msg)
        user_message_id = user_msg.id
        bot_message_id = bot_msg.id
    else:
        db.commit()

    return QueryResponse(
        answer=answer,
        domain=domain,
        confidence=confidence,
        routing_decision=routing_decision,
        sources=sources,
        action_proposal=action_proposal,
        session_id=session_id,
        message_id=bot_message_id,
        user_message_id=user_message_id,
    )
