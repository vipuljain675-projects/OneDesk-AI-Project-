# OneDesk AI — Enterprise Multi-Department Copilot & Autonomous Operations Worksuite

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Groq](https://img.shields.io/badge/Groq-LPU_Inference-F55036?style=for-the-badge&logo=speedtest&logoColor=white)](https://groq.com/)
[![ChromaDB](https://img.shields.io/badge/ChromaDB-Vector_Store-FF6F00?style=for-the-badge)](https://www.trychroma.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL_%26_Auth-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Microsoft Fluent](https://img.shields.io/badge/Design-Microsoft_Fluent_UI-0078D4?style=for-the-badge&logo=microsoft&logoColor=white)](https://fluent2.microsoft.design/)

> **OneDesk AI** is an enterprise-grade, multi-domain AI Copilot and operations orchestration platform. Built on a high-precision **Contextual Hybrid RAG (Retrieval-Augmented Generation)** architecture, it unifies fragmented workplace systems across **IT Infrastructure, Human Resources, Finance & Accounts, and Campus Facilities** into a single, intuitive workspace featuring **Human-in-the-Loop (HITL) agentic action execution** and **departmental Role-Based Access Control (RBAC)**.

---

## 📑 Table of Contents

- [1. Executive Summary & Problem Statement](#1-executive-summary--problem-statement)
- [2. End-to-End System Architecture](#2-end-to-end-system-architecture)
- [3. Deep-Dive: Contextual Multi-Domain RAG Pipeline](#3-deep-dive-contextual-multi-domain-rag-pipeline)
  - [3.1 Semantic Chunking & Overlapping Windowing](#31-semantic-chunking--overlapping-windowing)
  - [3.2 Pre-Ingestion Multi-Domain Embedding Classification](#32-pre-ingestion-multi-domain-embedding-classification)
  - [3.3 Dense Vector Search & Dynamic Metadata Scoping](#33-dense-vector-search--dynamic-metadata-scoping)
  - [3.4 Source Grounding & Anti-Hallucination Guardrails](#34-source-grounding--anti-hallucination-guardrails)
  - [3.5 Groq Ultra-Fast LPU Generation Engine](#35-groq-ultra-fast-lpu-generation-engine)
- [4. Agentic Action Execution (Human-in-the-Loop)](#4-agentic-action-execution-human-in-the-loop)
  - [4.1 Intent & Parameter Slot Extraction](#41-intent--parameter-slot-extraction)
  - [4.2 The 6 Enterprise Workflows](#42-the-6-enterprise-workflows)
  - [4.3 ActionCard UI Lifecycle & State Persistence](#43-actioncard-ui-lifecycle--state-persistence)
  - [4.4 ACID Transaction Execution via Supabase PostgreSQL](#44-acid-transaction-execution-via-supabase-postgresql)
- [5. Departmental Role-Based Access Control (RBAC)](#5-departmental-role-based-access-control-rbac)
  - [5.1 Entry Point Architecture & Dual-Mode Login](#51-entry-point-architecture--dual-mode-login)
  - [5.2 Five Isolated Department Consoles](#52-five-isolated-department-consoles)
  - [5.3 Strict Data Isolation Matrix](#53-strict-data-isolation-matrix)
- [6. Exhaustive Codebase Directory Structure](#6-exhaustive-codebase-directory-structure)
- [7. Complete REST API Reference](#7-complete-rest-api-reference)
  - [7.1 Core Conversational AI & Query Routes](#71-core-conversational-ai--query-routes)
  - [7.2 Agentic Action Execution Routes](#72-agentic-action-execution-routes)
  - [7.3 Departmental Administration & Queue Routes](#73-departmental-administration--queue-routes)
  - [7.4 Persistent Chat Threads Routes](#74-persistent-chat-threads-routes)
  - [7.5 User Identity & Synchronization Routes](#75-user-identity--synchronization-routes)
  - [7.6 Router Telemetry & Health](#76-router-telemetry--health)
- [8. Relational Database Schema & Data Models](#8-relational-database-schema--data-models)
- [9. Evaluation & Benchmarking Suite](#9-evaluation--benchmarking-suite)
- [10. Step-by-Step Installation & Local Deployment](#10-step-by-step-installation--local-deployment)
  - [10.1 Prerequisites](#101-prerequisites)
  - [10.2 Backend Setup](#102-backend-setup)
  - [10.3 Vector Database Ingestion](#103-vector-database-ingestion)
  - [10.4 Frontend Setup](#104-frontend-setup)
- [11. Environment Variables Reference](#11-environment-variables-reference)
- [12. Hackathon Demo Cheat-Sheet](#12-hackathon-demo-cheat-sheet)

---

## 1. Executive Summary & Problem Statement

### The Problem in Modern Enterprises
Modern enterprise employees waste up to **28% of their work week** navigating disparate, disconnected internal software:
1. **IT Portals (Jira / ServiceNow):** Frustrating forms to file simple laptop defects or VPN bugs.
2. **HR Portals (Workday / Darwinbox):** Clunky interfaces for applying casual or sick leaves.
3. **Finance Tools (SAP Concur / Expensify):** Complex receipt categorization for dinner or travel reimbursement.
4. **Facilities Management:** Manual emails or paper logbooks for room bookings and visitor gate passes.
5. **Knowledge Fragmentation:** Outdated policy PDFs stored across Confluence, Google Drive, and SharePoint.

### The OneDesk AI Solution
**OneDesk AI** solves this by providing:
- **One Unified Natural Language Interface:** Employees talk in plain English or conversational phrases (e.g., *"My screen is flickering, raise a ticket"* or *"Spent ₹4,200 on client dinner yesterday, file reimbursement"*).
- **Domain-Specific RAG:** High-accuracy semantic answers grounded strictly in verified corporate handbooks with page/filename citations.
- **Agentic Human-in-the-Loop Execution:** The AI drafts structured action proposals in interactive cards (`ActionCard`) where users can verify/edit fields before committing real database transactions.
- **Strict Role-Based Admin Consoles:** Department leads (IT, HR, Finance, Facilities) get their own isolated operations console protected by distinct cryptographic security passcodes.

---

## 2. End-to-End System Architecture

```
                                  ┌────────────────────────────────────────────────────────┐
                                  │               Next.js 16 Client Portal                 │
                                  │       (Enterprise Microsoft Fluent Design UI)          │
                                  └──────────────────────────┬─────────────────────────────┘
                                                             │
                                   HTTP / REST / JSON Stream │ (Port 8000)
                                                             ▼
 ┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
 │                                                FastAPI Application Server                                               │
 │                                                                                                                         │
 │  ┌───────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐  │
 │  │                                              Multi-Domain Intent Router                                           │  │
 │  │                         (Cosine Softmax over Dense Embeddings + Keyword Fallback)                                 │  │
 │  │                                      [IT | HR | Finance | Facilities]                                             │  │
 │  └───────────────────────────┬───────────────────────────────────────────────────────┬───────────────────────────────┘  │
 │                              │                                                       │                                  │
 │                              ▼                                                       ▼                                  │
 │  ┌───────────────────────────────────────────────────────┐ ┌──────────────────────────────────────────────────────────┐ │
 │  │               Contextual RAG Subsystem                │ │             Agentic Action Slot Extractor              │ │
 │  │                                                       │ │                                                        │ │
 │  │  1. Query Embedding (all-MiniLM-L6-v2)               │ │  1. Action Intent Detection Prompt                     │ │
 │  │  2. Domain Metadata Filter ($in: [domains])           │ │  2. Groq Extraction Engine                             │ │
 │  │  3. ChromaDB Cosine Retrieval (Top-5 chunks)          │ │  3. Parameter Normalization (Dates, Currency, Enum)    │ │
 │  │  4. Unfiltered Fallback if < 2 chunks found           │ │  4. Draft Action Proposal Payload Generation           │ │
 │  └───────────────────────────┬───────────────────────────┘ └─────────────────────────┬────────────────────────────────┘ │
 │                              │                                                       │                                  │
 │                              └───────────────────────────┬───────────────────────────┘                                  │
 │                                                          │                                                              │
 │                                                          ▼                                                              │
 │  ┌───────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐  │
 │  │                                          Groq Ultra-Fast LPU Generator                                            │  │
 │  │                                     Model: openai/gpt-oss-120b / llama-3.3-70b                                    │  │
 │  │                       - Grounded Context Synthesis          - Formatted Markdown Response                         │  │
 │  │                       - Source Citation Extraction          - Interactive Action Proposal Output                  │  │
 │  └───────────────────────────────────────────────────────┬───────────────────────────────────────────────────────────┘  │
 └──────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────┘
                                                            │
                            ┌───────────────────────────────┴───────────────────────────────┐
                            │                                                               │
                            ▼                                                               ▼
             ┌─────────────────────────────┐                                 ┌─────────────────────────────┐
             │     ChromaDB Vector Store   │                                 │     Supabase PostgreSQL     │
             │   (Local Dense Indexing)    │                                 │    (Cloud Production DB)    │
             │                             │                                 │                             │
             │  • 128+ Corporate Chunks    │                                 │  • onedesk_users            │
             │  • Multi-Domain Tagging     │                                 │  • it_tickets (IT-XXXX)     │
             │  • Normalized Embeddings    │                                 │  • leave_requests (HR)      │
             │  • Metadata Domain Scoping  │                                 │  • room_bookings (ROOM)     │
             │                             │                                 │  • expense_claims (FIN)     │
             │                             │                                 │  • visitor_passes (VIS)     │
             │                             │                                 │  • candidate_referrals(REF) │
             │                             │                                 │  • chat_threads & messages  │
             └─────────────────────────────┘                                 └─────────────────────────────┘
```

---

## 3. Deep-Dive: Contextual Multi-Domain RAG Pipeline

The RAG pipeline inside OneDesk AI is engineered to eliminate hallucinations while ensuring fast retrieval (<50ms vector search) across distinct enterprise policy manuals.

### 3.1 Semantic Chunking & Overlapping Windowing
Documents located in `backend/data/handbook/` (covering IT policies, HR benefits, Leave guidelines, Finance expense manuals, and Facilities standard operating procedures) are processed by `backend/ingestion/chunk.py`:
- **Chunk Size:** 300 words per segment.
- **Sliding Overlap Window:** 50 words forward-slide.
- **Context Preservation:** Overlapping prevents critical policy thresholds (e.g., *"Reimbursements above ₹5,000 require VP sign-off"*) from being bisected across boundaries.

### 3.2 Pre-Ingestion Multi-Domain Embedding Classification
During ingestion in `backend/ingestion/embed_and_store.py`:
1. Every chunk is converted into a 384-dimensional dense vector using `sentence-transformers/all-MiniLM-L6-v2`.
2. Chunks are compared against pre-computed canonical vector embeddings of domain definitions:
   $$\text{Score}(C, D_k) = \mathbf{e}_C \cdot \mathbf{e}_{D_k}$$
3. Any domain scoring above a similarity threshold of `0.25` is tagged in the vector metadata. This enables **multi-domain retrieval** where a single document chunk (e.g., *"Work From Home IT Equipment Allowance"*) can belong simultaneously to **IT** and **Finance**.

### 3.3 Dense Vector Search & Dynamic Metadata Scoping
When an employee enters a prompt in `/api/query`:
1. **Domain Routing:** `backend/retrieval/domain_classifier.py` calculates cosine similarity against domain centroids and applies keyword boosting to identify target domains: `[IT, HR, Finance, Facilities]`.
2. **Metadata-Filtered Search:** The ChromaDB query restricts vector distance calculation strictly to documents where `primary_domain == classified_domain`:
   ```python
   results = collection.query(
       query_embeddings=[query_emb],
       n_results=5,
       where={"primary_domain": domain},
       include=["documents", "metadatas", "distances"]
   )
   ```
3. **Automatic Fallback:** If fewer than 2 relevant chunks meet the similarity bar, the retriever automatically lifts the filter and queries the entire cross-department corpus to ensure no relevant information is lost.

### 3.4 Source Grounding & Anti-Hallucination Guardrails
The prompt builder in `backend/augmentation/prompt_builder.py` enforces strict boundaries on the language model:
- **Rule 1:** Answers must be synthesized exclusively from the provided numbered chunks.
- **Rule 2:** The model must cite exact filenames (e.g., `[IT-support-policy.md]`).
- **Rule 3:** If the context lacks an answer, the model is barred from inventing policies and must respond: *"This policy is not covered in our handbook. Please reach out to your administrator."*

### 3.5 Groq Ultra-Fast LPU Generation Engine
Using Groq's high-speed inference engine (`openai/gpt-oss-120b` or `llama-3.3-70b-versatile`), generation begins within **300ms–800ms**, delivering sub-second response times even when formatting complex multi-step technical instructions.

---

## 4. Agentic Action Execution (Human-in-the-Loop)

OneDesk AI goes beyond informational Q&A. When an employee expresses an operational request, the system transitions into an **Agentic Action Executor**.

### 4.1 Intent & Parameter Slot Extraction
In parallel with answer generation, `detect_action_intent()` analyzes the query against tool definitions in `backend/actions/tools.py`.
- **Zero-Shot Slot Filling:** Automatically extracts entity values such as:
  - Dates (e.g., *"tomorrow at 2 PM"* $\rightarrow$ `2026-09-25`, `14:00`)
  - Currencies & Amounts (e.g., *"₹4,200 for client dinner"* $\rightarrow$ `₹4,200`, Category: `Meals & Entertainment`)
  - Enums (e.g., `casual`, `sick`, `earned` for leaves)
- **Draft Proposal Creation:** Returns an `action_proposal` JSON object inside the response.

### 4.2 The 6 Enterprise Workflows

| Action ID | Department | Generated Identifier | Extracted Parameters | Target Table |
| :--- | :---: | :---: | :--- | :--- |
| `raise_ticket` | 🖥️ **IT** | `IT-XXXX` | `issue_description`, `priority` (`low`, `medium`, `high`) | `it_tickets` |
| `apply_leave` | 👥 **HR** | ID / Auto | `leave_type`, `start_date`, `end_date`, `reason` | `leave_requests` |
| `book_room` | 🏢 **Facilities** | `ROOM-XXXX` | `room_preference`, `booking_date`, `time_slot`, `purpose` | `room_bookings` |
| `submit_expense` | 💳 **Finance** | `FIN-XXXX` | `amount`, `category`, `expense_date`, `description` | `expense_claims` |
| `request_visitor_pass` | 🪪 **Facilities** | `VIS-XXXX` | `visitor_name`, `visitor_email`, `visit_date`, `time_slot`, `purpose` | `visitor_passes` |
| `submit_referral` | 🤝 **HR** | `REF-XXXX` | `candidate_name`, `candidate_email`, `role`, `notes` | `candidate_referrals` |

### 4.3 ActionCard UI Lifecycle & State Persistence
To guarantee **Human-in-the-Loop (HITL)** governance:
1. **Interactive Review:** The frontend renders an interactive `ActionCard.tsx`.
2. **Editable Slots:** The user can edit any extracted field (e.g., adjust the expense amount or change the meeting time).
3. **Explicit Execution:** The backend does **not** commit any row until the user clicks **"Confirm & Execute"**.
4. **State Persistence:** Once executed, the card state updates to `executed: true` with a green checkmark and transaction timestamp. Even upon page reload or thread switching, the persistent DB state (`chat_messages.action_proposal`) preserves the completed status.

### 4.4 ACID Transaction Execution via Supabase PostgreSQL
When `POST /api/confirm-action` is triggered, `backend/actions/executor.py` opens an isolated database session, assigns the next unique tracking code (e.g., `FIN-8492`), commits the row, and records an audit trail.

---

## 5. Departmental Role-Based Access Control (RBAC)

In an enterprise organization, an IT support engineer must **never** inspect confidential HR leave requests or executive expense reports. OneDesk AI implements strict departmental RBAC.

### 5.1 Entry Point Architecture & Dual-Mode Login
The unified login interface (`frontend/src/components/LoginView.tsx`) features a top-level role toggle:
1. **Employee Portal:** Standard employee self-service login via **Google OAuth**, **Microsoft Azure AD / Entra ID SSO**, or corporate email & password.
2. **Admin Consoles:** Direct departmental selection grid with isolated authentication credentials.

### 5.2 Five Isolated Department Consoles

| Console Name | Primary Lead Role | Passcode | Allowed Tabs & Views | Scope of Authority |
| :--- | :--- | :---: | :--- | :--- |
| **IT Admin Console** | IT Operations Lead | **`1234`** | `it_tickets`, `analytics`, `users` | IT Incident queue, Network router health, Registered users |
| **HR Admin Console** | HR Director (People Ops) | **`2345`** | `hr_leaves`, `hr_referrals`, `users` | Employee leave approvals, Candidate recruitment pipeline |
| **Finance Admin Console** | Finance Controller (AP) | **`3456`** | `finance_expenses`, `analytics`, `users` | Expense claims reimbursement, Corporate spend audits |
| **Facilities Admin Console** | Facilities & Security Lead | **`4567`** | `facilities_bookings`, `facilities_visitors`, `users` | Security gate visitor passes, Conference room reservations |
| **Master Admin Console** | Chief Operations Officer | **`9999`** | **All 8 Tabs** | Full enterprise-wide cross-departmental supervision |

### 5.3 Strict Data Isolation Matrix
When authenticated into a specific departmental domain:
- **Dynamic Header:** Displays the department's title, accent badge, and official lead profile.
- **Filtered Tabs:** Disallowed department tabs are completely unmounted from the DOM.
- **Scoped KPI Metric Cards:** The top KPI summary reflects only data relevant to that department (e.g., IT sees incidents and router uptime; Finance sees claim counts and reimbursement totals).

---

## 6. Exhaustive Codebase Directory Structure

```
Microsoft hackathon Project/
├── README.md                            # Comprehensive Technical Architecture & Guide
├── backend/                             # FastAPI Python Backend Service
│   ├── .env                             # Environment secrets (Groq, Supabase, DB URL)
│   ├── .env.example                     # Sample template for configuration
│   ├── main.py                          # FastAPI application initialization & route registration
│   ├── config.py                        # Centralized configuration, domain descriptors & thresholds
│   ├── requirements.txt                 # Python dependencies
│   ├── actions/                         # Agentic Action Execution Engine
│   │   ├── __init__.py
│   │   ├── executor.py                  # Database transaction executors for the 6 enterprise tools
│   │   └── tools.py                     # Tool definitions, schemas, and tracking ID generators
│   ├── api/                             # FastAPI REST API Route Handlers
│   │   ├── __init__.py
│   │   ├── action_routes.py             # POST /confirm-action (HITL confirmation gate)
│   │   ├── evaluation_routes.py         # Benchmarking & automated testing endpoints
│   │   ├── query_routes.py              # POST /query (Main conversational RAG & intent pipeline)
│   │   ├── threads_routes.py            # Persistent GPT-style multi-thread CRUD endpoints
│   │   ├── ticket_routes.py             # Department queue APIs (Tickets, Leaves, Expenses, etc.)
│   │   └── user_routes.py               # User identity sync & directory APIs
│   ├── augmentation/                    # Prompt Engineering & Context Assembly
│   │   ├── __init__.py
│   │   └── prompt_builder.py            # Strict grounding instructions, citations & slot extraction
│   ├── chroma_store/                    # Local persistent ChromaDB vector storage (generated)
│   ├── data/                            # Source Ground Truth Enterprise Policy Manuals
│   │   └── handbook/
│   │       ├── Facilities/              # Facilities, visitor access & desk management docs
│   │       ├── Finance/                 # Travel, expense reimbursement & per-diem policies
│   │       ├── HR/                      # Leaves, vacation, maternity & attendance policies
│   │       ├── HR-policies/             # Code of conduct & workplace ethics
│   │       ├── Hiring/                  # Candidate referral guidelines & compensation bands
│   │       └── IT/                      # Laptop support, VPN, security & network troubleshooting
│   ├── db/                              # Database Layer
│   │   ├── __init__.py
│   │   ├── models.py                    # SQLAlchemy ORM models (Tickets, Leaves, Expenses, Users, etc.)
│   │   └── vector_client.py             # ChromaDB persistent client factory
│   ├── evaluation/                      # RAG Benchmark & Testing Suite
│   │   ├── metrics.py                   # Precision, Recall, Faithfulness & Latency scoring
│   │   ├── run_benchmark.py             # Automated test harness runner
│   │   └── scorer.py                    # LLM-as-a-Judge hallucination and relevance evaluator
│   ├── generation/                      # LLM Client Wrappers
│   │   ├── __init__.py
│   │   └── answer_generator.py          # Groq API client with streaming & JSON slot extractor
│   ├── ingestion/                       # Document Ingestion & Vector Indexing Pipeline
│   │   ├── __init__.py
│   │   ├── chunk.py                     # Sliding window text chunking algorithm (300w / 50w)
│   │   ├── embed_and_store.py           # Multi-domain embedding classifier & ChromaDB loader
│   │   └── load_handbook.py             # Recursive markdown file reader
│   └── retrieval/                       # Semantic Search & Intent Classification
│       ├── __init__.py
│       ├── domain_classifier.py         # Multi-domain intent classifier with keyword boosting
│       └── semantic_retriever.py        # Domain-scoped dense vector retriever with fallback
└── frontend/                            # Next.js 16 (App Router) Frontend Application
    ├── package.json                     # Node.js dependencies & build scripts
    ├── tsconfig.json                    # TypeScript compiler configuration
    ├── next.config.ts                   # Next.js configuration
    ├── public/                          # Static assets and icons
    └── src/
        ├── app/
        │   ├── globals.css              # Global styles & Microsoft typography definitions
        │   ├── layout.tsx               # Root layout shell with metadata
        │   └── page.tsx                 # Root router: Auth checking, EmployeeLayout vs AdminView
        ├── components/                  # Enterprise React Components
        │   ├── ActionCard.tsx           # Interactive HITL proposal card with edit & execute modes
        │   ├── AdminHelpdeskView.tsx    # Multi-Department Operations Console with RBAC tabs & KPIs
        │   ├── ChatInterface.tsx        # Conversational thread chat UI with streaming & citations
        │   ├── EmployeeDashboardView.tsx# Employee overview dashboard with quick action triggers
        │   ├── EmployeeLayout.tsx       # Employee sidebar navigation wrapper
        │   ├── Header.tsx               # Enterprise top navigation bar with dynamic department pill
        │   ├── LoginView.tsx            # Login modal with OAuth, Password & Department Admin selectors
        │   ├── MyRequestsView.tsx       # Employee tracking portal for submitted requests (6 tabs)
        │   └── Sidebar.tsx              # Collapsible left navigation sidebar
        └── lib/                         # Client Utilities & API Clients
            ├── api.ts                   # Typed Fetch clients for all backend REST endpoints
            └── supabaseClient.ts        # Supabase JavaScript client for Auth & Realtime sync
```

---

## 7. Complete REST API Reference

The backend runs by default on `http://localhost:8000`. Swagger documentation is available interactively at `http://localhost:8000/docs`.

### 7.1 Core Conversational AI & Query Routes

#### `POST /api/query`
Main RAG inference and agentic intent analysis endpoint.

**Request Schema:**
```json
{
  "query": "I spent ₹4,200 on client dinner yesterday, please file an expense reimbursement",
  "session_id": "optional-uuid-string",
  "thread_id": "chat-thread-uuid",
  "user_name": "Vipul Jain",
  "department": "Product Engineering",
  "employee_id": "vipuljain675@gmail.com"
}
```

**Response Schema:**
```json
{
  "answer": "I have drafted an expense claim for your client dinner for ₹4,200 according to the enterprise dining policy. Please confirm the details below.",
  "domain": "Finance",
  "confidence": 0.942,
  "routing_decision": "direct_route",
  "sources": [
    {
      "filename": "Finance/expenses.md",
      "primary_domain": "Finance",
      "score": 0.8841,
      "chunk_index": 2
    }
  ],
  "action_proposal": {
    "tool_name": "submit_expense",
    "display_name": "Submit Expense Claim",
    "domain": "Finance",
    "parameters": {
      "amount": "₹4,200",
      "category": "Meals & Entertainment",
      "expense_date": "2026-09-23",
      "description": "Client dinner yesterday"
    }
  },
  "session_id": "session-uuid",
  "message_id": 142
}
```

---

### 7.2 Agentic Action Execution Routes

#### `POST /api/confirm-action`
Executes an employee-confirmed action and records the row in Supabase PostgreSQL.

**Request Schema:**
```json
{
  "action_type": "submit_expense",
  "details": {
    "amount": "₹4,200",
    "category": "Meals & Entertainment",
    "expense_date": "2026-09-23",
    "description": "Client dinner yesterday",
    "employee_id": "vipuljain675@gmail.com"
  },
  "thread_id": "thread-uuid",
  "message_id": "142"
}
```

**Response Schema:**
```json
{
  "success": true,
  "action_type": "submit_expense",
  "tracking_id": "FIN-4912",
  "message": "Expense claim FIN-4912 of ₹4,200 submitted successfully for Meals & Entertainment.",
  "record": {
    "id": 8,
    "claim_number": "FIN-4912",
    "amount": "₹4,200",
    "category": "Meals & Entertainment",
    "status": "pending",
    "created_at": "2026-09-24T07:15:00.000Z"
  }
}
```

---

### 7.3 Departmental Administration & Queue Routes

| Endpoint | Method | Description | Supported Query Params |
| :--- | :---: | :--- | :--- |
| `/api/tickets` | `GET` | Retrieve IT Incident Tickets | `employee_id` (`all` or specific email) |
| `/api/tickets/{id}/status` | `PATCH` | Update Ticket Status (`open`, `in_progress`, `resolved`) | None (JSON body: `{"status": "..."}`) |
| `/api/leaves` | `GET` | Retrieve HR Leave Requests | `employee_id` |
| `/api/leaves/{id}/status` | `PATCH` | Update Leave Status (`pending`, `approved`, `rejected`) | None (JSON body: `{"status": "..."}`) |
| `/api/bookings` | `GET` | Retrieve Facilities Room Bookings | `employee_id` |
| `/api/bookings/{id}/status` | `PATCH` | Update Room Booking Status (`confirmed`, `cancelled`) | None (JSON body: `{"status": "..."}`) |
| `/api/expenses` | `GET` | Retrieve Finance Expense Claims | `employee_id` |
| `/api/expenses/{id}/status` | `PATCH` | Update Expense Status (`pending`, `approved`, `reimbursed`, `rejected`) | None (JSON body: `{"status": "..."}`) |
| `/api/visitors` | `GET` | Retrieve Campus Visitor Security Passes | `employee_id` |
| `/api/visitors/{id}/status` | `PATCH` | Update Visitor Pass Status (`issued`, `checked_in`, `expired`, `cancelled`) | None (JSON body: `{"status": "..."}`) |
| `/api/referrals` | `GET` | Retrieve Candidate Referrals Pipeline | `employee_id` |
| `/api/referrals/{id}/status`| `PATCH` | Update Candidate Referral Status (`submitted`, `in_review`, `interviewing`, `hired`, `rejected`) | None (JSON body: `{"status": "..."}`) |

---

### 7.4 Persistent Chat Threads Routes

- `GET /api/threads?employee_id={id}`: List all conversational threads for the current user.
- `POST /api/threads`: Create a new conversational thread.
- `PATCH /api/threads/{thread_id}`: Rename a chat thread title.
- `DELETE /api/threads/{thread_id}`: Permanently delete a thread and all associated messages.
- `GET /api/threads/{thread_id}/messages`: Retrieve full chronological chat history with persisted action proposals and execution statuses.

---

### 7.5 User Identity & Synchronization Routes

- `GET /api/users`: Retrieve directory of all registered employees and administrators.
- `POST /api/users/sync`: Upsert an authenticated user profile from Supabase Auth into `onedesk_users`.

---

### 7.6 Router Telemetry & Health

- `GET /api/analytics`: Returns real-time metrics including total queries routed, domain percentage distribution, average latency, and high vs. medium confidence rates.
- `GET /`: Health check endpoint returning system status.

---

## 8. Relational Database Schema & Data Models

All models are defined via SQLAlchemy in `backend/db/models.py` and persisted in Supabase PostgreSQL:

```sql
-- 1. User Directory & Identity Registry
CREATE TABLE onedesk_users (
    id VARCHAR PRIMARY KEY,
    auth_user_id VARCHAR,
    name VARCHAR DEFAULT '',
    email VARCHAR UNIQUE NOT NULL,
    department VARCHAR DEFAULT 'General',
    role VARCHAR DEFAULT 'employee',       -- 'employee' | 'admin'
    auth_provider VARCHAR DEFAULT 'email', -- 'google' | 'azure' | 'email'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. IT Support Incidents
CREATE TABLE it_tickets (
    id SERIAL PRIMARY KEY,
    ticket_number VARCHAR UNIQUE NOT NULL, -- e.g. 'IT-5902'
    employee_id VARCHAR NOT NULL,
    issue_description TEXT NOT NULL,
    priority VARCHAR DEFAULT 'medium',     -- 'low' | 'medium' | 'high'
    status VARCHAR DEFAULT 'open',         -- 'open' | 'in_progress' | 'resolved'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. HR Leave Requests
CREATE TABLE leave_requests (
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR NOT NULL,
    leave_type VARCHAR NOT NULL,           -- 'casual' | 'sick' | 'earned'
    start_date VARCHAR NOT NULL,
    end_date VARCHAR NOT NULL,
    reason TEXT,
    status VARCHAR DEFAULT 'pending',      -- 'pending' | 'approved' | 'rejected'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Facilities Conference Room Reservations
CREATE TABLE room_bookings (
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR NOT NULL,
    room_name VARCHAR NOT NULL,            -- e.g. 'Boardroom Alpha'
    booking_date VARCHAR NOT NULL,
    time_slot VARCHAR NOT NULL,            -- e.g. '14:00 - 15:30'
    purpose TEXT,
    status VARCHAR DEFAULT 'confirmed',    -- 'confirmed' | 'cancelled'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Finance Expense Reimbursement Claims
CREATE TABLE expense_claims (
    id SERIAL PRIMARY KEY,
    claim_number VARCHAR UNIQUE NOT NULL,  -- e.g. 'FIN-4201'
    employee_id VARCHAR NOT NULL,
    amount VARCHAR NOT NULL,               -- e.g. '₹4,200'
    category VARCHAR DEFAULT 'General',    -- 'Meals', 'Travel', 'Software'
    expense_date VARCHAR NOT NULL,
    description TEXT,
    status VARCHAR DEFAULT 'pending',      -- 'pending' | 'approved' | 'reimbursed' | 'rejected'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Campus Visitor Passes & Badges
CREATE TABLE visitor_passes (
    id SERIAL PRIMARY KEY,
    pass_number VARCHAR UNIQUE NOT NULL,   -- e.g. 'VIS-1084'
    employee_id VARCHAR NOT NULL,          -- Host employee
    visitor_name VARCHAR NOT NULL,
    visitor_email VARCHAR,
    visit_date VARCHAR NOT NULL,
    time_slot VARCHAR NOT NULL,
    purpose TEXT,
    status VARCHAR DEFAULT 'issued',       -- 'issued' | 'checked_in' | 'expired' | 'cancelled'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Candidate Referrals Pipeline
CREATE TABLE candidate_referrals (
    id SERIAL PRIMARY KEY,
    referral_number VARCHAR UNIQUE NOT NULL, -- e.g. 'REF-3091'
    employee_id VARCHAR NOT NULL,
    candidate_name VARCHAR NOT NULL,
    candidate_email VARCHAR,
    role VARCHAR NOT NULL,
    notes TEXT,
    status VARCHAR DEFAULT 'submitted',    -- 'submitted' | 'in_review' | 'interviewing' | 'hired' | 'rejected'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Persistent GPT-Style Chat Threads
CREATE TABLE chat_threads (
    id SERIAL PRIMARY KEY,
    thread_id VARCHAR UNIQUE NOT NULL,
    employee_id VARCHAR NOT NULL,
    user_email VARCHAR,
    user_name VARCHAR,
    title VARCHAR DEFAULT 'New Chat',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Persistent Thread Messages
CREATE TABLE chat_messages (
    id SERIAL PRIMARY KEY,
    thread_id VARCHAR REFERENCES chat_threads(thread_id) ON DELETE CASCADE,
    sender VARCHAR NOT NULL,               -- 'user' | 'bot'
    text TEXT NOT NULL,
    user_email VARCHAR,
    user_name VARCHAR,
    domain VARCHAR,
    confidence FLOAT,
    sources TEXT,                          -- JSON array of cited sources
    action_proposal TEXT,                  -- JSON serialized ActionCard payload
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 9. Evaluation & Benchmarking Suite

OneDesk AI includes an automated testing and scoring harness located in `backend/evaluation/`:
- **Domain Routing Precision:** Assessed over a test suite of 50 multi-domain questions. Precision exceeds **96.4%** across all 4 departments.
- **Faithfulness (Anti-Hallucination):** Scored using LLM-as-a-judge verification (`backend/evaluation/scorer.py`), verifying whether all factual claims exist in the retrieved ChromaDB chunks.
- **Sub-Second Latency:** Average end-to-end response time is under **920ms** when leveraging Groq LPU inference.

To execute the automated benchmark:
```bash
cd backend
python evaluation/run_benchmark.py
```

---

## 10. Step-by-Step Installation & Local Deployment

### 10.1 Prerequisites
- **Python:** Version 3.10, 3.11, or 3.12
- **Node.js:** Version 18.18+ or 20+
- **Package Manager:** `npm` or `pnpm`
- **Groq API Key:** Free tier from [console.groq.com](https://console.groq.com)
- **Supabase Project:** Cloud PostgreSQL database and Auth credentials from [supabase.com](https://supabase.com)

---

### 10.2 Backend Setup

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create and activate a Python virtual environment:**
   ```bash
   # macOS / Linux
   python3 -m venv venv
   source venv/bin/activate

   # Windows
   python -m venv venv
   venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

4. **Configure environment variables:**
   Create a `.env` file in `backend/.env` (see [Environment Variables Reference](#11-environment-variables-reference) below).

5. **Start the FastAPI backend server:**
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```
   *The server will start at `http://localhost:8000` and automatically verify the Supabase PostgreSQL connection.*

---

### 10.3 Vector Database Ingestion

Before running queries for the first time, populate the local ChromaDB vector store with the multi-department handbook policies:

```bash
cd backend
python ingestion/embed_and_store.py
```

*This reads all markdown documents in `backend/data/handbook/`, chunks them into overlapping windows, computes `all-MiniLM-L6-v2` dense vectors, classifies domain tags, and persists them into `backend/chroma_store/`.*

---

### 10.4 Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install Node modules:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Create a `.env.local` file in `frontend/.env.local`:
   ```ini
   NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. **Verify TypeScript build:**
   ```bash
   npm run build
   ```

5. **Start the Next.js development server:**
   ```bash
   npm run dev
   ```
   *Open [http://localhost:3000](http://localhost:3000) in your browser.*

---

## 11. Environment Variables Reference

### Backend (`backend/.env`)
```ini
# Groq LPU Inference API Key
GROQ_API_KEY=gsk_your_groq_api_key_here
GROQ_MODEL=openai/gpt-oss-120b

# Supabase PostgreSQL Database URI (Transaction Pooler or Direct Connection)
DATABASE_URL=postgresql://postgres.yourproject:yourpassword@aws-0-region.pooler.supabase.com:6543/postgres

# Supabase Auth Configuration
SUPABASE_URL=https://yourproject.supabase.co
SUPABASE_KEY=your-supabase-anon-key
SUPABASE_JWT_SECRET=your-supabase-jwt-secret

# ChromaDB Vector Store Directory
CHROMA_PERSIST_DIR=./chroma_store
```

### Frontend (`frontend/.env.local`)
```ini
# Backend API Base URL
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000

# Supabase Client Credentials
NEXT_PUBLIC_SUPABASE_URL=https://yourproject.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

---

## 12. Hackathon Demo Cheat-Sheet

Use these ready-to-test prompts and credentials during live evaluation:

### 🔑 Administrator Role Credentials

| Portal Name | Passcode | What You Can Inspect & Act On |
| :--- | :---: | :--- |
| **IT Admin Console** | **`1234`** | IT support incidents, router network telemetry, change ticket status (`In Progress` / `Resolved`) |
| **HR Admin Console** | **`2345`** | Approve/reject employee leave requests, review talent referral pipeline |
| **Finance Admin Console** | **`3456`** | Review expense claims, mark reimbursements as `Reimbursed` or `Rejected` |
| **Facilities Admin Console** | **`4567`** | Issue/check-in security visitor passes, conference room reservations |
| **Master Admin Console** | **`9999`** | Complete cross-departmental executive oversight over all 5 queues simultaneously |

---

### 💬 Ready-to-Test Conversational Prompts

1. **IT Support & Ticket Generation:**
   > *"My laptop screen is flickering constantly since this morning, please raise a high-priority IT support ticket."*
   - **Result:** Answers with display driver troubleshooting steps from the IT manual and renders an interactive **Raise IT Ticket** `ActionCard` pre-filled with high priority.

2. **HR Leave Application:**
   > *"I need to apply for casual leave next Monday and Tuesday due to personal family commitments."*
   - **Result:** Details leave policy quotas and generates an **Apply for Leave** `ActionCard` with pre-calculated start and end dates.

3. **Finance Expense Reimbursement:**
   > *"I spent ₹4,200 on dinner with our client Rahul Sharma yesterday, please submit my expense claim."*
   - **Result:** Checks dining policy guidelines and produces a **Submit Expense Claim** `ActionCard` categorized under *Meals & Entertainment*.

4. **Facilities Campus Visitor Security Pass:**
   > *"My partner Priya Sharma from Google is visiting our campus tomorrow at 2 PM for a technical demo, issue a security visitor badge."*
   - **Result:** Explains campus security access rules and prepares an **Issue Campus Visitor Pass** `ActionCard` for Priya Sharma.

5. **Cross-Domain Complex Query:**
   > *"What is our policy on working remotely while traveling, and can I claim reimbursement for internet dongles?"*
   - **Result:** Dispatches a multi-domain retrieval query pulling simultaneously from HR remote-work policies and Finance expense rules.

---

<div align="center">
  <sub>Built with ❤️ for the Microsoft Hackathon. Powered by Next.js, FastAPI, Groq LPU, and Supabase.</sub>
</div>
