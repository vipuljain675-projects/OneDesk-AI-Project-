"""
answer_generator.py
Calls Groq API (Llama 3.3 70B) to generate answers.
"""
import json
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from groq import Groq
from config import GROQ_API_KEY, GROQ_MODEL

client = Groq(api_key=GROQ_API_KEY)


def generate_answer(prompt: str) -> str:
    """
    Send a prompt to Groq and return the answer text.
    Used for: RAG answer generation.
    """
    response = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,      # low temp = factual, grounded answers
        max_tokens=1024,
    )
    return response.choices[0].message.content.strip()


def detect_action_intent(prompt: str) -> dict:
    """
    Send action detection prompt to Groq.
    Returns parsed JSON dict with intent_type and details.
    """
    try:
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.0,      # deterministic for intent detection
            max_tokens=1024,
            response_format={"type": "json_object"}
        )
        raw = response.choices[0].message.content.strip()
        try:
            return json.loads(raw)
        except json.JSONDecodeError as je:
            print(f"⚠️ [detect_action_intent] JSONDecodeError: {je} | Raw: {raw[:150]}")
            return {"intent_type": "query", "details": {}}
    except Exception as e:
        print(f"⚠️ [detect_action_intent] Groq API Exception: {e}")
        return {"intent_type": "query", "details": {}}
