# Evaluation System Usage Guide

## What is the Evaluation Module?

The evaluation module tracks and scores various aspects of the OneDesk system to ensure quality and accuracy. It powers the **Router Telemetry & Accuracy** dashboard that admin sees.

## What Gets Evaluated?

### 1. Query Quality (scorer.py)
When a user asks a question, we score:
- Is the query clear and complete? (quality_score 0-100)
- Does it have enough technical context?
- Are there issues that need clarification?

### 2. Routing Confidence (scorer.py)
When we route to IT/HR/Finance/Facilities:
- How confident is the AI model? (0-100%)
- Was routing direct or fallback?
- Should we ask for human review?

### 3. Response Quality (scorer.py)
When we generate an answer:
- Is the response complete? (completeness_score 0-100)
- Does it have step-by-step instructions?
- Are handbook references included?

### 4. Performance Tracking (scorer.py)
Track over time:
- Average response time
- Success rate
- Domain-wise accuracy
- Confidence scores

### 5. User Feedback (scorer.py)
Collect ground truth:
- Was the answer helpful? (thumbs up/down)
- Was routing correct? (yes/no)
- User rating (1-5 stars)
- Comments for improvement

## Admin Dashboard Integration

The **Router Telemetry & Accuracy** tab shows:

```
┌─────────────────────────────────────────────────┐
│  Multi-Domain Routing Distribution              │
│  ─────────────────────────────────────────────  │
│  IT:         45 queries (52.3%) ████████████    │
│  HR:         22 queries (25.6%) ████████        │
│  Finance:    12 queries (14.0%) ████            │
│  Facilities:  7 queries (8.1%)  ███             │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  AI Engine & Confidence Telemetry               │
│  ─────────────────────────────────────────────  │
│  Average Confidence Score:          95%         │
│  Direct Confident Routes:           18          │
│  Live Cloud Database:    Supabase PostgreSQL    │
└─────────────────────────────────────────────────┘
```

This data comes from:
- `metrics.py` → `calculate_full_analytics()`
- `/api/analytics` or `/api/enhanced-analytics` endpoint

## How to Use in Code

### Option 1: During Query Processing

```python
from evaluation.scorer import query_evaluator, performance_tracker

# Evaluate query
query_eval = query_evaluator.evaluate_query_quality(user_query)
print(f"Query quality: {query_eval['quality_score']}/100")

# Evaluate routing
routing_eval = query_evaluator.evaluate_routing_confidence(
    domain="IT",
    confidence_score=0.92,
    fallback_used=False
)
print(f"Routing quality: {routing_eval['routing_quality']}")

# Log performance
performance_tracker.log_query_metrics(
    query_id="abc123",
    domain="IT",
    confidence=0.92,
    response_time_ms=250,
    success=True
)
```

### Option 2: Via API Endpoints

```bash
# Evaluate a query
curl -X POST http://localhost:8000/api/evaluate/query \
  -H "Content-Type: application/json" \
  -d '{"query": "My laptop screen is flickering"}'

# Get enhanced analytics for dashboard
curl http://localhost:8000/api/enhanced-analytics

# Submit user feedback
curl -X POST http://localhost:8000/api/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "ticket_id": 123,
    "query": "How to reset password?",
    "response": "Follow these steps...",
    "rating": 5,
    "was_helpful": true,
    "routing_was_correct": true
  }'
```

## Metrics Explained

### Routing Accuracy
Percentage of queries routed with confidence >= 75%
- **95%+** = Excellent - system is performing well
- **85-94%** = Good - acceptable performance
- **75-84%** = Fair - may need improvements
- **< 75%** = Poor - review domain classifier

### Domain Distribution
Shows how queries are distributed across departments
- Helps identify which departments get most queries
- Used for resource allocation
- Displayed as bar chart in admin dashboard

### Confidence Score
AI model's confidence in routing decision (0-100%)
- **90%+** = Excellent confidence
- **75-89%** = High confidence
- **60-74%** = Medium confidence
- **< 60%** = Low confidence (may need clarification)

### Direct Confident Routes
Number of queries routed directly with high confidence (>= 75%)
- Higher is better
- Indicates clear, unambiguous queries
- No fallback routing needed

## Future Enhancements

1. **A/B Testing**: Test different prompts and measure impact
2. **Anomaly Detection**: Alert when metrics drop suddenly
3. **Personalization**: Learn from user preferences over time
4. **Auto-improvement**: Use feedback to retrain models
5. **Explainability**: Show why certain routing decisions were made
