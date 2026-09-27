"""
answer_generator.py
Calls Groq API to generate answers.
Now includes per-call latency tracking and token usage logging.
"""
import json
import time
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from groq import Groq
from config import GROQ_API_KEY, GROQ_MODEL

client = Groq(api_key=GROQ_API_KEY)

# ── In-memory telemetry store (resets on server restart) ─────────────────────
# For a production system this would write to a DB/monitoring table.
_telemetry: list[dict] = []

# Groq Llama pricing (approximate, per 1M tokens as of 2024)
# https://console.groq.com/settings/billing
_COST_PER_1M_INPUT_TOKENS  = 0.05   # USD ~$0.05 per 1M input tokens
_COST_PER_1M_OUTPUT_TOKENS = 0.08   # USD ~$0.08 per 1M output tokens


def _log_call(call_type: str, latency_ms: float, usage):
    """
    Record telemetry for one Groq API call.

    Args:
        call_type: 'answer_generation' | 'action_detection'
        latency_ms: wall-clock time in milliseconds
        usage: Groq CompletionUsage object (prompt_tokens, completion_tokens, total_tokens)
    """
    prompt_tokens     = getattr(usage, "prompt_tokens", 0)
    completion_tokens = getattr(usage, "completion_tokens", 0)
    total_tokens      = getattr(usage, "total_tokens", 0)

    # Estimated cost in USD
    cost_usd = (
        (prompt_tokens     / 1_000_000) * _COST_PER_1M_INPUT_TOKENS +
        (completion_tokens / 1_000_000) * _COST_PER_1M_OUTPUT_TOKENS
    )

    entry = {
        "call_type":          call_type,
        "model":              GROQ_MODEL,
        "latency_ms":         round(latency_ms, 2),
        "prompt_tokens":      prompt_tokens,
        "completion_tokens":  completion_tokens,
        "total_tokens":       total_tokens,
        "estimated_cost_usd": round(cost_usd, 6),
    }
    _telemetry.append(entry)

    # Print to server console so it shows in Uvicorn logs
    print(
        f"[Telemetry] {call_type} | "
        f"latency={latency_ms:.0f}ms | "
        f"tokens={total_tokens} (in={prompt_tokens}, out={completion_tokens}) | "
        f"cost≈${cost_usd:.5f}"
    )
    return entry


def get_telemetry_summary() -> dict:
    """
    Return aggregate stats across all calls since server start.
    Exposed via GET /api/telemetry endpoint.
    """
    if not _telemetry:
        return {"total_calls": 0}

    total_calls       = len(_telemetry)
    total_tokens      = sum(e["total_tokens"]      for e in _telemetry)
    total_cost_usd    = sum(e["estimated_cost_usd"] for e in _telemetry)
    avg_latency_ms    = sum(e["latency_ms"]         for e in _telemetry) / total_calls
    max_latency_ms    = max(e["latency_ms"]         for e in _telemetry)
    answer_calls      = [e for e in _telemetry if e["call_type"] == "answer_generation"]
    action_calls      = [e for e in _telemetry if e["call_type"] == "action_detection"]

    return {
        "total_calls":          total_calls,
        "answer_gen_calls":     len(answer_calls),
        "action_detect_calls":  len(action_calls),
        "total_tokens_used":    total_tokens,
        "total_cost_usd":       round(total_cost_usd, 4),
        "avg_latency_ms":       round(avg_latency_ms, 1),
        "max_latency_ms":       round(max_latency_ms, 1),
        "recent_calls":         _telemetry[-5:],   # last 5 calls
    }


def generate_answer(prompt: str) -> dict:
    """
    Send a prompt to Groq and return the answer text + telemetry.
    Now returns a dict: { "answer": str, "telemetry": dict }
    """
    t0 = time.time()
    response = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,      # low temp = factual, grounded answers
        max_tokens=1024,
    )
    latency_ms = (time.time() - t0) * 1000

    answer = response.choices[0].message.content.strip()
    telemetry = _log_call("answer_generation", latency_ms, response.usage)

    return {"answer": answer, "telemetry": telemetry}


def detect_action_intent(prompt: str) -> dict:
    """
    Send action detection prompt to Groq.
    Returns parsed JSON dict with intent_type and details.
    Latency and tokens are also tracked internally.
    """
    try:
        t0 = time.time()
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": "You are an enterprise action intent classifier. You always output valid RFC 8259 JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.0,      # deterministic for intent detection
            max_tokens=800,
            response_format={"type": "json_object"}
        )
        latency_ms = (time.time() - t0) * 1000
        _log_call("action_detection", latency_ms, response.usage)

        raw = response.choices[0].message.content.strip()
        # Strip markdown fences if present
        if raw.startswith("```"):
            lines = raw.split("\n")
            raw = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
        try:
            return json.loads(raw)
        except json.JSONDecodeError as je:
            print(f"⚠️ [detect_action_intent] JSONDecodeError: {je} | Raw: {raw[:150]}")
            return {"intent_type": "query", "details": {}}
    except Exception as e:
        print(f"⚠️ [detect_action_intent] Groq API Exception: {e}")
        # Secondary fallback without response_format if Groq validator had an issue
        try:
            fb_resp = client.chat.completions.create(
                model=GROQ_MODEL,
                messages=[{"role": "user", "content": prompt + "\nOutput valid JSON object only."}],
                temperature=0.0,
                max_tokens=600,
            )
            fb_raw = fb_resp.choices[0].message.content.strip()
            import re
            m = re.search(r"\{.*\}", fb_raw, re.DOTALL)
            if m:
                return json.loads(m.group(0))
        except Exception as fb_err:
            print(f"⚠️ [detect_action_intent] Fallback also failed: {fb_err}")
        return {"intent_type": "query", "details": {}}

