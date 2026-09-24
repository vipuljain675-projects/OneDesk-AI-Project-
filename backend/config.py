import os
from pathlib import Path
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

# Groq
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")

# Database (Supabase PostgreSQL only — no SQLite fallback)
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL not configured! Supabase PostgreSQL connection required.")

# Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "")

# ChromaDB
CHROMA_PERSIST_DIR = os.getenv("CHROMA_PERSIST_DIR", "./chroma_store")

# Domains
DOMAINS = ["IT", "HR", "Finance", "Facilities"]

DOMAIN_DESCRIPTIONS = {
    "IT": "Information Technology and computer technical support: troubleshooting laptop, desktop computer, screen flickering, display monitor, keyboard, trackpad, battery charging, hardware defects, VPN access, WiFi network connection, software installation, password reset, account lockout, IT support ticket, system crash, virus, driver update, corporate devices, Outlook, Teams.",
    "HR": "Human Resources and employee policies: employee leaves, paid time off, PTO, casual leave, sick leave, maternity leave, paternity leave, salary, compensation, payroll, health insurance, provident fund, performance appraisal, hiring, onboarding, resignation, workplace policies, working hours, remote work.",
    "Finance": "Finance, accounting and expense management: employee expense reports, travel reimbursements, client dinner, food allowance claims, corporate credit card, invoice processing, financial budgets, vendor payments, GST, tax deductions, per diem claims, bills, payment receipts.",
    "Facilities": "Campus and office facilities management: meeting room reservation, desk booking, hot desking, conference room, parking spot, visitor pass, office air conditioning, AC heating, office cleaning, cafeteria meals, building access, security badge, RFID card, physical maintenance."
}

DOMAIN_KEYWORDS = {
    "IT": [
        "laptop", "screen", "flicker", "flickering", "display", "monitor", "vpn", "wifi", "network",
        "password", "login", "hardware", "software", "mouse", "keyboard", "crash", "driver", "ticket",
        "it support", "system", "device", "printer", "reboot", "restart", "install", "installation",
        "macbook", "windows", "bug", "terminal", "computer", "audio", "mic", "webcam", "charger"
    ],
    "HR": [
        "leave", "leaves", "vacation", "holiday", "sick", "salary", "payroll", "maternity", "paternity",
        "resignation", "notice period", "appraisal", "insurance", "policy", "hr", "benefits", "hiring",
        "onboarding", "pf", "provident fund", "relieving", "pto", "wfh", "work from home", "attendance"
    ],
    "Finance": [
        "expense", "expenses", "reimburse", "reimbursed", "reimbursement", "invoice", "receipt", "allowance",
        "per diem", "tax", "gst", "tds", "budget", "finance", "bill", "bills", "claim", "claims",
        "corporate card", "travel expense", "payment", "payout", "cost"
    ],
    "Facilities": [
        "room", "conference", "desk", "seat", "parking", "cafeteria", "canteen", "ac", "air condition",
        "air conditioning", "temperature", "light", "cleaning", "facility", "facilities", "building",
        "badge", "id card", "door", "meeting room", "cab", "transport"
    ]
}

# Confidence thresholds (calibrated via temperature softmax)
HIGH_CONFIDENCE = 0.55    # Route directly
MEDIUM_CONFIDENCE = 0.38  # Route but ask to confirm domain if ambiguous
LOW_CONFIDENCE = 0.38     # Ask user to clarify domain
