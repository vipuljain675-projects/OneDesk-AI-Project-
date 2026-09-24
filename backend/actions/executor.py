"""
executor.py
Executes confirmed actions — writes to PostgreSQL and returns confirmation.
Called ONLY after user confirms the action in the frontend.
"""
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from sqlalchemy.orm import Session
from db.models import ITTicket, LeaveRequest, RoomBooking, ExpenseClaim, VisitorPass, CandidateReferral
from actions.tools import generate_ticket_id, generate_booking_id, generate_claim_id, generate_visitor_id, generate_referral_id


def execute_raise_ticket(db: Session, details: dict) -> dict:
    """Write IT ticket to PostgreSQL after user confirmation."""
    ticket_number = generate_ticket_id()

    ticket = ITTicket(
        ticket_number=ticket_number,
        employee_id=details.get("employee_id", "EMP001"),  # dynamic from logged-in user
        issue_description=details.get("issue_description", "General IT issue"),
        priority=details.get("priority", "medium"),
        status="open"
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)

    return {
        "success": True,
        "action": "raise_ticket",
        "ticket_number": ticket_number,
        "message": f"✅ IT Ticket **{ticket_number}** raised successfully! Priority: {ticket.priority}. Expected response: 2 hours.",
        "data": {
            "ticket_number": ticket_number,
            "issue": ticket.issue_description,
            "priority": ticket.priority,
            "status": "open"
        }
    }


def execute_apply_leave(db: Session, details: dict) -> dict:
    """Write leave request to PostgreSQL after user confirmation."""
    # Default leave_type to 'casual' if AI didn't extract it
    leave_type = (details.get("leave_type") or "casual").lower().strip()

    leave = LeaveRequest(
        employee_id=details.get("employee_id", "EMP001"),  # dynamic from logged-in user
        leave_type=leave_type,
        start_date=details.get("start_date", ""),
        end_date=details.get("end_date", ""),
        reason=details.get("reason") or "Personal",
        status="pending"
    )
    db.add(leave)
    db.commit()
    db.refresh(leave)

    display_type = (leave.leave_type or "casual").capitalize()
    return {
        "success": True,
        "action": "apply_leave",
        "message": f"✅ Leave request submitted! **{display_type} leave** from {leave.start_date} to {leave.end_date}. Status: Pending approval.",
        "data": {
            "leave_type": leave.leave_type,
            "start_date": leave.start_date,
            "end_date": leave.end_date,
            "status": "pending"
        }
    }


def execute_book_room(db: Session, details: dict) -> dict:
    """Write room booking to PostgreSQL after user confirmation."""
    booking_id = generate_booking_id()
    room = details.get("room_preference", "Conference Room A")

    booking = RoomBooking(
        employee_id=details.get("employee_id", "EMP001"),  # dynamic from logged-in user
        room_name=room,
        booking_date=details.get("booking_date", ""),
        time_slot=details.get("time_slot", ""),
        purpose=details.get("purpose", ""),
        status="confirmed"
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)

    return {
        "success": True,
        "action": "book_room",
        "booking_id": booking_id,
        "message": f"✅ **{room}** booked for {booking.booking_date} at {booking.time_slot}! Booking ID: {booking_id}.",
        "data": {
            "room": room,
            "date": booking.booking_date,
            "time_slot": booking.time_slot,
            "status": "confirmed"
        }
    }


def execute_submit_expense(db: Session, details: dict) -> dict:
    """Write expense claim to PostgreSQL after user confirmation."""
    claim_id = generate_claim_id()
    amount = str(details.get("amount", "₹0"))
    if not amount.startswith("₹") and not amount.startswith("$"):
        amount = f"₹{amount}"

    category = details.get("category") or "Meals & Entertainment"
    expense_date = details.get("expense_date") or "Recently"
    description = details.get("description") or "Business Expense"

    claim = ExpenseClaim(
        claim_number=claim_id,
        employee_id=details.get("employee_id", "EMP001"),
        amount=amount,
        category=category,
        expense_date=expense_date,
        description=description,
        status="pending"
    )
    db.add(claim)
    db.commit()
    db.refresh(claim)

    return {
        "success": True,
        "action": "submit_expense",
        "ticket_number": claim_id,
        "claim_id": claim_id,
        "message": f"✅ Expense Claim **{claim_id}** submitted for **{amount}** ({category})! Status: Pending Finance approval.",
        "data": {
            "claim_number": claim_id,
            "amount": amount,
            "category": category,
            "expense_date": expense_date,
            "description": description,
            "status": "pending"
        }
    }


def execute_request_visitor_pass(db: Session, details: dict) -> dict:
    """Write visitor badge to PostgreSQL after user confirmation."""
    pass_number = generate_visitor_id()
    visitor_name = details.get("visitor_name") or "Guest Visitor"
    visit_date = details.get("visit_date") or "Today"
    time_slot = details.get("time_slot") or "Regular Hours"
    purpose = details.get("purpose") or "Business Meeting"

    pass_obj = VisitorPass(
        pass_number=pass_number,
        employee_id=details.get("employee_id", "EMP001"),
        visitor_name=visitor_name,
        visitor_email=details.get("visitor_email") or "",
        visit_date=visit_date,
        time_slot=time_slot,
        purpose=purpose,
        status="issued"
    )
    db.add(pass_obj)
    db.commit()
    db.refresh(pass_obj)

    return {
        "success": True,
        "action": "request_visitor_pass",
        "ticket_number": pass_number,
        "pass_number": pass_number,
        "message": f"✅ Visitor Pass **{pass_number}** issued for **{visitor_name}** on {visit_date} ({time_slot})! Security badge registered.",
        "data": {
            "pass_number": pass_number,
            "visitor_name": visitor_name,
            "visit_date": visit_date,
            "time_slot": time_slot,
            "purpose": purpose,
            "status": "issued"
        }
    }


def execute_submit_referral(db: Session, details: dict) -> dict:
    """Write candidate referral to PostgreSQL after user confirmation."""
    referral_number = generate_referral_id()
    candidate_name = details.get("candidate_name") or "Candidate"
    role = details.get("role") or "Engineering Role"
    email = details.get("candidate_email") or ""
    notes = details.get("notes") or "Referred via OneDeskAI"

    referral = CandidateReferral(
        referral_number=referral_number,
        employee_id=details.get("employee_id", "EMP001"),
        candidate_name=candidate_name,
        candidate_email=email,
        role=role,
        notes=notes,
        status="submitted"
    )
    db.add(referral)
    db.commit()
    db.refresh(referral)

    return {
        "success": True,
        "action": "submit_referral",
        "ticket_number": referral_number,
        "referral_number": referral_number,
        "message": f"✅ Candidate Referral **{referral_number}** submitted for **{candidate_name}** ({role})! Talent Acquisition team notified.",
        "data": {
            "referral_number": referral_number,
            "candidate_name": candidate_name,
            "candidate_email": email,
            "role": role,
            "notes": notes,
            "status": "submitted"
        }
    }


# ─── Dispatcher ───────────────────────────────────────────────────────────────

def execute_action(action_type: str, details: dict, db: Session) -> dict:
    """Route to the correct executor function based on action_type."""
    executors = {
        "raise_ticket": execute_raise_ticket,
        "apply_leave": execute_apply_leave,
        "book_room": execute_book_room,
        "submit_expense": execute_submit_expense,
        "request_visitor_pass": execute_request_visitor_pass,
        "submit_referral": execute_submit_referral,
    }
    executor_fn = executors.get(action_type)
    if not executor_fn:
        return {"success": False, "message": f"Unknown action: {action_type}"}

    return executor_fn(db, details)

