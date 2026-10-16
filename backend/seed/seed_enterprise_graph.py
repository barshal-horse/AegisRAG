"""Deterministic Enterprise Seed Corpus & Zanzibar Permission Graph for AegisRAG.

Boots an offline, multi-tier enterprise knowledge base across 4 personas,
4 clearance levels, and 4 access-governed document vaults with embedded PII.
"""

from typing import List
import logging

from app.domain.models import DocumentChunk, ZanzibarTuple
from app.rebac.zanzibar import ZanzibarEngine
from app.vector.engine import VectorSearchEngine

logger = logging.getLogger("aegisrag.seed")


def seed_enterprise_environment(zanzibar: ZanzibarEngine, vector_engine: VectorSearchEngine):
    """Populate Zanzibar relationships and document vector index."""
    logger.info("Seeding enterprise permission graph and document corpus...")

    # 1. Register User Security Clearances
    zanzibar.register_user_clearance("user_intern", "LEVEL_1_PUBLIC")
    zanzibar.register_user_clearance("user_pm", "LEVEL_2_TEAM")
    zanzibar.register_user_clearance("user_auditor", "LEVEL_3_COMPLIANCE")
    zanzibar.register_user_clearance("user_csuite", "LEVEL_4_EXECUTIVE")

    # 2. Write Zanzibar Relationship Tuples
    tuples = [
        # User Intern memberships
        ZanzibarTuple(
            namespace="group", object_id="interns", relation="member",
            subject_namespace="user", subject_id="user_intern"
        ),
        ZanzibarTuple(
            namespace="vault", object_id="vault_public", relation="viewer",
            subject_namespace="group", subject_id="interns", subject_relation="member"
        ),

        # User PM memberships (Project Alpha)
        ZanzibarTuple(
            namespace="team", object_id="fintech", relation="member",
            subject_namespace="user", subject_id="user_pm"
        ),
        ZanzibarTuple(
            namespace="project", object_id="alpha", relation="viewer",
            subject_namespace="team", subject_id="fintech", subject_relation="member"
        ),
        ZanzibarTuple(
            namespace="vault", object_id="vault_alpha", relation="viewer",
            subject_namespace="project", object_id_2="alpha", subject_id="alpha", subject_relation="viewer"
        ) if False else ZanzibarTuple(
            namespace="vault", object_id="vault_alpha", relation="viewer",
            subject_namespace="project", subject_id="alpha", subject_relation="viewer"
        ),
        ZanzibarTuple(
            namespace="vault", object_id="vault_public", relation="viewer",
            subject_namespace="team", subject_id="fintech", subject_relation="member"
        ),

        # User Auditor memberships (Compliance & SOC-2)
        ZanzibarTuple(
            namespace="dept", object_id="compliance", relation="member",
            subject_namespace="user", subject_id="user_auditor"
        ),
        ZanzibarTuple(
            namespace="vault", object_id="vault_compliance", relation="viewer",
            subject_namespace="dept", subject_id="compliance", subject_relation="member"
        ),
        ZanzibarTuple(
            namespace="vault", object_id="vault_public", relation="viewer",
            subject_namespace="dept", subject_id="compliance", subject_relation="member"
        ),

        # User C-Suite memberships (Full Enterprise Clearance)
        ZanzibarTuple(
            namespace="group", object_id="csuite", relation="member",
            subject_namespace="user", subject_id="user_csuite"
        ),
        ZanzibarTuple(
            namespace="vault", object_id="vault_mna", relation="viewer",
            subject_namespace="group", subject_id="csuite", subject_relation="member"
        ),
        ZanzibarTuple(
            namespace="vault", object_id="vault_alpha", relation="viewer",
            subject_namespace="group", subject_id="csuite", subject_relation="member"
        ),
        ZanzibarTuple(
            namespace="vault", object_id="vault_compliance", relation="viewer",
            subject_namespace="group", subject_id="csuite", subject_relation="member"
        ),
        ZanzibarTuple(
            namespace="vault", object_id="vault_public", relation="viewer",
            subject_namespace="group", subject_id="csuite", subject_relation="member"
        ),
    ]

    for t in tuples:
        zanzibar.write_tuple(t)

    # 3. Define Enterprise Document Corpus
    raw_chunks: List[DocumentChunk] = [
        # --- VAULT: PUBLIC (Accessible by All) ---
        DocumentChunk(
            chunk_id="PUB-001",
            title="Enterprise Cloud Infrastructure & Cost Policy",
            content="All engineering teams must adhere to multi-tenant cloud budgeting rules. Standard compute instances are allocated via Kubernetes namespace limits.",
            vault_id="vault_public",
            classification="PUBLIC",
            department="Engineering",
            tags=["cloud", "budget", "policy", "kubernetes", "infrastructure"]
        ),
        DocumentChunk(
            chunk_id="PUB-002",
            title="General Employee Expense & Travel Guidelines",
            content="Travel reimbursements must be filed within 30 days of trip completion. Meals during business travel are capped at $85 per day with itemized receipts.",
            vault_id="vault_public",
            classification="PUBLIC",
            department="Operations",
            tags=["travel", "expense", "policy", "guidelines", "reimbursement"]
        ),
        DocumentChunk(
            chunk_id="PUB-003",
            title="Open-Source Security & Dependency Scanning SOP",
            content="Every pull request requires automated vulnerability scanning via Trivy and SonarQube before deployment to staging clusters.",
            vault_id="vault_public",
            classification="PUBLIC",
            department="Security",
            tags=["security", "open-source", "dependencies", "vulnerability"]
        ),
        DocumentChunk(
            chunk_id="PUB-004",
            title="Intern Career Progression & Learning Stipend",
            content="Interns are eligible for a $1,500 annual learning stipend for cloud certifications and technical books. Mentorship check-ins occur bi-weekly.",
            vault_id="vault_public",
            classification="PUBLIC",
            department="HR",
            tags=["intern", "career", "stipend", "mentorship", "learning"]
        ),

        # --- VAULT: PROJECT ALPHA (Accessible by PM and C-Suite) ---
        DocumentChunk(
            chunk_id="ALP-101",
            title="Project Alpha Q4 Cloud Budget Allocation",
            content="Project Alpha is granted $2.4M in Q4 cloud infrastructure credits for distributed training and GPU cluster reservations across US-East-1.",
            vault_id="vault_alpha",
            classification="PROJECT_ALPHA",
            department="FinTech",
            tags=["project-alpha", "cloud", "budget", "gpu", "q4-allocation"]
        ),
        DocumentChunk(
            chunk_id="ALP-102",
            title="Alpha Next-Gen API Architecture & Latency SLA",
            content="The Alpha transaction pipeline mandates sub-15ms p95 latencies using async streaming gRPC gateways backed by Redis cluster caching.",
            vault_id="vault_alpha",
            classification="PROJECT_ALPHA",
            department="FinTech",
            tags=["project-alpha", "api", "architecture", "grpc", "latency"]
        ),
        DocumentChunk(
            chunk_id="ALP-103",
            title="Project Alpha Core Team Roster & Vendor Billing",
            content="Core contributors include Sarah Chen (Lead) and external consultant David K. Vendor invoices are processed under PO-ALP-90214.",
            vault_id="vault_alpha",
            classification="PROJECT_ALPHA",
            department="FinTech",
            tags=["project-alpha", "roster", "billing", "vendor", "sarah-chen"]
        ),

        # --- VAULT: COMPLIANCE AUDIT (Accessible by Auditor and C-Suite, contains PII) ---
        DocumentChunk(
            chunk_id="AUD-201",
            title="SOC-2 Type II Audit Log & Customer PII Sample",
            content="Audit verification confirmed customer record encryption. Sample test record: Customer John Doe, SSN 481-22-9012, Email john.doe@audit-test.com, Phone 555-123-4567 verified against HSM key vault.",
            vault_id="vault_compliance",
            classification="COMPLIANCE_AUDIT",
            department="Compliance",
            tags=["audit", "soc-2", "pii", "customer", "ssn", "encryption"]
        ),
        DocumentChunk(
            chunk_id="AUD-202",
            title="Anti-Money Laundering (AML) High-Risk Transaction Log",
            content="Flagged wire transaction TX-89218 for $450,000 originating from offshore account. Auditor Marcus Reed assigned for secondary compliance review.",
            vault_id="vault_compliance",
            classification="COMPLIANCE_AUDIT",
            department="Compliance",
            tags=["aml", "compliance", "fraud", "wire", "audit-log"]
        ),

        # --- VAULT: EXECUTIVE RESTRICTED M&A (Accessible ONLY by C-Suite, contains high semantic overlap with budget/comp) ---
        DocumentChunk(
            chunk_id="MNA-301",
            title="Confidential Executive Compensation & Stock Option Targets",
            content="Executive compensation memo: CEO base salary adjusted to $950,000 with 40,000 performance stock units (PSUs). SSN verification: 901-44-3321. Target retention bonus pool set to $12.5M for senior leadership.",
            vault_id="vault_mna",
            classification="EXECUTIVE_RESTRICTED",
            department="Executive",
            tags=["executive", "compensation", "salary", "stock", "bonus", "q4-allocation", "ssn"]
        ),
        DocumentChunk(
            chunk_id="MNA-302",
            title="Project Apex: Target Acquisition Memo ($450M Deal Room)",
            content="Due diligence analysis for the acquisition of CloudSync Corp for $450M cash and stock. Corporate wire accounts authorized with corporate card 4111-2222-3333-4444.",
            vault_id="vault_mna",
            classification="EXECUTIVE_RESTRICTED",
            department="Executive",
            tags=["acquisition", "m-and-a", "apex", "credit-card", "confidential", "budget"]
        ),
        DocumentChunk(
            chunk_id="MNA-303",
            title="C-Suite Severance & Golden Parachute Provisions",
            content="In the event of a change of control, senior executives receive 36 months base salary plus immediate acceleration of unvested equity options.",
            vault_id="vault_mna",
            classification="EXECUTIVE_RESTRICTED",
            department="Executive",
            tags=["executive", "severance", "equity", "compensation", "stock"]
        ),
    ]

    # Map chunks to vaults and upsert to vector store
    for c in raw_chunks:
        zanzibar.map_chunk_to_vault(c.chunk_id, c.vault_id)

    vector_engine.upsert_chunks(raw_chunks)
    logger.info(f"Seeding complete: {len(raw_chunks)} chunks indexed across {len(tuples)} Zanzibar relationship tuples.")
