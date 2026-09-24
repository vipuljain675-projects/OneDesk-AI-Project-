from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import enum
from config import DATABASE_URL

# ── Supabase PostgreSQL — only database, no SQLite fallback ──────────────────
print(f"[DB] Connecting to Supabase PostgreSQL...")
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,        # auto-reconnect on dropped connections
    pool_size=5,
    max_overflow=10,
)
print(f"[DB] ✅ Connected to Supabase successfully.")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# ─── Enums ────────────────────────────────────────────────────────────────────

class TicketStatus(str, enum.Enum):
    open = "open"
    in_progress = "in_progress"
    resolved = "resolved"

class TicketPriority(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"

class LeaveStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


# ─── Models ───────────────────────────────────────────────────────────────────

class ITTicket(Base):
    __tablename__ = "it_tickets"

    id = Column(Integer, primary_key=True, index=True)
    ticket_number = Column(String, unique=True, index=True)
    employee_id = Column(String, default="EMP001")           # hardcoded for hackathon
    issue_description = Column(Text)
    priority = Column(String, default="medium")
    status = Column(String, default="open")
    created_at = Column(DateTime, default=datetime.utcnow)


class LeaveRequest(Base):
    __tablename__ = "leave_requests"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(String, default="EMP001")
    leave_type = Column(String)                              # casual / sick / earned
    start_date = Column(String)
    end_date = Column(String)
    reason = Column(Text, nullable=True)
    status = Column(String, default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)


class RoomBooking(Base):
    __tablename__ = "room_bookings"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(String, default="EMP001")
    room_name = Column(String)
    booking_date = Column(String)
    time_slot = Column(String)
    purpose = Column(Text, nullable=True)
    status = Column(String, default="confirmed")
    created_at = Column(DateTime, default=datetime.utcnow)


class ExpenseClaim(Base):
    __tablename__ = "expense_claims"

    id = Column(Integer, primary_key=True, index=True)
    claim_number = Column(String, unique=True, index=True)      # FIN-XXXX
    employee_id = Column(String, default="EMP001", index=True)
    amount = Column(String)                                     # e.g. "₹4,200" or "4200"
    category = Column(String, default="General")                # Meals, Travel, Software, etc.
    expense_date = Column(String)                               # date of receipt
    description = Column(Text)
    status = Column(String, default="pending")                  # pending, approved, reimbursed, rejected
    created_at = Column(DateTime, default=datetime.utcnow)


class VisitorPass(Base):
    __tablename__ = "visitor_passes"

    id = Column(Integer, primary_key=True, index=True)
    pass_number = Column(String, unique=True, index=True)       # VIS-XXXX
    employee_id = Column(String, default="EMP001", index=True)  # host employee
    visitor_name = Column(String)
    visitor_email = Column(String, nullable=True)
    visit_date = Column(String)
    time_slot = Column(String)
    purpose = Column(Text, nullable=True)
    status = Column(String, default="issued")                   # issued, checked_in, expired, cancelled
    created_at = Column(DateTime, default=datetime.utcnow)


class CandidateReferral(Base):
    __tablename__ = "candidate_referrals"

    id = Column(Integer, primary_key=True, index=True)
    referral_number = Column(String, unique=True, index=True)   # REF-XXXX
    employee_id = Column(String, default="EMP001", index=True)
    candidate_name = Column(String)
    candidate_email = Column(String, nullable=True)
    role = Column(String)
    notes = Column(Text, nullable=True)
    status = Column(String, default="submitted")                # submitted, in_review, interviewing, hired, rejected
    created_at = Column(DateTime, default=datetime.utcnow)



class ConversationLog(Base):
    __tablename__ = "conversation_logs"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, index=True)
    user_query = Column(Text)
    domain_classified = Column(String)
    confidence_score = Column(Float)
    bot_response = Column(Text)
    source_cited = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class ChatThread(Base):
    __tablename__ = "chat_threads"

    id          = Column(Integer, primary_key=True, index=True)
    thread_id   = Column(String, unique=True, index=True)   # uuid
    employee_id = Column(String, default="EMP001", index=True)  # user email as ID
    user_email  = Column(String, nullable=True, index=True)     # explicit email column
    user_name   = Column(String, nullable=True)                 # user display name
    title       = Column(String, default="New Chat")
    created_at  = Column(DateTime, default=datetime.utcnow)
    updated_at  = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id          = Column(Integer, primary_key=True, index=True)
    thread_id   = Column(String, index=True)    # foreign ref to ChatThread.thread_id
    sender      = Column(String)                # "user" | "bot"
    text        = Column(Text)
    user_email  = Column(String, nullable=True) # who sent it (null for bot messages)
    user_name   = Column(String, nullable=True) # display name (null for bot messages)
    domain      = Column(String, nullable=True)
    confidence  = Column(Float, nullable=True)
    sources     = Column(Text, nullable=True)   # JSON string
    action_proposal = Column(Text, nullable=True)   # JSON string
    created_at  = Column(DateTime, default=datetime.utcnow)


# ─── OneDesk Users ────────────────────────────────────────────────────────────
# This is the main user registry — one row per person who logs in.
# Visible in Supabase sidebar as "onedesk_users"

class OneDeskUser(Base):
    __tablename__ = "onedesk_users"

    id            = Column(String, primary_key=True, index=True)  # UUID from Supabase Auth
    auth_user_id  = Column(String, nullable=True)                  # Supabase auth.users.id
    name          = Column(String, default="")                     # Display name e.g. "Vipul Jain"
    email         = Column(String, unique=True, index=True)        # vipul@gmail.com
    department    = Column(String, default="General")              # Product Engineering, HR etc.
    role          = Column(String, default="employee")             # employee | admin
    auth_provider = Column(String, default="email")               # google | azure | email
    created_at    = Column(DateTime, default=datetime.utcnow)


# ─── DB Init ──────────────────────────────────────────────────────────────────

def init_db():
    """Create all tables (safe — skips existing ones)."""
    Base.metadata.create_all(bind=engine)

    # ── Safe column migrations for existing tables ─────────────────────────────
    # These ALTER TABLE statements use IF NOT EXISTS so they're safe to run every time.
    migrations = [
        # chat_threads — add user identity columns
        "ALTER TABLE chat_threads ADD COLUMN IF NOT EXISTS user_email VARCHAR(255)",
        "ALTER TABLE chat_threads ADD COLUMN IF NOT EXISTS user_name  VARCHAR(255)",
        # chat_messages — add user identity columns
        "ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS user_email VARCHAR(255)",
        "ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS user_name  VARCHAR(255)",
        # chat_messages — add action_proposal column to persist ActionCard
        "ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS action_proposal TEXT",
    ]

    with engine.connect() as conn:
        for sql in migrations:
            try:
                conn.execute(text(sql))
            except Exception as e:
                print(f"[Migration] skipped: {e}")
        conn.commit()

    print("[DB] ✅ Migrations applied.")


def get_db():
    """FastAPI dependency — yields a DB session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
