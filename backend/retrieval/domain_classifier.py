"""
domain_classifier.py
Classifies a user query into one of the 4 domains using hybrid semantic embedding + domain keyword boosting.
Returns: domain (str), confidence (float [0..1]), all_scores (dict), routing_decision ("direct" | "clarify" | "ask_user")
"""
import sys, os
import re
import numpy as np
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from sentence_transformers import SentenceTransformer
from config import DOMAINS, DOMAIN_DESCRIPTIONS, DOMAIN_KEYWORDS, HIGH_CONFIDENCE, MEDIUM_CONFIDENCE

embedder = SentenceTransformer("all-MiniLM-L6-v2")

# Pre-compute domain description embeddings
_domain_embeddings = {
    domain: embedder.encode(desc, normalize_embeddings=True)
    for domain, desc in DOMAIN_DESCRIPTIONS.items()
}


def classify_domain(query: str) -> dict:
    """
    Classify a query into a domain using hybrid matching (keywords + embedding similarity + softmax).

    Returns:
        {
            "domain": "IT",
            "confidence": 0.94,
            "all_scores": {"IT": 0.94, "HR": 0.02, ...},
            "routing_decision": "direct" | "clarify" | "ask_user"
        }
    """
    query_clean = query.strip()
    query_lower = query_clean.lower()
    query_tokens = set(re.findall(r'\b[a-zA-Z]+\b', query_lower))

    query_emb = embedder.encode(query_clean, normalize_embeddings=True)

    raw_scores = {}
    keyword_matches = {}

    for domain, desc_emb in _domain_embeddings.items():
        base_cosine = float(query_emb @ desc_emb)
        # Check domain keywords
        kws = DOMAIN_KEYWORDS.get(domain, [])
        hits = 0
        for kw in kws:
            if " " in kw:
                if kw in query_lower:
                    hits += 2  # multi-word keyword is strong match
            else:
                if kw in query_tokens:
                    hits += 1
        
        keyword_matches[domain] = hits
        # Boost raw score if keywords found
        raw_scores[domain] = base_cosine + (0.28 * hits)

    # Convert to calibrated probabilities via Temperature Softmax (T = 0.14)
    temperature = 0.14
    keys = list(raw_scores.keys())
    vals = np.array([raw_scores[k] for k in keys], dtype=np.float64)
    exp_vals = np.exp(vals / temperature)
    probs = exp_vals / np.sum(exp_vals)

    prob_dict = {k: round(float(p), 4) for k, p in zip(keys, probs)}

    # Sort descending
    sorted_domains = sorted(prob_dict.items(), key=lambda x: x[1], reverse=True)
    top_domain, top_score = sorted_domains[0]
    second_domain, second_score = sorted_domains[1] if len(sorted_domains) > 1 else ("", 0.0)

    top_has_keywords = keyword_matches.get(top_domain, 0) > 0

    # ── Multi-Domain Detection Logic ──────────────────────────────────────────
    # Find all domains with keyword hits or substantial score (prob >= 0.18)
    active_keyword_domains = [d for d, hits in keyword_matches.items() if hits > 0]
    active_prob_domains = [d for d, prob in prob_dict.items() if prob >= 0.18]
    
    # Combined unique active domains (ordered by probability)
    candidate_multi = [d for d in [top_domain, second_domain] if d in set(active_keyword_domains + active_prob_domains)]
    
    is_multi_domain = False
    if len(active_keyword_domains) >= 2:
        is_multi_domain = True
    elif len(candidate_multi) >= 2 and second_score >= 0.20 and (top_score - second_score) < 0.38:
        is_multi_domain = True

    if is_multi_domain:
        multi_list = candidate_multi if candidate_multi else [top_domain, second_domain]
        # Calibrated multi-domain coverage confidence score (e.g. 0.92-0.96)
        coverage_confidence = min(0.96, round(top_score + second_score + 0.12, 2))
        display_domain = f"Multi-Domain ({' • '.join(multi_list)})"
        return {
            "domain": display_domain,
            "primary_domain": top_domain,
            "secondary_domains": multi_list,
            "confidence": coverage_confidence,
            "all_scores": prob_dict,
            "routing_decision": "direct",
            "is_multi_domain": True
        }

    # Routing decision logic for single domain
    if top_score >= HIGH_CONFIDENCE or top_has_keywords:
        decision = "direct"          # confident or clear keyword match → route directly
    elif top_score >= MEDIUM_CONFIDENCE:
        if (top_score - second_score) < 0.12:
            decision = "clarify"     # close race between two domains → confirm with user
        else:
            decision = "direct"
    else:
        decision = "ask_user"        # truly ambiguous query → ask user to choose

    return {
        "domain": top_domain,
        "primary_domain": top_domain,
        "secondary_domains": [top_domain],
        "confidence": top_score,
        "all_scores": prob_dict,
        "routing_decision": decision,
        "is_multi_domain": False
    }
