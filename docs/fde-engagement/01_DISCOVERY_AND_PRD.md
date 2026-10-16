# 01_DISCOVERY_AND_PRD: AegisRAG — Zero-Trust Push-Down ReBAC Vector Proxy

> **Confidentiality**: Enterprise Forward Deployed Engineering Deliverable  
> **Classification**: Defense / Healthcare / Multi-Tenant Tier-1 Financial Architecture  
> **Author**: Harshal Borse (`barshal-horse`), Principal FDE  
> **Status**: Approved for Implementation

---

## 1. Executive Summary & Client Discovery Brief

### 1.1 The Client's Dilemma
A global enterprise client ($50B+ AUM financial conglomerate and defense contractor) wants to deploy an enterprise-wide RAG knowledge engine across 50,000 employees. Their internal knowledge base contains 10,000,000+ unstructured document chunks spanning:
1. Public company handbook & technical documentation (accessible by all).
2. Departmental projects (Engineering, Compliance, Sales).
3. Highly restricted deal rooms (M&A target memos, board minutes, executive compensation, classified customer PII).

### 1.2 The Production Showstopper
When the client's internal team attempted a standard vector RAG pilot using off-the-shelf tooling (LangChain + Pinecone + Python post-filtering), the deployment was terminated by the Chief Information Security Officer (CISO) for two critical reasons:
1. **Critical Vulnerability (Top-K Starvation)**: When regular employees searched for broad operational topics like "Q4 cloud budget allocation", the vector search returned 10 chunks, 9 of which were top-secret executive compensation files. The Python layer filtered out the 9 unauthorized chunks, leaving only 1 chunk or zero chunks. The system replied: *"I don't have enough information,"* even though 400 authorized departmental budget chunks existed!
2. **Data Leakage Risk (PII in Cloud LLM Contexts)**: Raw customer SSNs, credit card numbers, and patient record identifiers were being transmitted verbatim to external cloud model providers, violating GDPR, HIPAA, and SOC-2 Type II standards.

---

## 2. Product Requirements Document (PRD)

### 2.1 Core Personas & Access Hierarchy
- **Persona A: General Employee (`eng.intern`)**: Can access public and assigned team documents. Restricted from compensation, audit, and M&A.
- **Persona B: Project Manager (`lead.fin`)**: Inherits transitive permissions over active project workspaces through organization graph edges.
- **Persona C: Compliance Officer (`officer.audit`)**: Dynamic temporal access to audit trail logs and regulatory filings across multiple entities.
- **Persona D: Executive (`csuite.admin`)**: Full clearance across enterprise vaults.

### 2.2 Functional Requirements (P0 Must-Haves)
1. **Relationship-Based Access Control (ReBAC)**: Google Zanzibar-inspired tuple relationship model (`user:X#relation@object:Y`) evaluated dynamically as a directed permission graph (SpiceDB / OpenFGA standard).
2. **Push-Down Pre-Filtering Bitmasks**: Vector similarity search must NEVER fetch unauthorized chunks. The permission resolution engine must push an authorized document bitmask directly into the vector database index traversal (HNSW graph exploration) so that 100% of the returned Top-$K$ items are guaranteed to be pre-authorized.
3. **Zero Top-K Starvation**: An authorized query must always return the true Top-$K$ relevant chunks within the user's permissible universe, regardless of how many higher-similarity unauthorized documents exist.
4. **Bidirectional Reversible PII Masking Vault**:
   - Inbound: Deterministic regex and NER entity extraction replacing PII with secure synthetic tokens (`<PERSON_1>`, `<SSN_UUID>`, `<EMAIL_HASH>`).
   - Outbound: Streaming token rehydration vault replacing tokens with original text only if the user holds PII viewing clearance.
5. **Auditable Outbox Telemetry**: Every query, permission graph check, similarity score, and retrieved document hash must be logged to an immutable SQLite/Postgres audit ledger with SHA-256 integrity hashing.

### 2.3 Non-Functional Requirements (SLAs & Latency Budgets)
| Operation | Latency Budget (p95) | Target Throughput | Failure Behavior |
| :--- | :--- | :--- | :--- |
| **ReBAC Graph Check** | $\le 12\text{ms}$ | 5,000 checks/sec | Fail-Closed (Deny access) |
| **Push-Down Vector Search** | $\le 35\text{ms}$ | 1,000 queries/sec | Return authorized Top-K only |
| **Inbound PII Tokenization** | $\le 8\text{ms}$ | 100KB payload | Fail-Closed (Mask all potential matches) |
| **Outbound Rehydration** | $\le 5\text{ms}$ | Streaming tokens | Deliver masked tokens if vault fails |
| **End-to-End Latency** | $\le 800\text{ms}$ (incl. LLM) | 200 concurrent streams | Transparent error status |

---

## 3. Threat Model & Failure Mode Analysis (STRIDE Matrix)

| Threat Category | Potential Attack Vector | AegisRAG Mitigation Strategy |
| :--- | :--- | :--- |
| **Spoofing** | Forged JWT claims or tenant headers | Cryptographic JWT signature verification against public JWKS + token-bound tenant isolation. |
| **Tampering** | Modifying chunk permission IDs in transit | Immutable permission tuples sealed in database; vector chunk payload bound to tuple hash. |
| **Repudiation** | User denies reading classified document | SHA-256 logged audit ledger recording `(user_id, chunk_id, timestamp, query_hash)`. |
| **Information Disclosure** | Top-K starvation probing & side-channel leak | Push-down bitmask: unpermitted chunks are mathematically invisible in graph traversal. Zero metadata leaked. |
| **Denial of Service** | Deep recursive graph loops in permission checks | Maximum traversal depth limit ($D \le 6$) with cycle detection and memoized intermediate sets. |
| **Elevation of Privilege** | Transitive edge hijacking across team boundaries | Zanzibar relation set algebra: explicit relation definitions (`owner`, `editor`, `viewer`) with strict derivation rules. |
