# Evaluation Module

Scoring and metrics tracking for OneDesk IT Helpdesk.

## Files

- **scorer.py** - Query quality, routing evaluation, response quality
- **metrics.py** - Admin dashboard telemetry
- **evaluation_routes.py** - API endpoints

## Key Features

- Query quality scoring
- Routing accuracy tracking
- Response quality evaluation
- Performance metrics
- User feedback analysis

## API Endpoints

- POST /api/evaluate/query
- POST /api/evaluate/routing
- POST /api/evaluate/response
- POST /api/metrics/log
- GET /api/metrics/accuracy
- POST /api/feedback
- GET /api/enhanced-analytics
