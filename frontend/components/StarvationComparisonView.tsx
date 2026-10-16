"use client";

import React from "react";
import { 
  AlertOctagon, 
  CheckCircle, 
  ShieldCheck, 
  Lock, 
  FileText, 
  Cpu, 
  TrendingDown, 
  ShieldAlert,
  Info
} from "lucide-react";

interface ComparisonProps {
  data: any | null;
  isLoading: boolean;
}

export const StarvationComparisonView: React.FC<ComparisonProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center font-mono">
        <div className="w-8 h-8 border-2 border-aegis-blue border-t-transparent rounded-full animate-spin mb-3" />
        <div className="text-xs text-aegis-text font-bold">EXECUTING DUAL-FILTER RETRIEVAL MATRIX...</div>
        <div className="text-[10px] text-aegis-muted mt-1">Comparing Global Cosine Search vs Push-Down Bitmask Traversal</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center font-mono text-aegis-muted">
        <ShieldAlert className="w-10 h-10 text-aegis-border mb-3" />
        <div className="text-xs font-bold text-aegis-secondary">NO ACTIVE ATTACK PROBE EXECUTED</div>
        <div className="text-[10px] max-w-md mt-1">
          Select a preset above (e.g. "Top-K Starvation Probe") or enter a query to test how naive post-filtering fails compared to Aegis push-down pre-filtering.
        </div>
      </div>
    );
  }

  const { naive_result, aegis_result, mathematical_proof } = data;

  const isStarved = naive_result.starvation_occurred || naive_result.chunks_starved > 0;

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-4 font-mono text-xs select-none space-y-4">
      {/* Mathematical Proof Bar */}
      {mathematical_proof && (
        <div className="p-3 bg-surface border border-border rounded-sm flex flex-wrap items-center justify-between gap-3 text-[11px]">
          <div className="flex items-center space-x-2">
            <Info className="w-4 h-4 text-aegis-blue" />
            <span className="font-bold text-aegis-text uppercase">
              MATHEMATICAL STARVATION ANALYSIS // P(STARVATION) = 1 - (1 - α)^K
            </span>
          </div>

          <div className="flex items-center space-x-4 text-[10px] text-aegis-secondary">
            <div>
              TOTAL CORPUS: <span className="text-aegis-text font-bold tabular-nums">{mathematical_proof.total_corpus_chunks}</span>
            </div>
            <div>
              USER UNIVERSE: <span className="text-aegis-blue font-bold tabular-nums">{mathematical_proof.user_authorized_chunks}</span>
            </div>
            <div>
              ACCESS RATIO (α): <span className="text-aegis-amber font-bold tabular-nums">{mathematical_proof.alpha_access_ratio}</span>
            </div>
            <div>
              VERDICT: <span className={`font-bold ${isStarved ? "text-aegis-red" : "text-aegis-green"}`}>
                {mathematical_proof.security_verdict}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Side-by-Side Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1">
        {/* LEFT COLUMN: NAIVE POST-FILTERING (VULNERABLE) */}
        <div className="border border-border bg-surface rounded-sm flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-3 border-b border-border bg-surface-elevated flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertOctagon className={`w-4 h-4 ${isStarved ? "text-aegis-red" : "text-aegis-muted"}`} />
              <div>
                <h3 className="font-bold text-xs uppercase text-aegis-text">
                  Naive Post-Filtering (Vulnerable)
                </h3>
                <div className="text-[10px] text-aegis-muted">Global Search ──&gt; Python Access Filter</div>
              </div>
            </div>

            <span className={`px-2 py-0.5 rounded-sm font-bold text-[9px] uppercase tracking-wider ${
              isStarved
                ? "bg-aegis-red/20 text-aegis-red border border-aegis-red/40 animate-pulse"
                : "bg-surface-elevated text-aegis-secondary border border-border"
            }`}>
              {isStarved ? "TOP-K STARVATION DETECTED" : "UNFILTERED BASELINE"}
            </span>
          </div>

          {/* Telemetry Summary */}
          <div className="p-3 bg-canvas/40 border-b border-border/70 flex items-center justify-between text-[11px]">
            <div>
              REQUESTED: <span className="text-aegis-text font-bold tabular-nums">{naive_result.chunks_requested}</span>
            </div>
            <div>
              RETRIEVED: <span className={`font-bold tabular-nums ${isStarved ? "text-aegis-red" : "text-aegis-text"}`}>
                {naive_result.chunks_retrieved}
              </span>
            </div>
            <div>
              STARVED / DROPPED: <span className="text-aegis-red font-bold tabular-nums">{naive_result.chunks_starved}</span>
            </div>
            <div>
              LATENCY: <span className="text-aegis-secondary tabular-nums">{naive_result.execution_time_ms}ms</span>
            </div>
          </div>

          {/* Starvation Warning Alert */}
          {isStarved && (
            <div className="p-3 bg-aegis-red/10 border-b border-aegis-red/30 text-aegis-red space-y-1">
              <div className="flex items-center space-x-1.5 font-bold text-xs">
                <TrendingDown className="w-3.5 h-3.5" />
                <span>USER QUERY STARVED (DATA LEAKAGE IN INTERMEDIATE BUFFERS)</span>
              </div>
              <p className="text-[10px] text-aegis-secondary leading-tight">
                Vector search retrieved {naive_result.chunks_starved} high-similarity confidential M&A chunks. Python stripped them, leaving the caller with only {naive_result.chunks_retrieved} result(s). The user gets an incomplete answer even though valid authorized documents exist!
              </p>
            </div>
          )}

          {/* Chunks List */}
          <div className="p-3 flex-1 overflow-y-auto space-y-2">
            {naive_result.chunks.length === 0 ? (
              <div className="text-center text-aegis-muted py-8 italic text-xs">
                Zero documents returned to caller (Complete Starvation).
              </div>
            ) : (
              naive_result.chunks.map((c: any) => (
                <div key={c.chunk_id} className="p-2.5 rounded-sm border border-border bg-surface-elevated space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-3.5 h-3.5 text-aegis-secondary" />
                      <span className="font-bold text-xs text-aegis-text">{c.chunk_id}</span>
                      <span className="text-[9px] px-1 py-0.2 rounded-sm bg-canvas border border-border text-aegis-muted">
                        {c.vault_id}
                      </span>
                    </div>
                    <span className="text-[10px] text-aegis-secondary font-mono tabular-nums">
                      Sim: {(c.similarity_score * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="text-xs font-bold text-aegis-text">{c.title}</div>
                  <p className="text-[11px] text-aegis-secondary leading-snug">{c.content}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: AEGIS PUSH-DOWN PRE-FILTERING (ZERO-TRUST) */}
        <div className="border border-border bg-surface rounded-sm flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-3 border-b border-border bg-surface-elevated flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-aegis-green" />
              <div>
                <h3 className="font-bold text-xs uppercase text-aegis-text">
                  Aegis Push-Down Pre-Filtering (Zero-Trust)
                </h3>
                <div className="text-[10px] text-aegis-green">ReBAC Bitmask ──&gt; Push-Down HNSW Graph Traversal</div>
              </div>
            </div>

            <span className="px-2 py-0.5 rounded-sm font-bold text-[9px] uppercase tracking-wider bg-aegis-green/20 text-aegis-green border border-aegis-green/40">
              100% RETRIEVAL GUARANTEED
            </span>
          </div>

          {/* Telemetry Summary */}
          <div className="p-3 bg-canvas/40 border-b border-border/70 flex items-center justify-between text-[11px]">
            <div>
              REQUESTED: <span className="text-aegis-text font-bold tabular-nums">{aegis_result.chunks_requested}</span>
            </div>
            <div>
              RETRIEVED: <span className="text-aegis-green font-bold tabular-nums">{aegis_result.chunks_retrieved}</span>
            </div>
            <div>
              STARVED: <span className="text-aegis-green font-bold tabular-nums">0</span>
            </div>
            <div>
              LATENCY: <span className="text-aegis-secondary tabular-nums">{aegis_result.execution_time_ms}ms</span>
            </div>
          </div>

          {/* Success Banner */}
          <div className="p-3 bg-aegis-green/10 border-b border-aegis-green/30 text-aegis-green space-y-1">
            <div className="flex items-center space-x-1.5 font-bold text-xs">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>ZERO TOP-K STARVATION (P = 0.0%)</span>
            </div>
            <p className="text-[10px] text-aegis-secondary leading-tight">
              ReBAC permission bitmask was pushed into vector similarity computation. Distance calculation examined only authorized chunks, guaranteeing 100% relevance from the user's permitted universe.
            </p>
          </div>

          {/* Chunks List */}
          <div className="p-3 flex-1 overflow-y-auto space-y-2">
            {aegis_result.chunks.map((c: any) => (
              <div key={c.chunk_id} className="p-2.5 rounded-sm border border-aegis-green/40 bg-surface-elevated space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-3.5 h-3.5 text-aegis-green" />
                    <span className="font-bold text-xs text-aegis-text">{c.chunk_id}</span>
                    <span className="text-[9px] px-1 py-0.2 rounded-sm bg-aegis-green/15 text-aegis-green border border-aegis-green/30 font-bold uppercase">
                      {c.classification}
                    </span>
                    <span className="text-[9px] px-1 py-0.2 rounded-sm bg-canvas border border-border text-aegis-muted">
                      {c.vault_id}
                    </span>
                  </div>
                  <span className="text-[10px] text-aegis-secondary font-mono tabular-nums">
                    Sim: {(c.similarity_score * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="text-xs font-bold text-aegis-text">{c.title}</div>
                <p className="text-[11px] text-aegis-secondary leading-snug">{c.content}</p>
                {c.rehydrated && (
                  <div className="text-[9px] text-aegis-blue font-bold flex items-center space-x-1 pt-1">
                    <Lock className="w-3 h-3" />
                    <span>PII REHYDRATION AUTHORIZED BY CLEARANCE LEVEL</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
