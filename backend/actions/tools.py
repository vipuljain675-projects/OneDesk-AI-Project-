"""
tools.py
Defines available agentic tools (actions the agent can perform).
Each tool has: name, description, parameters schema, and the actual function.
"""
import random
import string
from datetime import datetime


def generate_ticket_id() -> str:
    suffix = ''.join(random.choices(string.digits, k=4))
    return f"IT-{suffix}"

def generate_claim_id() -> str:
    suffix = ''.join(random.choices(string.digits, k=4))
    return f"FIN-{suffix}"

def generate_booking_id() -> str:
    suffix = ''.join(random.choices(string.digits, k=4))
    return f"ROOM-{suffix}"

def generate_visitor_id() -> str:
    suffix = ''.join(random.choices(string.digits, k=4))
    return f"VIS-{suffix}"

def generate_referral_id() -> str:
    suffix = ''.join(random.choices(string.digits, k=4))
    return f"REF-{suffix}"


# ─── Tool Definitions (shown to LLM + used in confirmation UI) ────────────────

AVAILABLE_TOOLS = [
    {
        "name": "raise_ticket",
        "display_name": "Raise IT Ticket",
        "description": "Create an IT support ticket for the employee's issue",
        "domain": "IT",
        "parameters": {
            "issue_description": {"type": "string", "label": "Issue Description"},
            "priority": {"type": "enum", "options": ["low", "medium", "high"], "label": "Priority"}
        }
    },
    {
        "name": "apply_leave",
        "display_name": "Apply for Leave",
        "description": "Submit a leave request on behalf of the employee",
        "domain": "HR",
        "parameters": {
            "leave_type": {"type": "enum", "options": ["casual", "sick", "earned"], "label": "Leave Type"},
            "start_date": {"type": "string", "label": "Start Date"},
            "end_date": {"type": "string", "label": "End Date"},
            "reason": {"type": "string", "label": "Reason (optional)"}
        }
    },
    {
        "name": "book_room",
        "display_name": "Book Conference Room",
        "description": "Book a conference room for a meeting",
        "domain": "Facilities",
        "parameters": {
            "room_preference": {"type": "string", "label": "Room Preference"},
            "booking_date": {"type": "string", "label": "Date"},
            "time_slot": {"type": "string", "label": "Time Slot"},
            "purpose": {"type": "string", "label": "Purpose"}
        }
    },
    {
        "name": "submit_expense",
        "display_name": "Submit Expense Claim",
        "description": "File an expense reimbursement claim for Meals, Travel, Software, etc.",
        "domain": "Finance",
        "parameters": {
            "amount": {"type": "string", "label": "Amount (INR / USD)"},
            "category": {"type": "enum", "options": ["Meals & Entertainment", "Travel & Transport", "Software & Tools", "Office & Supplies"], "label": "Category"},
            "expense_date": {"type": "string", "label": "Expense Date"},
            "description": {"type": "string", "label": "Description"}
        }
    },
    {
        "name": "request_visitor_pass",
        "display_name": "Issue Campus Visitor Pass",
        "description": "Generate an enterprise security badge and guest entry pass",
        "domain": "Facilities",
        "parameters": {
            "visitor_name": {"type": "string", "label": "Visitor Name"},
            "visitor_email": {"type": "string", "label": "Visitor Email (optional)"},
            "visit_date": {"type": "string", "label": "Visit Date"},
            "time_slot": {"type": "string", "label": "Arrival Time Slot"},
            "purpose": {"type": "string", "label": "Meeting Purpose"}
        }
    },
    {
        "name": "submit_referral",
        "display_name": "Submit Candidate Referral",
        "description": "Refer a candidate for an open job position to the Talent Acquisition team",
        "domain": "HR",
        "parameters": {
            "candidate_name": {"type": "string", "label": "Candidate Name"},
            "candidate_email": {"type": "string", "label": "Candidate Email"},
            "role": {"type": "string", "label": "Role / Position"},
            "notes": {"type": "string", "label": "Experience & Notes"}
        }
    }
]



def get_tool_by_name(name: str) -> dict | None:
    return next((t for t in AVAILABLE_TOOLS if t["name"] == name), None)
