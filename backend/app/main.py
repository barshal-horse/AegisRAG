"""Main Application Entry Point for AegisRAG Backend.

Initializes FastAPI, boots deterministic seed data on startup,
configures CORS, and registers API endpoints.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.api.routes import router
from app.api.dependencies import bootstrap_system

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("aegisrag")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # [FDE-WHY]: Application Bootstrapping
    # Automatically ensures Zanzibar graph and vector index are hydrated
    # with deterministic multi-tenant enterprise seed data on boot.
    logger.info("Initializing AegisRAG Zero-Trust Proxy...")
    bootstrap_system()
    logger.info("AegisRAG ready for authenticated enterprise traffic.")
    yield
    logger.info("AegisRAG shutting down cleanly.")


app = FastAPI(
    title="AegisRAG: Zero-Trust Push-Down ReBAC Vector Proxy",
    version="1.0.0",
    description="Enterprise Zero-Trust RAG Security Proxy with Zanzibar ReBAC, Push-Down Bitmasks, and PII Vault",
    lifespan=lifespan
)

# CORS middleware for Next.js Red-Team Cockpit
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount core routes
app.include_router(router)
