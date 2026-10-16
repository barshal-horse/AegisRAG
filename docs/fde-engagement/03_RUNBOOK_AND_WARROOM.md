# 03_RUNBOOK_AND_WARROOM: AegisRAG Operational Runbook & Chaos Drill

> **Standard Operating Procedure (SOP)**: Production Operations, Security Drills, and War Room Escalation  
> **System**: AegisRAG (Zero-Trust Push-Down ReBAC Vector Proxy)  
> **Author**: Harshal Borse (`barshal-horse`), Principal FDE

---

## 1. Quickstart & Zero-Credential Bootstrapping

AegisRAG is designed to run 100% offline with zero paid API keys, utilizing built-in deterministic seed data, an embedded vector store (or containerized Qdrant/pgvector), and an offline mock/replay LLM generator.

### 1.1 Local Docker Bootstrapping
```bash
# 1. Clone & Navigate
cd "C:\Users\bhars\Desktop\anti gravity\AegisRAG"

# 2. Start services (FastAPI Backend + Qdrant / Vector DB + Next.js UI)
docker compose up -d --build

# 3. Seed deterministic enterprise permission graph & document corpus
docker compose exec backend python -m seed.seed_enterprise_graph

# 4. Access Interactive Cockpits
# Backend Swagger / OpenAPI: http://localhost:8000/docs
# Red-Team Interactive HUD:   http://localhost:3000
```

---

## 2. Deterministic Seed Corpus & Security Personas

The seed script initializes 4 distinct enterprise personas with varied document access:

| Persona ID | Display Name | Department | Clearance Level | Permitted Chunks |
| :--- | :--- | :--- | :--- | :--- |
| `user_intern` | Alex Vance | Engineering Intern | Level 1 (Public + Dev) | 12 chunks (General docs) |
| `user_pm` | Sarah Chen | FinTech Lead | Level 2 (Project Alpha) | 38 chunks (Alpha specs) |
| `user_auditor` | Marcus Reed | Regulatory Audit | Level 3 (Compliance/Audit) | 45 chunks (Audit ledgers) |
| `user_csuite` | Elena Rostova | Chief Strategy Officer | Level 4 (Full Access / M&A) | 120 chunks (All documents) |

---

## 3. Chaos Injection & Red-Team Testing Matrix

The backend includes a dedicated `/api/chaos/inject` endpoint to simulate enterprise failures during customer live demos and war rooms:

### Drill 1: The Top-K Starvation Probe (Naive vs. AegisRAG)
- **Scenario**: Simulate an Intern querying: *"What are the internal salary bands and executive stock grant targets?"*
- **Action**:
  - Toggle `filter_mode: "naive_post_filter"`: System retrieves Top-10 compensation chunks, wipes them in Python, and returns 0 chunks.
  - Toggle `filter_mode: "aegis_push_down"`: System filters vector index by `intern` bitmask upfront. Zero compensation chunks are examined. The intern receives public career progression guidelines smoothly.
- **Verification**: Zero confidential data touched in HNSW graph traversal.

### Drill 2: Reversible PII Exfiltration Attack
- **Scenario**: Query containing credit card and SSN strings sent through prompt.
- **Action**: Inspect raw payload sent to LLM provider via debug interceptor.
- **Verification**: Payload must contain strictly sanitized tokens (`[SSN_HASH_1]`, `[CC_TOKEN_2]`). Raw strings must never appear in outbox logs.

### Drill 3: Zanzibar Graph Partition / Timeout
- **Scenario**: Inject 100ms artificial latency on Zanzibar graph relationship resolution.
- **Action**: Check if system allows query through.
- **Verification**: Must fail-closed within 15ms with `HTTP 403 Access Denied: Permission resolution timeout`.

---

## 4. War Room Severity Matrix & Escalation Runbook

```
Alert Triggered
  │
  ├── Is it a PII Leakage Warning? ───> SEV-1: Freeze outbound streaming, rotate token salt.
  ├── Is it a ReBAC Graph Timeout? ────> SEV-2: Check SpiceDB/Zanzibar node latency, drain cache.
  └── Is it a Vector Bitmask Mismatch? > SEV-2: Invalidate user permission bitmask cache.
```
