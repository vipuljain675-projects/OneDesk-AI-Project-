"""
auth/middleware.py
──────────────────
JWT Authentication middleware using Supabase.

HOW IT WORKS (Simple explanation):
===================================

1. User logs in on frontend via Google/Microsoft/Email
2. Supabase deta hai ek JWT Token (encoded string)
3. Frontend har API call mein yeh token bhejta hai:
      Headers: { "Authorization": "Bearer eyJhbGci..." }
4. YEH FILE (middleware.py) woh token pakadti hai
5. SUPABASE_JWT_SECRET se verify karti hai (tamper check)
6. Token se real user email nikaalti hai
7. Agar token galat/expire → 401 Unauthorized return karta hai
8. Agar sahi → verified email return karta hai → route use karta hai

TWO MODES:
- require_auth  → Token MUST hona chahiye (strict)
- optional_auth → Token optional hai (admin console ke liye)
"""

import jwt
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from fastapi import HTTPException, Header
from config import SUPABASE_JWT_SECRET


def _decode_token(token: str) -> dict:
    """
    Supabase JWT token ko decode aur verify karo.

    Supabase JWT mein kya hota hai:
    {
      "sub": "uuid-of-user",        ← user ka unique ID
      "email": "vipul@gmail.com",   ← user ka email
      "role": "authenticated",       ← Supabase role
      "exp": 1728050000             ← expiry timestamp
    }

    PyJWT library SUPABASE_JWT_SECRET se signature verify karta hai.
    Agar koi hacker token tamper kare → signature mismatch → error!
    """
    if not SUPABASE_JWT_SECRET:
        # JWT secret .env mein nahi hai — skip verification (dev mode)
        print("⚠️  [Auth] SUPABASE_JWT_SECRET not set — skipping JWT verification (dev mode)")
        # Minimal decode without verification for dev
        import base64, json as _json
        try:
            payload_b64 = token.split(".")[1]
            # Add padding if needed
            payload_b64 += "=" * (4 - len(payload_b64) % 4)
            payload = _json.loads(base64.urlsafe_b64decode(payload_b64))
            return payload
        except Exception:
            raise HTTPException(status_code=401, detail="Invalid token format")

    try:
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False}  # Supabase audience check skip
        )
        return payload

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=401,
            detail="Session expired. Please login again."
        )
    except jwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=401,
            detail=f"Invalid token: {str(e)}"
        )


async def require_auth(authorization: str = Header(default=None)) -> dict:
    """
    FastAPI Dependency — STRICT mode.
    Token MUST hona chahiye, warna 401.

    Routes jahan use hoga:
    - POST /api/query
    - GET/POST /api/threads
    - DELETE /api/messages/{id}

    Usage in route:
        @router.post("/query")
        async def handle_query(
            request: QueryRequest,
            current_user: dict = Depends(require_auth)
        ):
            verified_email = current_user["email"]
    """
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Authorization header missing. Please login first."
        )

    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Invalid authorization format. Expected: 'Bearer <token>'"
        )

    token = authorization[len("Bearer "):]
    payload = _decode_token(token)

    # Email nikalo token se
    email = payload.get("email") or payload.get("sub", "")
    if not email:
        raise HTTPException(status_code=401, detail="Token does not contain user email.")

    return {
        "email": email,
        "user_id": payload.get("sub", ""),
        "role": payload.get("role", "authenticated"),
    }


async def optional_auth(authorization: str = Header(default=None)) -> dict | None:
    """
    FastAPI Dependency — OPTIONAL mode.
    Token nahi hai toh bhi chalega (returns None).
    Admin console ke liye — admin ke paas Supabase token nahi hota.

    Usage in route:
        @router.get("/threads")
        async def list_threads(
            current_user: dict | None = Depends(optional_auth)
        ):
            if current_user:
                # Logged-in user — use their email
                email = current_user["email"]
            else:
                # Admin or unauthenticated — use query param
                email = employee_id_from_query
    """
    if not authorization or not authorization.startswith("Bearer "):
        return None  # No token — that's OK for optional routes

    token = authorization[len("Bearer "):]
    try:
        payload = _decode_token(token)
        email = payload.get("email") or payload.get("sub", "")
        return {
            "email": email,
            "user_id": payload.get("sub", ""),
            "role": payload.get("role", "authenticated"),
        }
    except HTTPException:
        return None  # Invalid token — treat as unauthenticated
