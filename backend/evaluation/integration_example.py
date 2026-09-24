"""
Example integration of evaluation module in query_routes.py
Shows how to add evaluation tracking to existing query processing
"""

# ── ADD THESE IMPORTS TO query_routes.py ────────────────────────────────────
from evaluation.scorer import query_evaluator, performance_tracker
import time

# ── MODIFIED /query ENDPOINT WITH EVALUATION ────────────────────────────────

@router.post("/query", response_model=QueryResponse)
async def handle_query_with_evaluation(request: QueryRequest, db: Session = Depends(get_db)):
    """
    Enhanced query handler with evaluation tracking
    """
    session_id = request.session_id or str(uuid.uuid4())
    query = request.query.strip()
    
    # Start timing for performance tracking
    start_time = time.time()
    
    # ── EVALUATION STEP 1: Query Quality Check ────────────────────────────
    query_quality = query_evaluator.evaluate_query_quality(query)
    
    # If query quality is too low, suggest improvements
    if query_quality["quality_score"] < 40:
        return QueryResponse(
            answer=f"I noticed your question might need more details. {', '.join(query_quality['suggestions'])}. Could you provide more information?",
            domain="unknown",
            confidence=0.0,
            routing_decision="clarify",
            sources=[],
            action_proposal=None,
            session_id=session_id
        )
    
    # ── STEP 2: Existing routing logic... ─────────────────────────────────
    classification = classify_domain(query)
    domain = classification["domain"]
    confidence = classification["confidence"]
    routing_decision = classification["routing_decision"]
    
    # ── EVALUATION STEP 3: Routing Confidence Evaluation ──────────────────
    routing_eval = query_evaluator.evaluate_routing_confidence(
        domain=domain,
        confidence_score=confidence,
        fallback_used=(routing_decision == "fallback")
    )
    
    # Log if routing quality is low
    if routing_eval["routing_quality"] == "low":
        print(f"⚠️  Low routing quality for query: {query[:50]}...")
        print(f"   Recommendation: {routing_eval.get('recommendation', 'N/A')}")
    
    # ── STEP 4: Retrieve chunks and generate answer... ────────────────────
    chunks = retrieve_chunks(query, domain, top_k=5)
    prompt = build_prompt(query, chunks, domain)
    answer = generate_answer(prompt)
    
    # ── EVALUATION STEP 5: Response Quality Evaluation ────────────────────
    response_quality = query_evaluator.calculate_response_quality(
        response_text=answer,
        query=query,
        retrieved_docs=len(chunks)
    )
    
    # Log if response quality is low
    if response_quality["completeness_score"] < 50:
        print(f"⚠️  Low response quality (score: {response_quality['completeness_score']})")
        print(f"   Has steps: {response_quality['has_steps']}")
        print(f"   Has links: {response_quality['has_links']}")
    
    # ── EVALUATION STEP 6: Log Performance Metrics ────────────────────────
    response_time_ms = (time.time() - start_time) * 1000
    
    performance_tracker.log_query_metrics(
        query_id=session_id,
        domain=domain,
        confidence=confidence,
        response_time_ms=response_time_ms,
        success=True
    )
    
    # ── STEP 7: Save to database... ───────────────────────────────────────
    log = ConversationLog(
        session_id=session_id,
        user_query=query,
        domain_classified=domain,
        confidence_score=confidence,
        bot_response=answer,
        source_cited=chunks[0]["filename"] if chunks else None
    )
    db.add(log)
    db.commit()
    
    # ── Return response with evaluation metadata (optional) ───────────────
    return QueryResponse(
        answer=answer,
        domain=domain,
        confidence=confidence,
        routing_decision=routing_decision,
        sources=[
            {
                "filename": c["filename"],
                "text": c["text"][:300] + "...",
                "score": c["score"],
                "domain": c["primary_domain"]
            }
            for c in chunks[:3]
        ],
        action_proposal=None,
        session_id=session_id
    )


# ── EXAMPLE: Feedback Collection Endpoint ───────────────────────────────────

@router.post("/query/feedback")
async def collect_query_feedback(
    session_id: str,
    ticket_id: int,
    rating: int,
    was_helpful: bool,
    routing_correct: bool,
    comments: str = None,
    db: Session = Depends(get_db)
):
    """
    Collect user feedback on a query/response for evaluation
    """
    from evaluation.scorer import feedback_analyzer
    
    # Get the original query and response from DB
    log = db.query(ConversationLog).filter(
        ConversationLog.session_id == session_id
    ).order_by(ConversationLog.created_at.desc()).first()
    
    if not log:
        return {"success": False, "error": "Session not found"}
    
    # Record feedback
    feedback_analyzer.record_feedback(
        ticket_id=ticket_id,
        query=log.user_query,
        response=log.bot_response,
        rating=rating,
        was_helpful=was_helpful,
        routing_was_correct=routing_correct,
        comments=comments
    )
    
    return {
        "success": True,
        "message": "Feedback recorded successfully"
    }


# ── EXAMPLE: Real-time Quality Dashboard ────────────────────────────────────

@router.get("/admin/quality-dashboard")
async def get_quality_dashboard(db: Session = Depends(get_db)):
    """
    Get real-time quality metrics for admin monitoring
    """
    from evaluation.scorer import performance_tracker, feedback_analyzer
    
    # Get recent performance metrics
    perf_metrics = performance_tracker.calculate_accuracy_metrics(time_window_hours=24)
    
    # Get domain breakdown
    domain_breakdown = performance_tracker.get_domain_breakdown()
    
    # Get user satisfaction
    satisfaction = feedback_analyzer.calculate_satisfaction_score()
    
    # Get routing accuracy from feedback (ground truth)
    feedback_accuracy = feedback_analyzer.get_routing_accuracy_from_feedback()
    
    return {
        "performance": perf_metrics,
        "domain_breakdown": domain_breakdown,
        "user_satisfaction": satisfaction,
        "ground_truth_accuracy": feedback_accuracy,
        "timestamp": time.time()
    }


# ── EXAMPLE: Health Monitoring Alert System ─────────────────────────────────

async def check_system_health():
    """
    Background task to monitor system health and alert if metrics drop
    """
    from evaluation.scorer import performance_tracker, feedback_analyzer
    
    # Get recent metrics
    metrics = performance_tracker.calculate_accuracy_metrics(time_window_hours=1)
    
    # Alert thresholds
    MIN_ROUTING_ACCURACY = 70.0  # Alert if < 70%
    MIN_AVG_CONFIDENCE = 60.0    # Alert if < 60%
    MIN_SUCCESS_RATE = 80.0      # Alert if < 80%
    
    alerts = []
    
    if metrics["routing_accuracy"] < MIN_ROUTING_ACCURACY:
        alerts.append({
            "severity": "high",
            "metric": "routing_accuracy",
            "value": metrics["routing_accuracy"],
            "threshold": MIN_ROUTING_ACCURACY,
            "message": f"Routing accuracy dropped to {metrics['routing_accuracy']}%"
        })
    
    if metrics["avg_confidence"] < MIN_AVG_CONFIDENCE:
        alerts.append({
            "severity": "medium",
            "metric": "avg_confidence",
            "value": metrics["avg_confidence"],
            "threshold": MIN_AVG_CONFIDENCE,
            "message": f"Average confidence dropped to {metrics['avg_confidence']}%"
        })
    
    if metrics["success_rate"] < MIN_SUCCESS_RATE:
        alerts.append({
            "severity": "high",
            "metric": "success_rate",
            "value": metrics["success_rate"],
            "threshold": MIN_SUCCESS_RATE,
            "message": f"Success rate dropped to {metrics['success_rate']}%"
        })
    
    if alerts:
        # Send alerts (email, Slack, etc.)
        print("🚨 SYSTEM HEALTH ALERTS:")
        for alert in alerts:
            print(f"  [{alert['severity'].upper()}] {alert['message']}")
    
    return alerts


# ── EXAMPLE: A/B Testing Support ────────────────────────────────────────────

@router.post("/query/ab-test")
async def handle_query_with_ab_test(request: QueryRequest, variant: str = "A"):
    """
    Support A/B testing of different prompt strategies
    Track which variant performs better
    """
    from evaluation.scorer import performance_tracker
    
    # Process query with different variants
    if variant == "A":
        # Use original prompt strategy
        answer = generate_answer(prompt_strategy_a)
    else:
        # Use experimental prompt strategy
        answer = generate_answer(prompt_strategy_b)
    
    # Log with variant tag
    performance_tracker.log_query_metrics(
        query_id=f"{session_id}_{variant}",
        domain=domain,
        confidence=confidence,
        response_time_ms=response_time_ms,
        success=True,
        user_feedback=f"variant_{variant}"
    )
    
    return answer
