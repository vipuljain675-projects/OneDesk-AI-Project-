"""
Evaluation and Scoring System for OneDesk
Tracks query quality, routing accuracy, and response metrics
"""

from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
import json


class QueryEvaluator:
    """Evaluates query quality and routing decisions"""
    
    def __init__(self):
        self.confidence_threshold = 0.75
        self.min_query_length = 10
    
    def evaluate_query_quality(self, query: str) -> Dict[str, any]:
        """
        Evaluate the quality of an incoming user query
        
        Returns:
            dict with quality_score, issues, and suggestions
        """
        quality_score = 100
        issues = []
        suggestions = []
        
        # Length check
        if len(query.strip()) < self.min_query_length:
            quality_score -= 30
            issues.append("Query too short")
            suggestions.append("Provide more details about your issue")
        
        # Has question words
        question_words = ["what", "how", "why", "when", "where", "who", "can", "is", "does"]
        has_question = any(word in query.lower() for word in question_words)
        
        # Has technical terms (positive indicator)
        tech_terms = ["password", "access", "error", "login", "system", "network", "email", "vpn", "software"]
        has_tech_term = any(term in query.lower() for term in tech_terms)
        
        if has_tech_term:
            quality_score += 10
        
        # Check for complete sentences
        if not query.strip().endswith((".", "?", "!")):
            quality_score -= 5
            suggestions.append("End with proper punctuation for clarity")
        
        # Check for excessive caps
        if query.isupper() and len(query) > 20:
            quality_score -= 10
            issues.append("Excessive use of capital letters")
        
        return {
            "quality_score": max(0, min(100, quality_score)),
            "issues": issues,
            "suggestions": suggestions,
            "has_question": has_question,
            "has_technical_context": has_tech_term
        }
    
    def evaluate_routing_confidence(
        self, 
        domain: str, 
        confidence_score: float, 
        fallback_used: bool = False
    ) -> Dict[str, any]:
        """
        Evaluate the confidence of routing decision
        
        Args:
            domain: Predicted domain (IT, HR, Finance, Facilities)
            confidence_score: Model confidence (0-1)
            fallback_used: Whether fallback routing was used
        
        Returns:
            dict with routing evaluation metrics
        """
        evaluation = {
            "domain": domain,
            "confidence_score": round(confidence_score * 100, 2),
            "is_confident": confidence_score >= self.confidence_threshold,
            "fallback_used": fallback_used,
            "routing_quality": "high"
        }
        
        # Determine routing quality
        if confidence_score >= 0.9:
            evaluation["routing_quality"] = "excellent"
        elif confidence_score >= 0.75:
            evaluation["routing_quality"] = "high"
        elif confidence_score >= 0.6:
            evaluation["routing_quality"] = "medium"
        else:
            evaluation["routing_quality"] = "low"
        
        # Add recommendations
        if confidence_score < self.confidence_threshold:
            evaluation["recommendation"] = "Consider manual review or ask clarifying questions"
        
        if fallback_used:
            evaluation["recommendation"] = "Fallback routing used - review for accuracy"
        
        return evaluation
    
    def calculate_response_quality(
        self, 
        response_text: str, 
        query: str,
        retrieved_docs: int = 0
    ) -> Dict[str, any]:
        """
        Evaluate the quality of generated response
        
        Args:
            response_text: Generated response text
            query: Original user query
            retrieved_docs: Number of documents retrieved for RAG
        
        Returns:
            dict with response quality metrics
        """
        quality_metrics = {
            "response_length": len(response_text),
            "retrieved_docs": retrieved_docs,
            "has_steps": False,
            "has_links": False,
            "completeness_score": 0
        }
        
        # Check for structured response
        step_indicators = ["1.", "2.", "step", "first", "then", "next", "finally"]
        quality_metrics["has_steps"] = any(indicator in response_text.lower() for indicator in step_indicators)
        
        # Check for reference links
        quality_metrics["has_links"] = "http" in response_text or "handbook" in response_text.lower()
        
        # Calculate completeness score
        completeness = 50  # Base score
        
        if quality_metrics["response_length"] > 100:
            completeness += 10
        if quality_metrics["response_length"] > 300:
            completeness += 10
        
        if quality_metrics["has_steps"]:
            completeness += 15
        
        if quality_metrics["has_links"]:
            completeness += 10
        
        if retrieved_docs > 0:
            completeness += min(retrieved_docs * 5, 15)
        
        quality_metrics["completeness_score"] = min(100, completeness)
        
        return quality_metrics


class PerformanceTracker:
    """Tracks system performance metrics over time"""
    
    def __init__(self):
        self.metrics_cache: List[Dict] = []
    
    def log_query_metrics(
        self,
        query_id: str,
        domain: str,
        confidence: float,
        response_time_ms: float,
        success: bool,
        user_feedback: Optional[str] = None
    ):
        """Log metrics for a single query"""
        metric = {
            "query_id": query_id,
            "timestamp": datetime.now().isoformat(),
            "domain": domain,
            "confidence": confidence,
            "response_time_ms": response_time_ms,
            "success": success,
            "user_feedback": user_feedback
        }
        self.metrics_cache.append(metric)
    
    def calculate_accuracy_metrics(self, time_window_hours: int = 24) -> Dict[str, any]:
        """
        Calculate accuracy metrics over a time window
        
        Args:
            time_window_hours: Hours to look back for metrics
        
        Returns:
            dict with accuracy statistics
        """
        cutoff_time = datetime.now() - timedelta(hours=time_window_hours)
        
        recent_metrics = [
            m for m in self.metrics_cache 
            if datetime.fromisoformat(m["timestamp"]) > cutoff_time
        ]
        
        if not recent_metrics:
            return {
                "total_queries": 0,
                "routing_accuracy": 0.0,
                "avg_confidence": 0.0,
                "avg_response_time_ms": 0.0,
                "success_rate": 0.0
            }
        
        total = len(recent_metrics)
        successful = sum(1 for m in recent_metrics if m["success"])
        
        # Calculate domain-wise accuracy
        domain_counts = {}
        for metric in recent_metrics:
            domain = metric["domain"]
            domain_counts[domain] = domain_counts.get(domain, 0) + 1
        
        return {
            "total_queries": total,
            "routing_accuracy": round((successful / total) * 100, 2) if total > 0 else 0.0,
            "avg_confidence": round(
                sum(m["confidence"] for m in recent_metrics) / total * 100, 2
            ) if total > 0 else 0.0,
            "avg_response_time_ms": round(
                sum(m["response_time_ms"] for m in recent_metrics) / total, 2
            ) if total > 0 else 0.0,
            "success_rate": round((successful / total) * 100, 2) if total > 0 else 0.0,
            "domain_distribution": domain_counts
        }
    
    def get_domain_breakdown(self) -> Dict[str, Dict[str, any]]:
        """Get detailed breakdown by domain"""
        domains = {}
        
        for metric in self.metrics_cache:
            domain = metric["domain"]
            if domain not in domains:
                domains[domain] = {
                    "count": 0,
                    "successful": 0,
                    "avg_confidence": 0.0,
                    "confidences": []
                }
            
            domains[domain]["count"] += 1
            if metric["success"]:
                domains[domain]["successful"] += 1
            domains[domain]["confidences"].append(metric["confidence"])
        
        # Calculate averages
        total_queries = len(self.metrics_cache)
        
        for domain, data in domains.items():
            data["percentage"] = round((data["count"] / total_queries) * 100, 1) if total_queries > 0 else 0
            data["accuracy"] = round((data["successful"] / data["count"]) * 100, 1) if data["count"] > 0 else 0
            data["avg_confidence"] = round(
                sum(data["confidences"]) / len(data["confidences"]) * 100, 1
            ) if data["confidences"] else 0
            del data["confidences"]  # Remove raw data
        
        return domains


class FeedbackAnalyzer:
    """Analyzes user feedback to improve system"""
    
    def __init__(self):
        self.feedback_store: List[Dict] = []
    
    def record_feedback(
        self,
        ticket_id: int,
        query: str,
        response: str,
        rating: Optional[int] = None,  # 1-5 stars
        was_helpful: Optional[bool] = None,
        comments: Optional[str] = None,
        routing_was_correct: Optional[bool] = None
    ):
        """Record user feedback on a response"""
        feedback = {
            "ticket_id": ticket_id,
            "timestamp": datetime.now().isoformat(),
            "query": query,
            "response": response,
            "rating": rating,
            "was_helpful": was_helpful,
            "comments": comments,
            "routing_was_correct": routing_was_correct
        }
        self.feedback_store.append(feedback)
    
    def calculate_satisfaction_score(self) -> float:
        """Calculate overall user satisfaction score"""
        ratings = [f["rating"] for f in self.feedback_store if f["rating"] is not None]
        
        if not ratings:
            return 0.0
        
        return round(sum(ratings) / len(ratings), 2)
    
    def get_routing_accuracy_from_feedback(self) -> float:
        """
        Calculate routing accuracy based on user feedback
        (Ground truth validation)
        """
        routing_feedback = [
            f for f in self.feedback_store 
            if f["routing_was_correct"] is not None
        ]
        
        if not routing_feedback:
            return 0.0
        
        correct = sum(1 for f in routing_feedback if f["routing_was_correct"])
        return round((correct / len(routing_feedback)) * 100, 2)
    
    def identify_common_issues(self) -> List[Dict[str, any]]:
        """Identify common issues from feedback comments"""
        negative_feedback = [
            f for f in self.feedback_store 
            if f["rating"] and f["rating"] <= 2 or not f["was_helpful"]
        ]
        
        issues = []
        for feedback in negative_feedback:
            if feedback["comments"]:
                issues.append({
                    "ticket_id": feedback["ticket_id"],
                    "timestamp": feedback["timestamp"],
                    "comment": feedback["comments"],
                    "rating": feedback["rating"]
                })
        
        return issues


# Global instances
query_evaluator = QueryEvaluator()
performance_tracker = PerformanceTracker()
feedback_analyzer = FeedbackAnalyzer()
