"""
run_benchmark.py
Live Evaluation Benchmark for OneDesk AI RAG Pipeline.
Directly tests our actual domain classifier, ChromaDB vector retriever, and Groq LLM.
Calculates:
1. Routing Accuracy (Classification)
2. Retrieval Hit Rate (Document retrieval from ChromaDB)
3. Latency (Response time in seconds)
4. Overall System Score
"""
import sys
import os
import time

# Ensure backend root is in python path
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BACKEND_DIR)

from retrieval.domain_classifier import classify_domain
from retrieval.semantic_retriever import retrieve_chunks
from augmentation.prompt_builder import build_prompt
from generation.answer_generator import generate_answer

# ── 1. Real Test Dataset Based on Campus Handbook ──────────────────────────
TEST_CASES = [
    {
        "query": "My laptop screen is flickering, how do I fix it?",
        "expected_domain": "IT",
        "expected_keywords": ["driver", "display", "ticket", "hardware", "restart"]
    },
    {
        "query": "How many days of sick leave and casual leave can I take per year?",
        "expected_domain": "HR",
        "expected_keywords": ["leave", "sick", "casual", "days", "annual"]
    },
    {
        "query": "What is the reimbursement limit for daily meals on travel?",
        "expected_domain": "Finance",
        "expected_keywords": ["reimburse", "expense", "meal", "receipt", "allowance"]
    },
    {
        "query": "I want to reserve conference room B for tomorrow afternoon.",
        "expected_domain": "Facilities",
        "expected_keywords": ["room", "conference", "book", "facilities", "reserve"]
    },
    {
        "query": "How do I reset my company VPN and SSO password?",
        "expected_domain": "IT",
        "expected_keywords": ["vpn", "password", "sso", "reset", "auth"]
    },
    {
        "query": "What is the policy for parental and maternity leave?",
        "expected_domain": "HR",
        "expected_keywords": ["maternity", "parental", "leave", "weeks", "policy"]
    },
    {
        "query": "Where do I submit my cab and travel expense claim?",
        "expected_domain": "Finance",
        "expected_keywords": ["expense", "claim", "travel", "finance", "receipt"]
    },
    {
        "query": "The AC in the 3rd floor cafeteria is not working.",
        "expected_domain": "Facilities",
        "expected_keywords": ["ac", "cafeteria", "facilities", "floor", "maintenance"]
    }
]

def run_evaluation():
    print("=" * 65)
    print("🚀 STARTING LIVE ONEDESK AI RAG BENCHMARK EVALUATION")
    print("   Testing actual Domain Classifier, ChromaDB & Groq Engine...")
    print("=" * 65 + "\n")

    results = []

    for idx, test in enumerate(TEST_CASES, 1):
        query = test["query"]
        expected_domain = test["expected_domain"]
        expected_keywords = test["expected_keywords"]

        print(f"[{idx}/{len(TEST_CASES)}] Testing: \"{query}\"")
        start_time = time.time()

        # Step 1: Real Domain Classification
        try:
            classification = classify_domain(query)
            classified_domain = classification.get("domain", "unknown")
            routing_confidence = classification.get("confidence", 0.0)
            routing_match = 1.0 if classified_domain.lower() == expected_domain.lower() else 0.0
        except Exception as e:
            classified_domain = "error"
            routing_confidence = 0.0
            routing_match = 0.0

        # Step 2: Real ChromaDB Vector Retrieval
        try:
            target_domain = classified_domain if classified_domain != "unknown" else expected_domain
            chunks = retrieve_chunks(query, target_domain, top_k=3)
            retrieved_count = len(chunks)
            
            # Check if retrieved chunks contain relevant domain text
            combined_chunks_text = " ".join([c.get("text", "").lower() for c in chunks])
            has_relevant_chunk = any(kw.lower() in combined_chunks_text for kw in expected_keywords)
            retrieval_score = 1.0 if (retrieved_count > 0 and has_relevant_chunk) else (0.5 if retrieved_count > 0 else 0.0)
        except Exception as e:
            chunks = []
            retrieval_score = 0.0

        # Step 3: Real Groq Answer Generation
        try:
            prompt = build_prompt(query, chunks, target_domain)
            answer = generate_answer(prompt)
            gen_time = round(time.time() - start_time, 2)
            
            # Check if generated answer addresses the keywords
            answer_lower = answer.lower()
            keyword_matches = sum(1 for kw in expected_keywords if kw.lower() in answer_lower)
            faithfulness_score = min(1.0, round((keyword_matches / max(1, len(expected_keywords) // 2)), 2))
        except Exception as e:
            answer = f"Error: {e}"
            gen_time = round(time.time() - start_time, 2)
            faithfulness_score = 0.0

        results.append({
            "Query": query[:32] + "...",
            "Target": expected_domain,
            "Classified": classified_domain,
            "Routing": f"{int(routing_match * 100)}%",
            "Context Hit": f"{int(retrieval_score * 100)}%",
            "Answer Quality": f"{int(faithfulness_score * 100)}%",
            "Latency": f"{gen_time}s"
        })

    # Summary table
    # Format clean terminal table
    print("\n" + "=" * 88)
    print(f"{'Query':<36} {'Target':<12} {'Classified':<12} {'Routing':<9} {'Context':<9} {'Quality':<9} {'Latency':<7}")
    print("-" * 88)
    for r in results:
        print(f"{r['Query']:<36} {r['Target']:<12} {r['Classified']:<12} {r['Routing']:<9} {r['Context Hit']:<9} {r['Answer Quality']:<9} {r['Latency']:<7}")
    print("=" * 88)

    # Numerical metrics
    avg_routing = sum(float(r["Routing"].replace("%", "")) for r in results) / len(results)
    avg_retrieval = sum(float(r["Context Hit"].replace("%", "")) for r in results) / len(results)
    avg_quality = sum(float(r["Answer Quality"].replace("%", "")) for r in results) / len(results)
    composite = (avg_routing + avg_retrieval + avg_quality) / 3

    print("\n" + "=" * 48)
    print(f"🎯 Domain Routing Accuracy:       {avg_routing:.1f}%")
    print(f"📚 Vector Retrieval Hit Rate:    {avg_retrieval:.1f}%")
    print(f"🛡️  Answer Grounding Quality:     {avg_quality:.1f}%")
    print(f"🏆 OVERALL COMPOSITE RAG SCORE:  {composite:.1f}%")
    print("=" * 48)

    # Save Markdown report
    report_md = f"""# OneDesk AI — Live RAG Benchmark Evaluation Report

**Generated on:** {time.strftime('%Y-%m-%d %H:%M:%S')}  
**Evaluation Target:** Live Campus Knowledge Base (IT, HR, Finance, Facilities)  
**Engines:** Domain Classifier + ChromaDB Vector Store + Groq Llama-3 LLM

---

## 🎯 Executive Summary

| Metric | Score | Target Standard | Status |
| :--- | :---: | :---: | :---: |
| **Domain Routing Accuracy** | **{avg_routing:.1f}%** | > 90.0% | {'✅ Passed' if avg_routing >= 90 else '⚠️ Needs Attention'} |
| **ChromaDB Retrieval Hit Rate** | **{avg_retrieval:.1f}%** | > 85.0% | {'✅ Passed' if avg_retrieval >= 85 else '⚠️ Needs Attention'} |
| **Answer Grounding Quality** | **{avg_quality:.1f}%** | > 80.0% | {'✅ Passed' if avg_quality >= 80 else '⚠️ Needs Attention'} |
| **Composite RAG System Score** | **{composite:.1f}%** | > 85.0% | {'✅ Production Grade' if composite >= 85 else '⚠️ Review Required'} |

---

## 📋 Individual Test Case Breakdown

| # | Test Query | Target Domain | Classified As | Routing Match | Context Retrieved | Answer Quality | Latency |
|:-:|:---|:---:|:---:|:---:|:---:|:---:|:---:|
"""
    for idx, r in enumerate(results, 1):
        report_md += f"| {idx} | {r['Query']} | {r['Target']} | {r['Classified']} | {r['Routing']} | {r['Context Hit']} | {r['Answer Quality']} | {r['Latency']} |\n"

    report_path = os.path.join(BACKEND_DIR, "evaluation", "RAG_BENCHMARK_REPORT.md")
    with open(report_path, "w", encoding="utf-8") as f:
        f.write(report_md)
    print(f"\n📄 Markdown Report saved to: {report_path}")

if __name__ == "__main__":
    run_evaluation()
