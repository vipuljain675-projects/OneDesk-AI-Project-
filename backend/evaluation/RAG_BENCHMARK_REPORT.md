# OneDesk AI — Training vs Testing Accuracy Report

**Generated:** 2026-10-04 20:34:58
**Corpus:** 224 GitLab Handbook Documents (HR · IT · Finance · Facilities)
**Stack:** SentenceTransformer all-MiniLM-L6-v2 · ChromaDB HNSW · Groq LLM

---

## 📊 Summary

| Metric | Training | Testing |
|:---|:---:|:---:|
| Domain Routing Accuracy | **100.0%** | **100.0%** |
| Answer Grounding Quality | **64.8%** | **66.0%** |
| **Composite Score** | **82.4%** | **83.0%** |
| Cases Passed | **9/10** | **8/8** |
| Generalization Gap | **-0.6%** ✅ | — |

---

## 📚 Training Cases (In-Distribution)

| # | Query | Classified Domain | Routing | Grounding | Status |
|:-:|:---|:---|:---:|:---:|:---:|
| 1 | How many paid sick days do I get per yea... | HR | 100% | 50% | ✅ |
| 2 | How do I submit a leave request in Workd... | HR | 100% | 88% | ✅ |
| 3 | Where do I submit travel and meal expens... | Finance | 100% | 100% | ✅ |
| 4 | What is GitLab parental leave duration a... | HR | 100% | 62% | ✅ |
| 5 | How do I book a meeting room or conferen... | Facilities | 100% | 75% | ✅ |
| 6 | What home office equipment can I expense... | Finance | 100% | 78% | ✅ |
| 7 | My laptop screen is cracked. How do I ge... | IT | 100% | 33% | ⚠️ |
| 8 | What is the process for resigning from G... | Multi-Domain (HR • Fin | 100% | 62% | ✅ |
| 9 | What is the meal reimbursement limit whe... | Finance | 100% | 56% | ✅ |
| 10 | How do I reset my SSO or Okta login cred... | IT | 100% | 44% | ✅ |

---

## 🧪 Testing Cases (Ambiguous / Multi-Domain / OOD)

| # | Query | Classified Domain | Routing | Grounding | Status |
|:-:|:---|:---|:---:|:---:|:---:|
| 1 | I accidentally broke my laptop. Will the... | Multi-Domain (Finance  | 100% | 56% | ✅ |
| 2 | I am a new joiner. What should I set up ... | Multi-Domain (Faciliti | 100% | 100% | ✅ |
| 3 | What is the current GitLab stock price?... | Multi-Domain (Finance  | 100% | 50% | ✅ |
| 4 | My screen is cracked. How do I get a rep... | Multi-Domain (Finance  | 100% | 62% | ✅ |
| 5 | Can I take casual leave and also claim t... | Multi-Domain (Finance  | 100% | 62% | ✅ |
| 6 | We are planning an offsite for 40 people... | Multi-Domain (Faciliti | 100% | 62% | ✅ |
| 7 | I want to set up my home office. What eq... | Finance | 100% | 75% | ✅ |
| 8 | What did the CEO say in the last board m... | Multi-Domain (IT • Fin | 100% | 60% | ✅ |
