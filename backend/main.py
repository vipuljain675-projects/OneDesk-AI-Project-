"""
main.py
FastAPI application entry point.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.query_routes import router as query_router
from api.action_routes import router as action_router
from api.ticket_routes import router as ticket_router
from api.evaluation_routes import router as evaluation_router
from api.threads_routes import router as threads_router
from api.user_routes import router as user_router
from db.models import init_db

app = FastAPI(
    title="OneDeskAI Backend",
    description="Multi-domain campus assistant with RAG + agentic actions",
    version="1.0.0"
)

# ── CORS — allow Next.js frontend ─────────────────────────────────────────────
ALLOWED_ORIGINS = [
    "https://one-desk-ai-project.vercel.app",
    "http://localhost:3000",
    "http://localhost:3001",
    "*",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # wildcard for hackathon; tighten post-launch
    allow_credentials=False,      # must be False when allow_origins=["*"]
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# ── Register routes ───────────────────────────────────────────────────────────
app.include_router(query_router, prefix="/api", tags=["Query"])
app.include_router(action_router, prefix="/api", tags=["Actions"])
app.include_router(ticket_router, prefix="/api", tags=["Admin"])
app.include_router(evaluation_router, prefix="/api", tags=["Evaluation"])
app.include_router(threads_router, prefix="/api", tags=["Threads"])
app.include_router(user_router, prefix="/api", tags=["Users"])


@app.on_event("startup")
async def startup():
    """Initialize DB tables and vector store on startup."""
    init_db()
    try:
        from db.vector_client import get_or_create_collection
        col = get_or_create_collection("handbook")
        count = col.count()
        print(f"📦 [ChromaDB] Handbook collection ready ({count} chunks available).")
    except Exception as e:
        print(f"⚠️ [Startup] Vector store notice: {e}")
    print("✅ OneDeskAI backend started. DB tables initialized.")


@app.get("/")
def health_check():
    return {"status": "ok", "message": "OneDeskAI backend is running 🚀"}
