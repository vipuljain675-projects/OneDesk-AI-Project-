"""
user_routes.py
POST /api/users/upsert  — Save or update a user's profile when they log in.
GET  /api/users         — List all registered users (admin view).
"""
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

import uuid
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime

from db.models import get_db, OneDeskUser

router = APIRouter()


class UpsertUserRequest(BaseModel):
    email: str
    name: str = ""
    department: str = "General"
    role: str = "employee"
    auth_provider: str = "email"   # "google" | "azure" | "email"
    auth_user_id: str = ""


@router.post("/users/upsert")
def upsert_user(req: UpsertUserRequest, db: Session = Depends(get_db)):
    """
    Called automatically on every login.
    Creates a new user row if email not seen before,
    or updates name/department if already exists.
    After this, the user appears in the 'onedesk_users' table in Supabase.
    """
    existing = db.query(OneDeskUser).filter(OneDeskUser.email == req.email).first()

    if existing:
        # Update name / department in case they changed
        existing.name = req.name or existing.name
        existing.department = req.department or existing.department
        existing.auth_provider = req.auth_provider
        db.commit()
        db.refresh(existing)
        return {
            "status": "updated",
            "user": {
                "id": existing.id,
                "name": existing.name,
                "email": existing.email,
                "department": existing.department,
                "role": existing.role,
            }
        }
    else:
        # New user — create row
        new_user = OneDeskUser(
            id=str(uuid.uuid4()),
            auth_user_id=req.auth_user_id or None,
            name=req.name,
            email=req.email,
            department=req.department,
            role=req.role,
            auth_provider=req.auth_provider,
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return {
            "status": "created",
            "user": {
                "id": new_user.id,
                "name": new_user.name,
                "email": new_user.email,
                "department": new_user.department,
                "role": new_user.role,
            }
        }


@router.get("/users")
def list_users(db: Session = Depends(get_db)):
    """List all registered OneDesk users."""
    users = db.query(OneDeskUser).order_by(OneDeskUser.created_at.desc()).all()
    return [
        {
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "department": u.department,
            "role": u.role,
            "auth_provider": u.auth_provider,
            "created_at": u.created_at.isoformat() + "+00:00",
        }
        for u in users
    ]
