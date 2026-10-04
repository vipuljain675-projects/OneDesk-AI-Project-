"""
run_benchmark.py
OneDesk AI — Training vs Testing Accuracy Benchmark.

KEY METRIC: Domain Routing Accuracy
  - RAG pipeline ka kaam = sahi domain mein sahi chunks retrieve karna.
  - LLM (GPT-120B) pre-trained hai, woh context se sahi answer khud deta hai.
  - Evaluation sirf routing accuracy pe hoti hai.

Training : Direct handbook queries  → expect 100% routing
Testing  : Ambiguous/multi-domain   → expect 90%+ routing
"""
import sys
import os
import time

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BACKEND_DIR)

from retrieval.domain_classifier import classify_domain
from retrieval.semantic_retriever import retrieve_chunks
from augmentation.prompt_builder import build_prompt
from generation.answer_generator import generate_answer

# ── TRAINING SET: Direct handbook queries (expect 100% routing) ────────────────
TRAINING_CASES = [
    {"query": "How many paid sick days do I get per year?",
     "expected_domain": ["HR"],                          "note": "HR sick leave policy"},
    {"query": "How do I submit a leave request in Workday?",
     "expected_domain": ["HR"],                          "note": "Workday leave submission"},
    {"query": "Where do I submit travel and meal expense claims?",
     "expected_domain": ["Finance"],                     "note": "Navan expense tool"},
    {"query": "What is GitLab parental leave duration and is it paid?",
     "expected_domain": ["HR"],                          "note": "Parental leave — 16 weeks paid"},
    {"query": "How do I book a meeting room or conference space?",
     "expected_domain": ["Facilities"],                  "note": "Room booking"},
    {"query": "What home office equipment can I expense?",
     "expected_domain": ["Finance"],                     "note": "Home office allowance"},
    {"query": "My laptop screen is cracked. How do I get IT support?",
     "expected_domain": ["IT"],                          "note": "IT hardware support"},
    {"query": "What is the process for resigning from GitLab?",
     "expected_domain": ["HR"],                          "note": "Resignation / offboarding"},
    {"query": "What is the meal reimbursement limit when I travel for work?",
     "expected_domain": ["Finance"],                     "note": "Meal reimbursement"},
    {"query": "How do I reset my SSO or Okta login credentials?",
     "expected_domain": ["IT"],                          "note": "SSO / Okta reset"},
]

# ── TESTING SET: Ambiguous / Multi-Domain / OOD (expect 90%+ routing) ──────────
TESTING_CASES = [
    {"query": "I accidentally broke my laptop. Will they deduct cost from my salary?",
     "expected_domain": ["IT", "HR", "Multi-Domain"],    "note": "Multi-domain: IT + HR"},
    {"query": "I am a new joiner. What should I set up in my first week?",
     "expected_domain": ["HR", "IT", "Multi-Domain"],    "note": "Onboarding: HR + IT"},
    {"query": "What is the current GitLab stock price?",
     "expected_domain": ["Finance"],                     "note": "OOD — graceful refusal"},
    {"query": "My screen is cracked. How do I get a replacement and claim the cost?",
     "expected_domain": ["IT", "Finance", "Multi-Domain"],"note": "Multi-domain: IT + Finance"},
    {"query": "Can I take casual leave and also claim travel expenses for a personal trip?",
     "expected_domain": ["HR", "Finance", "Multi-Domain"],"note": "Ambiguous: HR + Finance"},
    {"query": "We are planning an offsite for 40 people. What travel and venue rules apply?",
     "expected_domain": ["Finance", "Facilities", "HR", "Multi-Domain"], "note": "3-domain complex"},
    {"query": "I want to set up my home office. What equipment and what can I claim?",
     "expected_domain": ["IT", "Finance", "Multi-Domain"],"note": "Multi-domain: IT + Finance"},
    {"query": "What did the CEO say in the last board meeting?",
     "expected_domain": ["HR", "Finance"],               "note": "OOD — not in corpus"},
]


# ── Helpers ───────────────────────────────────────────────────────────────────
def domain_match(classified: str, expected_list: list) -> bool:
    c = classified.lower()
    return any(e.lower() in c for e in expected_list)


def run_set(cases: list, label: str) -> list:
    print(f"\n{'='*70}")
    print(f"  🔬 {label}")
    print(f"{'='*70}")
    results = []

    for i, case in enumerate(cases, 1):
        q     = case["query"]
        t0    = time.time()

        # Step 1 — Domain Classification (KEY METRIC)
        clf        = classify_domain(q)
        classified = clf.get("domain", "unknown")
        conf       = clf.get("confidence", 0.0)
        primary    = clf.get("primary", classified)
        routing_ok = domain_match(classified, case["expected_domain"])

        # Step 2 — Retrieve chunks (top_k=10, full text)
        domains_list = [d for d in ["HR","IT","Finance","Facilities"] if d.lower() in classified.lower()] or [primary]
        chunks = retrieve_chunks(
            q, classified, top_k=10,
            domains_list=domains_list if len(domains_list) > 1 else None
        )

        # Step 3 — Generate answer (informational only)
        try:
            target = primary if "Multi-Domain" not in classified else (domains_list[0] if domains_list else "HR")
            prompt = build_prompt(q, chunks, target, [])
            result = generate_answer(prompt)
            answer = result.get("answer", "") if isinstance(result, dict) else str(result)
        except Exception as e:
            answer = f"[Error: {e}]"

        latency = round(time.time() - t0, 2)
        status  = "✅" if routing_ok else "❌"
        top_src = chunks[0].get("filename", "?") if chunks else "no chunks"
        top_scr = chunks[0].get("score", 0)      if chunks else 0

        print(f"\n  [{i}/{len(cases)}] {q[:65]}")
        print(f"      Routed  → {classified[:35]} ({int(conf*100)}%)  {status}")
        print(f"      Source  → {top_src} (score={top_scr})")
        print(f"      Answer  → {answer[:160]}{'...' if len(answer)>160 else ''}")
        print(f"      Latency → {latency}s")

        results.append({
            "query":      q[:42] + "...",
            "expected":   "/".join(case["expected_domain"]),
            "classified": classified[:24],
            "conf":       conf,
            "routing":    1.0 if routing_ok else 0.0,
            "latency":    latency,
            "status":     status,
            "note":       case.get("note", ""),
        })
    return results


def print_summary(train_r: list, test_r: list):
    def pct(lst, key): return sum(x[key] for x in lst) / len(lst) * 100

    tr_routing = pct(train_r, "routing")
    te_routing = pct(test_r,  "routing")
    tr_pass    = sum(1 for r in train_r if r["status"] == "✅")
    te_pass    = sum(1 for r in test_r  if r["status"] == "✅")
    gap        = round(tr_routing - te_routing, 1)

    # ── Per-query table ────────────────────────────────────────────────────────
    print(f"\n{'='*90}")
    print(f"  {'#':<3} {'Query':<44} {'Expected':<18} {'Classified':<26} {'Route':<7} {'OK'}")
    print(f"  {'-'*87}")
    print("  📚 TRAINING CASES")
    for i, r in enumerate(train_r, 1):
        print(f"  {i:<3} {r['query']:<44} {r['expected']:<18} {r['classified']:<26} {int(r['routing']*100):>4}%   {r['status']}")
    print("  🧪 TESTING CASES")
    for i, r in enumerate(test_r, 1):
        print(f"  {i:<3} {r['query']:<44} {r['expected']:<18} {r['classified']:<26} {int(r['routing']*100):>4}%   {r['status']}")
    print(f"{'='*90}")

    # ── Final scoreboard ───────────────────────────────────────────────────────
    print(f"""
╔══════════════════════════════════════════════════════════════╗
║        ONEDESK AI — TRAINING vs TESTING ACCURACY            ║
║   224 GitLab Handbook Docs · MiniLM + ChromaDB + Groq LLM   ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║   📚 TRAINING  (Direct Handbook Queries)                     ║
║      Domain Routing Accuracy  :  {tr_routing:5.1f}%                 ║
║      Cases Passed             :  {tr_pass}/{len(train_r)}                        ║
║                                                              ║
║   🧪 TESTING   (Ambiguous / Multi-Domain / OOD)              ║
║      Domain Routing Accuracy  :  {te_routing:5.1f}%                 ║
║      Cases Passed             :  {te_pass}/{len(test_r)}                         ║
║                                                              ║
║   📈 Generalization Gap       :  {gap:5.1f}%  {'✅ Generalizes well' if abs(gap) < 15 else '⚠️  Review'}        ║
╚══════════════════════════════════════════════════════════════╝
""")

    # ── Save markdown report ───────────────────────────────────────────────────
    ts = time.strftime("%Y-%m-%d %H:%M:%S")
    md = f"""# OneDesk AI — Training vs Testing Accuracy Report

**Generated:** {ts}
**Corpus:** 224 GitLab Handbook Documents (HR · IT · Finance · Facilities)
**Stack:** SentenceTransformer all-MiniLM-L6-v2 · ChromaDB HNSW · Groq GPT-120B

---

## 📊 Summary

| Set | Domain Routing Accuracy | Cases Passed |
|:---|:---:|:---:|
| 📚 **Training** (Direct Handbook Queries) | **{tr_routing:.1f}%** | **{tr_pass}/{len(train_r)}** |
| 🧪 **Testing** (Ambiguous / Multi-Domain / OOD) | **{te_routing:.1f}%** | **{te_pass}/{len(test_r)}** |
| 📈 Generalization Gap | **{gap}%** {'✅' if abs(gap) < 15 else '⚠️'} | — |

---

## 📚 Training Cases

| # | Query | Expected | Classified | Routing | Status |
|:-:|:---|:---:|:---:|:---:|:---:|
"""
    for i, r in enumerate(train_r, 1):
        md += f"| {i} | {r['query']} | {r['expected']} | {r['classified']} | {int(r['routing']*100)}% | {r['status']} |\n"

    md += """
---

## 🧪 Testing Cases (Ambiguous / Multi-Domain / OOD)

| # | Query | Expected | Classified | Routing | Status |
|:-:|:---|:---:|:---:|:---:|:---:|
"""
    for i, r in enumerate(test_r, 1):
        md += f"| {i} | {r['query']} | {r['expected']} | {r['classified']} | {int(r['routing']*100)}% | {r['status']} |\n"

    report_path = os.path.join(BACKEND_DIR, "evaluation", "RAG_BENCHMARK_REPORT.md")
    with open(report_path, "w", encoding="utf-8") as f:
        f.write(md)
    print(f"  📄 Report saved → {report_path}\n")


if __name__ == "__main__":
    train_results = run_set(TRAINING_CASES, "TRAINING — Direct Handbook Queries (expect 100%)")
    test_results  = run_set(TESTING_CASES,  "TESTING  — Ambiguous / Multi-Domain / OOD (expect 90%+)")
    print_summary(train_results, test_results)
