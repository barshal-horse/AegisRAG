# 02_ADR_ARCHITECTURE: AegisRAG Architecture Decision Records

> **Status**: Accepted & Ratified  
> **System**: AegisRAG (Zero-Trust Push-Down ReBAC Vector Proxy)  
> **Architect**: Harshal Borse (`barshal-horse`), Principal Forward Deployed Engineer

---

## Architecture Decision Record 001: Zanzibar ReBAC vs Traditional RBAC

### Context
Enterprise document permissions in multi-tenant environments cannot be expressed as static roles (e.g. `role: manager`). In practice, access depends on complex transitive relationships:
- *"Harshal is a member of Team A"*,
- *"Team A is an editor of Project Alpha"*,
- *"Project Alpha owns Document 104"*.
Under traditional RBAC, changing team membership requires rewriting thousands of row-level permission tables or building bloated SQL `JOIN` hierarchies.

### Decision
Implement Google Zanzibar-style **Relationship-Based Access Control (ReBAC)** using tuple definitions:
$$\langle \text{object} \rangle \# \langle \text{relation} \rangle @ \langle \text{user} \mid \text{userset} \rangle$$
Examples:
- `doc:104#viewer@project:alpha#member`
- `project:alpha#member@team:quant#member`
- `team:quant#member@user:harshal`

### Consequences
- **Positive**: Dynamic, instantaneous permission changes. Adding Harshal to `team:quant` instantly grants him access to all documents owned by any project that `team:quant` collaborates with—with zero vector index re-indexing!
- **Negative**: Graph expansion introduces recursive traversal overhead. Mitigated via breadth-first search (BFS) memoization and depth limiting ($D \le 6$).

---

## Architecture Decision Record 002: Push-Down HNSW Pre-Filtering vs Post-Filtering

### Context
In standard vector databases (Qdrant, pgvector, FAISS), two filtering strategies exist:
1. **Post-Filtering**: Perform an unconstrained vector search for the Top-$K$ nearest neighbors, then run permission checks on the $K$ returned candidates.
2. **Push-Down Pre-Filtering**: Evaluate permissions upfront into an allowed ID set (bitmask), and pass this bitmask directly to the vector index so the distance calculation graph walk *only visits authorized nodes*.

### Decision
Mandate **Push-Down Pre-Filtering** across all vector search operations. Never allow post-filtering in production.

### Why Post-Filtering Fails (Mathematical Proof of Top-K Starvation)
Let $N$ be the total chunks in the index, $M$ be the chunks authorized for the user, and $K$ be the requested count (e.g., $K = 10$).
If the user only has access to a small fraction of the database:
$$\alpha = \frac{M}{N} \ll 1$$
If a query happens to align closely with confidential executive documents, the probability that an unconstrained vector search retrieves at least one authorized document is:
$$P(\text{at least one match}) = 1 - (1 - \alpha)^K$$
For $\alpha = 0.05$ (user can see 5% of documents) and $K = 10$:
$$P = 1 - (0.95)^{10} = 1 - 0.598 = 40.2\%$$
There is an **almost 60% chance of returning 0 results (total starvation)**, forcing the LLM to hallucinate or falsely claim no knowledge exists.

Under **Push-Down Pre-Filtering**, the search space is bounded to $M$:
$$P(\text{starvation}) = 0 \quad (\forall M \ge K)$$
Every single returned chunk is mathematically guaranteed to be both semantically optimal and authorized.

---

## Architecture Decision Record 003: Bidirectional Reversible PII Token Vault

### Context
Regulated enterprises cannot send unredacted PII (SSNs, Aadhaar numbers, tax IDs, credit cards, emails) to external LLM APIs (Gemini, Claude, GPT-4). However, the end user needs to see the real information in the final response if they possess PII-level clearance.

### Decision
Implement an in-memory, cryptographic token vault:
1. **Sanitization Phase (Inbound)**: High-speed regex + SpaCy/NER replaces PII instances with deterministic tokens:
   - `John Doe` $\to$ `[NAME_d41d8c]`
   - `john@enterprise.com` $\to$ `[EMAIL_098f6b]`
2. **Prompt Assembly**: The LLM processes the prompt seeing only sanitized placeholders.
3. **Rehydration Phase (Outbound Streaming)**: As the LLM streams tokens back, a streaming tokenizer checks the session vault:
   - If `user.has_pii_clearance == True`: Replace token with original plaintext.
   - If `user.has_pii_clearance == False`: Keep token sanitized or display redacted pill (`[REDACTED EMAIL]`).

---

## Architecture Decision Record 004: Fail-Closed Security Proxy Design

### Context
If any subsystem in the security pipeline encounters an exception (e.g., Zanzibar permission service timeout, Redis cache disconnect, PII regex parser memory error), a naive implementation might either crash or fail-open (allowing unverified documents through).

### Decision
Every module in AegisRAG operates on a strict **Fail-Closed** invariant:
- If Zanzibar graph lookup times out after 15ms $\implies$ access is **DENIED** (`403 Forbidden`).
- If vector bitmask generation throws an error $\implies$ return an **EMPTY** authorized set.
- If PII vault throws an error $\implies$ leave text **MASKED** (never leak raw PII).
- Zero silent exceptions: all denials log a structured audit event with trace ID.
