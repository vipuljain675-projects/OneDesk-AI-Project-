"""
evaluation_routes.py
Endpoints for evaluation metrics, scoring, and feedback
"""
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime

from db.models import get_db, ConversationLog, ITTicket
from evaluation.scorer import query_evaluator, performance_tracker, feedback_analyzer

router = APIRouter()


# ── Request/Response Models ────────────────────────────────────────────────


class QueryEvaluationRequest(BaseModel):
    query: str


class QueryEvaluationResponse(BaseModel):
    quality_score: int
    issues: List[str]
    suggestions: List[str]
    has_question: bool
    has_technical_context: bool


class RoutingEvaluationRequest(BaseModel):
    domain: str
    confidence_score: float
    fallback_used: bool = False


class RoutingEvaluationResponse(BaseModel):
    domain: str
    confidence_score: float
    is_confident: bool
    fallback_used: bool
    routing_quality: str
    recommendation: Optional[str] = None


class ResponseQualityRequest(BaseModel):
    response_text: str
    query: str
    retrieved_docs: int = 0


class ResponseQualityResponse(BaseModel):
    response_length: int
    retrieved_docs: int
    has_steps: bool
    has_links: bool
    completeness_score: int


class FeedbackRequest(BaseModel):
    ticket_id: int
    query: str
    response: str
    rating: Optional[int] = None  # 1-5 stars
    was_helpful: Optional[bool] = None
    comments: Optional[str] = None
    routing_was_correct: Optional[bool] = None


class PerformanceMetricsRequest(BaseModel):
    query_id: str
    domain: str
    confidence: float
    response_time_ms: float
    success: bool
    user_feedback: Optional[str] = None


# ── Evaluation Endpoints ────────────────────────────────────────────────────


@router.post("/evaluate/query", response_model=QueryEvaluationResponse)
def evaluate_query(request: QueryEvaluationRequest):
    """
    Evaluate the quality of an incoming user query
    Returns quality score, issues, and suggestions
    """
    evaluation = query_evaluator.evaluate_query_quality(request.query)
    return QueryEvaluationResponse(**evaluation)


@router.post("/evaluate/routing", response_model=RoutingEvaluationResponse)
def evaluate_routing(request: RoutingEvaluationRequest):
    """
    Evaluate the confidence and quality of a routing decision
    """
    evaluation = query_evaluator.evaluate_routing_confidence(
        domain=request.domain,
        confidence_score=request.confidence_score,
        fallback_used=request.fallback_used
    )
    return RoutingEvaluationResponse(**evaluation)


@router.post("/evaluate/response", response_model=ResponseQualityResponse)
def evaluate_response(request: ResponseQualityRequest):
    """
    Evaluate the quality and completeness of a generated response
    """
    evaluation = query_evaluator.calculate_response_quality(
        response_text=request.response_text,
        query=request.query,
        retrieved_docs=request.retrieved_docs
    )
    return ResponseQualityResponse(**evaluation)


# ── Performance Tracking ────────────────────────────────────────────────────


@router.post("/metrics/log")
def log_performance_metrics(request: PerformanceMetricsRequest):
    """
    Log performance metrics for a query execution
    Used for tracking system performance over time
    """
    performance_tracker.log_query_metrics(
        query_id=request.query_id,
        domain=request.domain,
        confidence=request.confidence,
        response_time_ms=request.response_time_ms,
        success=request.success,
        user_feedback=request.user_feedback
    )
    return {"success": True, "message": "Metrics logged successfully"}


@router.get("/metrics/accuracy")
def get_accuracy_metrics(time_window_hours: int = 24):
    """
    Get accuracy metrics over a specified time window
    Returns routing accuracy, confidence, response times
    """
    metrics = performance_tracker.calculate_accuracy_metrics(time_window_hours)
    return metrics


@router.get("/metrics/domain-breakdown")
def get_domain_breakdown():
    """
    Get detailed breakdown of performance by domain
    """
    breakdown = performance_tracker.get_domain_breakdown()
    return breakdown


# ── Feedback Collection ─────────────────────────────────────────────────────


@router.post("/feedback")
def submit_feedback(request: FeedbackRequest):
    """
    Record user feedback on a query/response
    Used for continuous improvement and ground truth validation
    """
    feedback_analyzer.record_feedback(
        ticket_id=request.ticket_id,
        query=request.query,
        response=request.response,
        rating=request.rating,
        was_helpful=request.was_helpful,
        comments=request.comments,
        routing_was_correct=request.routing_was_correct
    )
    return {"success": True, "message": "Feedback recorded successfully"}


@router.get("/feedback/satisfaction")
def get_satisfaction_score():
    """
    Get overall user satisfaction score based on ratings
    """
    score = feedback_analyzer.calculate_satisfaction_score()
    return {
        "satisfaction_score": score,
        "out_of": 5
    }


@router.get("/feedback/routing-accuracy")
def get_feedback_routing_accuracy():
    """
    Get routing accuracy based on user feedback (ground truth)
    This is the real accuracy - what users say was correct
    """
    accuracy = feedback_analyzer.get_routing_accuracy_from_feedback()
    return {
        "routing_accuracy_from_feedback": accuracy,
        "description": "Accuracy based on user confirmation of correct routing"
    }


@router.get("/feedback/issues")
def get_common_issues():
    """
    Get common issues identified from negative feedback
    """
    issues = feedback_analyzer.identify_common_issues()
    return {
        "common_issues": issues,
        "count": len(issues)
    }


# ── Enhanced Analytics with Evaluation Data ─────────────────────────────────


@router.get("/enhanced-analytics")
def get_enhanced_analytics(db: Session = Depends(get_db)):
    """
    Get comprehensive analytics combining DB data + evaluation metrics
    This provides a richer view than the basic /analytics endpoint
    """
    # Get basic analytics from DB
    logs = db.query(ConversationLog).all()
    tickets = db.query(ITTicket).all()
    
    total_queries = len(logs)
    total_tickets = len(tickets)
    
    # Calculate domain distribution
    domain_counts = {}
    total_confidence = 0
    high_confidence_count = 0
    
    for log in logs:
        domain = log.domain_classified or "unknown"
        domain_counts[domain] = domain_counts.get(domain, 0) + 1
        total_confidence += log.confidence_score or 0
        if (log.confidence_score or 0) >= 0.75:
            high_confidence_count += 1
    
    avg_confidence = round(total_confidence / total_queries * 100, 1) if total_queries > 0 else 0
    routing_accuracy = round(high_confidence_count / total_queries * 100, 1) if total_queries > 0 else 0
    
    domain_breakdown = {
        domain: {
            "count": count,
            "percentage": round(count / total_queries * 100, 1) if total_queries > 0 else 0
        }
        for domain, count in domain_counts.items()
    }
    
    # Ensure all expected domains are present
    for expected_domain in ["IT", "HR", "Finance", "Facilities"]:
        if expected_domain not in domain_breakdown:
            domain_breakdown[expected_domain] = {"count": 0, "percentage": 0}
    
    # Get evaluation metrics
    perf_metrics = performance_tracker.calculate_accuracy_metrics(24)
    satisfaction = feedback_analyzer.calculate_satisfaction_score()
    feedback_accuracy = feedback_analyzer.get_routing_accuracy_from_feedback()
    
    # Calculate ticket resolution stats
    open_tickets = sum(1 for t in tickets if t.status.lower() == "open")
    in_progress_tickets = sum(1 for t in tickets if t.status.lower() == "in_progress")
    resolved_tickets = sum(1 for t in tickets if t.status.lower() == "resolved")
    
    return {
        "overview": {
            "total_queries": total_queries,
            "total_tickets": total_tickets,
            "routing_accuracy": routing_accuracy,
            "avg_confidence": avg_confidence,
            "high_confidence_count": high_confidence_count
        },
        "domain_breakdown": domain_breakdown,
        "ticket_status": {
            "open": open_tickets,
            "in_progress": in_progress_tickets,
            "resolved": resolved_tickets
        },
        "performance_metrics": {
            "avg_response_time_ms": perf_metrics.get("avg_response_time_ms", 0),
            "success_rate": perf_metrics.get("success_rate", 0)
        },
        "user_feedback": {
            "satisfaction_score": satisfaction,
            "routing_accuracy_from_feedback": feedback_accuracy
        },
        "system_info": {
            "model": "Groq LPU",
            "vector_db": "ChromaDB",
            "live_db": "Supabase PostgreSQL"
        }
    }


# ── Real-time Quality Monitoring ────────────────────────────────────────────


@router.get("/quality/recent-queries")
def get_recent_query_quality(db: Session = Depends(get_db), limit: int = 10):
    """
    Get quality evaluation for recent queries
    Useful for monitoring system performance in real-time
    """
    recent_logs = db.query(ConversationLog).order_by(
        ConversationLog.created_at.desc()
    ).limit(limit).all()
    
    evaluations = []
    for log in recent_logs:
        query_eval = query_evaluator.evaluate_query_quality(log.user_query)
        routing_eval = query_evaluator.evaluate_routing_confidence(
            domain=log.domain_classified or "unknown",
            confidence_score=log.confidence_score or 0
        )
        
        evaluations.append({
            "session_id": log.session_id,
            "query": log.user_query[:100] + "..." if len(log.user_query) > 100 else log.user_query,
            "domain": log.domain_classified,
            "timestamp": log.created_at.isoformat(),
            "query_quality": query_eval["quality_score"],
            "routing_quality": routing_eval["routing_quality"],
            "confidence": round(log.confidence_score * 100, 1) if log.confidence_score else 0
        })
    
    return {
        "recent_evaluations": evaluations,
        "count": len(evaluations)
    }


# ── Health Check ────────────────────────────────────────────────────────────


@router.get("/health")
def evaluation_health_check():
    """
    Check if evaluation system is functioning properly
    """
    return {
        "status": "healthy",
        "components": {
            "query_evaluator": "operational",
            "performance_tracker": "operational",
            "feedback_analyzer": "operational"
        },
        "metrics_cache_size": len(performance_tracker.metrics_cache),
        "feedback_store_size": len(feedback_analyzer.feedback_store)
    }
