# OneDesk AI — Live RAG Benchmark Evaluation Report

**Generated on:** 2026-09-22 17:05:21  
**Evaluation Target:** Live Campus Knowledge Base (IT, HR, Finance, Facilities)  
**Engines:** Domain Classifier + ChromaDB Vector Store + Groq Llama-3 LLM

---

## 🎯 Executive Summary

| Metric | Score | Target Standard | Status |
| :--- | :---: | :---: | :---: |
| **Domain Routing Accuracy** | **87.5%** | > 90.0% | ⚠️ Needs Attention |
| **ChromaDB Retrieval Hit Rate** | **93.8%** | > 85.0% | ✅ Passed |
| **Answer Grounding Quality** | **100.0%** | > 80.0% | ✅ Passed |
| **Composite RAG System Score** | **93.8%** | > 85.0% | ✅ Production Grade |

---

## 📋 Individual Test Case Breakdown

| # | Test Query | Target Domain | Classified As | Routing Match | Context Retrieved | Answer Quality | Latency |
|:-:|:---|:---:|:---:|:---:|:---:|:---:|:---:|
| 1 | My laptop screen is flickering, ... | IT | IT | 100% | 50% | 100% | 1.51s |
| 2 | How many days of sick leave and ... | HR | HR | 100% | 100% | 100% | 1.08s |
| 3 | What is the reimbursement limit ... | Finance | Finance | 100% | 100% | 100% | 1.01s |
| 4 | I want to reserve conference roo... | Facilities | Facilities | 100% | 100% | 100% | 0.89s |
| 5 | How do I reset my company VPN an... | IT | IT | 100% | 100% | 100% | 12.55s |
| 6 | What is the policy for parental ... | HR | HR | 100% | 100% | 100% | 15.14s |
| 7 | Where do I submit my cab and tra... | Finance | Multi-Domain (Finance • Facilities) | 0% | 100% | 100% | 14.09s |
| 8 | The AC in the 3rd floor cafeteri... | Facilities | Facilities | 100% | 100% | 100% | 13.4s |
