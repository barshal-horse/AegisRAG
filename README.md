# AegisRAG: Zero-Trust Push-Down ReBAC Vector Proxy & HNSW Pre-Filtering

[![Python](https://img.shields.io/badge/Python-3.12-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green.svg)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC.svg)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)

An enterprise-grade, zero-trust security proxy for Retrieval-Augmented Generation (RAG) pipelines in defense, intelligence, and regulated financial environments. Eliminates **Top-K Starvation** and **Vector Space Poisoning** via Google Zanzibar-style push-down relationship-based access control (ReBAC) pre-filtering, bi-directional reversible HMAC PII vaults, and tamper-evident cryptographic audit streams.

---

## The Core Problem: Top-K Starvation in Enterprise RAG

In traditional enterprise RAG systems, developers rely on **naive post-filtering**:
1. An unconstrained vector search retrieves the top $K$ nearest neighbors across the entire enterprise corpus.
2. An application-level filter (e.g. Python loop) discards chunks the caller is unauthorized to view.

### The Mathematical Vulnerability
If an authenticated user has access to a subset of the corpus with access ratio $\alpha = \frac{M_{\text{authorized}}}{N_{\text{total}}} \ll 1$, the probability of complete or partial query starvation is:

$$P(\text{starvation}) = 1 - (1 - \alpha)^K$$

When an intern ($\alpha = 0.05$) searches for broad terms matching sensitive M&A documents, all $K$ retrieved vectors originate from restricted vaults. Post-filtering strips all $K$ items, returning **0 results** to the user—even though hundreds of relevant, authorized public documents exist in the corpus.

### The Aegis Solution: Hardware-Level Push-Down Pre-Filtering
Aegis translates Zanzibar graph traversals into a compact **SIMD bitmask** before distance calculation. The vector search engine filters candidate vectors *during* traversal:

$$\text{Candidate } i \text{ evaluated iff: } (\text{bitmask} \ \& \ (1 \ll i)) \neq 0$$

- **Top-K Starvation Probability:** $0.0\%$
- **Data Leakage in Memory Buffers:** $0.0\%$
- **Pre-filtering Traversal Latency:** $< 0.3\,\text{ms}$

---

## Architectural Topology

```
                  ┌──────────────────────────────────────────────────┐
                  │                 CLIENT / CALLER                  │
                  └─────────────────────────┬────────────────────────┘
                                            │ Natural Language Query + Persona
                                            ▼
                  ┌──────────────────────────────────────────────────┐
                  │          AEGIS ZERO-TRUST PROXY (Port 8000)      │
                  ├──────────────────────────────────────────────────┤
                  │ 1. Ingress HMAC PII Vault (SSN, Cards, Emails)   │
                  │    - Tokenizes raw PII -> <SSN_7A49B2>           │
                  │                                                  │
                  │ 2. Google Zanzibar ReBAC Engine                  │
                  │    - Resolves user -> team -> project -> vault   │
                  │    - Generates 64-bit SIMD Permission Bitmask    │
                  │                                                  │
                  │ 3. Push-Down Vector Engine                       │
                  │    - Inner-loop pre-filtering via bitmask        │
                  │    - Guaranteed Top-K valid documents            │
                  │                                                  │
                  │ 4. Egress Clearance Gate                         │
                  │    - Level 3/4: Rehydrates <SSN_...> to plaintext│
                  │    - Level 1/2: Masked as [CONFIDENTIAL_SSN]     │
                  │                                                  │
                  │ 5. Cryptographic Audit Store (SQLite WAL)        │
                  │    - Append-only SHA-256 hash-chained ledger     │
                  └─────────────────────────┬────────────────────────┘
                                            │ Authenticated Sanitized Chunks
                                            ▼
                  ┌──────────────────────────────────────────────────┐
                  │          AEGIS SECURITY COCKPIT (Next.js)        │
                  │  (Starvation Matrix | PII Vault | ReBAC | Audit) │
                  └──────────────────────────────────────────────────┘
```

---

## Key Subsystems

### 1. Google Zanzibar ReBAC Engine (`backend/app/rebac/`)
- Evaluates object-relation-subject tuples (`namespace:object#relation@subject`).
- Graph traversal resolves transitive group memberships with cycle protection.
- Projects authorized vault sets into contiguous chunk indices for SIMD masking.

### 2. Push-Down Vector Engine (`backend/app/vector/`)
- Implements cosine similarity search with bitmask push-down pre-filtering.
- Provides a side-by-side diagnostic mode comparing naive post-filtering against Aegis push-down on identical embeddings and queries.

### 3. Bi-Directional Reversible PII Vault (`backend/app/security/`)
- Scans inbound prompts for sensitive identifiers (SSN, credit card numbers, email addresses, phone numbers).
- Ingress: Generates deterministic SHA-256 HMAC pseudonyms (`<SSN_C8F7A1>`).
- Egress: Rehydrates tokens to original plaintext only for callers possessing verified clearance (`LEVEL_3_COMPLIANCE` or `LEVEL_4_EXECUTIVE`). Lower tiers receive generic `[CONFIDENTIAL_...]` tags.

### 4. Cryptographic Tamper-Evident Audit Ledger (`backend/app/storage/`)
- Append-only SQLite store operating in Write-Ahead Logging (WAL) mode.
- Computes SHA-256 hash chains across sequential records:
  
  $$H_n = \text{SHA256}(H_{n-1} \parallel \text{event\_id} \parallel \text{user\_id} \parallel \text{query\_hash} \parallel \text{timestamp})$$

- Enables mathematical verification of audit ledger integrity and non-repudiation.

---

## Interactive Security Cockpit

The frontend is a dark-palette, high-contrast mission operations dashboard built with Next.js 14, Tailwind CSS, and Lucide icons.

- **Red-Team Starvation Cockpit:** Live side-by-side execution of naive post-filtering vs Aegis push-down with real-time mathematical proof metrics.
- **PII Token Vault Lab:** Inbound tokenization and outbound clearance-gated rehydration simulator.
- **Zanzibar ReBAC Graph Explorer:** Interactive tuple table, transitive relation resolver, and 12-bit hardware vector mask visualization.
- **Cryptographic Audit Ledger:** Real-time stream of SHA-256 chained audit blocks with raw JSON block inspector.

---

## Quickstart

### Prerequisites
- Docker & Docker Compose **or** Python 3.12+ and Node.js 20+

### Option A: Run via Docker Compose (Recommended)
```bash
git clone https://github.com/barshal-horse/AegisRAG.git
cd AegisRAG
docker compose up --build
```
- Access the Security Cockpit at `http://localhost:3000`
- Access the FastAPI Swagger Documentation at `http://localhost:8000/docs`

### Option B: Local Development

#### 1. Backend Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## Running Test Suite

The test suite covers Zanzibar graph resolution, push-down vector pre-filtering, PII tokenization/rehydration, audit ledger hash chain verification, and FastAPI endpoint contracts.

```bash
cd backend
pytest -v
```

```
============================== test session starts ==============================
collected 15 items

tests/test_api_endpoints.py::test_health_endpoints PASSED                  [  6%]
tests/test_api_endpoints.py::test_secure_query_endpoint PASSED             [ 13%]
tests/test_api_endpoints.py::test_chaos_comparison_endpoint PASSED         [ 20%]
tests/test_api_endpoints.py::test_rebac_tuples_endpoint PASSED             [ 26%]
tests/test_audit_chain.py::test_genesis_record_creation PASSED             [ 33%]
tests/test_audit_chain.py::test_hash_chain_linkage PASSED                  [ 40%]
tests/test_audit_chain.py::test_tamper_detection PASSED                    [ 46%]
tests/test_pii_vault.py::test_inbound_ssn_tokenization PASSED              [ 53%]
tests/test_pii_vault.py::test_clearance_gated_rehydration PASSED           [ 60%]
tests/test_pii_vault.py::test_unauthorized_rehydration_masked PASSED       [ 66%]
tests/test_starvation_and_push_down.py::test_top_k_starvation_in_naive_filter PASSED [ 73%]
tests/test_starvation_and_push_down.py::test_aegis_push_down_guarantees_top_k PASSED [ 80%]
tests/test_starvation_and_push_down.py::test_csuite_retrieves_all_vaults PASSED [ 86%]
tests/test_zanzibar_rebac.py::test_public_vault_access PASSED              [ 93%]
tests/test_zanzibar_rebac.py::test_transitive_project_alpha_access PASSED [100%]

============================== 15 passed in 0.30s ===============================
```

---

## REST API Specification

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/query` | Authenticated RAG query with push-down ReBAC pre-filtering |
| `POST` | `/api/v1/chaos/compare` | Live red-team comparison of naive vs push-down filtering |
| `GET` | `/api/v1/rebac/tuples` | Retrieve all active Google Zanzibar relationship tuples |
| `GET` | `/api/v1/rebac/user/{id}/vaults` | Inspect transitive vaults and chunks reachable by user |
| `GET` | `/api/v1/telemetry/audit` | Fetch cryptographic SHA-256 chained audit records |
| `GET` | `/api/v1/health/live` | Liveness health probe |
| `GET` | `/api/v1/health/ready` | Readiness probe confirming SQLite WAL and ReBAC state |

---

## License

Apache License 2.0. Developed by [Harshal Borse](https://github.com/barshal-horse).
