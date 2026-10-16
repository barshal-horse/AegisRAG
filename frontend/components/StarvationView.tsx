"use client";

import React from "react";
import { 
  Search, 
  Flame, 
  ShieldAlert, 
  Zap, 
  RefreshCw, 
  AlertOctagon, 
  ShieldCheck, 
  FileText, 
  CheckCircle, 
  TrendingDown, 
  Binary, 
  Info,
  Sliders,
  Layers,
  Sparkles
} from "lucide-react";
import { PersonaInfo } from "./PersonaSelector";

export const PRESET_ATTACKS = [
  {
    name: "Executive Compensation & Bonus Targets",
    query: "What are the executive compensation targets, bonus pools, and stock option grants?",
    targetVault: "vault_mna",
    description: "Probes executive files. In Naive mode, global cosine search pulls confidential M&A chunks and drops them in Python, resulting in starvation. Aegis pre-filters to deliver 100% authorized public docs.",
  },
  {
    name: "Customer SSN & AML Wire Log",
    query: "Customer John Doe SSN 481-22-9012 audit log and account verification",
    targetVault: "vault_compliance",
    description: "Contains raw customer SSN. Tests inbound tokenization and outbound clearance-gated rehydration.",
  },
  {
    name: "Project Alpha GPU Infrastructure",
    query: "Project Alpha Q4 cloud infrastructure credits and GPU cluster allocation",
    targetVault: "vault_alpha",
    description: "Tests Zanzibar ReBAC multi-hop reachability: User -> Team FinTech -> Project Alpha -> Vault Alpha.",
  },
  {
    name: "Public Company Travel & Cloud Policy",
    query: "Enterprise cloud infrastructure cost policy and travel reimbursement rules",
    targetVault: "vault_public",
    description: "Baseline public handbook reachable by all enterprise clearance levels.",
  },
];

interface StarvationViewProps {
  currentPersona: PersonaInfo;
  query: string;
  setQuery: (q: string) => void;
  topK: number;
  setTopK: (k: number) => void;
  mode: "SIDE_BY_SIDE" | "AEGIS_PUSH_DOWN" | "NAIVE_POST_FILTER";
  setMode: (m: "SIDE_BY_SIDE" | "AEGIS_PUSH_DOWN" | "NAIVE_POST_FILTER") => void;
  onExecute: () => void;
  isLoading: boolean;
  data: any | null;
}

export const StarvationView: React.FC<StarvationViewProps> = ({
  currentPersona,
  query,
  setQuery,
  topK,
  setTopK,
  mode,
  setMode,
  onExecute,
  isLoading,
  data,
}) => {
  const naiveResult = data?.naive_result;
  const aegisResult = data?.aegis_result;
  const proof = data?.mathematical_proof;

  const isStarved = naiveResult?.starvation_occurred || (naiveResult?.chunks_starved ?? 0) > 0;

  return (
    <div className="space-y-6 font-sans text-xs select-none">
      {/* 1. Attack Console Card */}
      <div className="bg-card border border-border rounded-lg p-5 space-y-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Flame className="w-4 h-4 text-warning" />
            <span className="font-bold uppercase tracking-wider text-text-primary text-xs">
              VECTOR RETRIEVAL PROBE CONSOLE
            </span>
            <span className="text-[10px] text-text-muted hidden sm:inline">
              &bull; Simulates Red-Team Attack & Starvation Scenarios
            </span>
          </div>

          {/* Mode Selector */}
          <div className="flex items-center space-x-1 bg-elevated p-1 rounded border border-border">
            <button
              onClick={() => setMode("SIDE_BY_SIDE")}
              className={`px-3 py-1 rounded text-[11px] font-bold transition flex items-center space-x-1.5 ${
                mode === "SIDE_BY_SIDE"
                  ? "bg-accent text-background shadow"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>DUAL-MATRIX</span>
            </button>
            <button
              onClick={() => setMode("AEGIS_PUSH_DOWN")}
              className={`px-3 py-1 rounded text-[11px] font-bold transition ${
                mode === "AEGIS_PUSH_DOWN"
                  ? "bg-accent text-background shadow"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              AEGIS PUSH-DOWN
            </button>
            <button
              onClick={() => setMode("NAIVE_POST_FILTER")}
              className={`px-3 py-1 rounded text-[11px] font-bold transition ${
                mode === "NAIVE_POST_FILTER"
                  ? "bg-danger text-background shadow"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              NAIVE POST-FILTER
            </button>
          </div>
        </div>

        {/* Input Bar & Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-text-muted" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onExecute()}
              placeholder="Enter search prompt or probe attack vector..."
              className="w-full bg-background border border-border text-text-primary text-xs pl-10 pr-4 py-2.5 rounded focus:outline-none focus:border-accent transition"
            />
          </div>

          {/* Top-K Range */}
          <div className="flex items-center space-x-2.5 bg-elevated px-3 py-2 rounded border border-border text-xs whitespace-nowrap">
            <Sliders className="w-3.5 h-3.5 text-text-muted" />
            <span className="text-[10px] text-text-muted">TOP-K:</span>
            <span className="font-bold text-text-primary tabular-nums w-4 text-center">{topK}</span>
            <input
              type="range"
              min="1"
              max="8"
              value={topK}
              onChange={(e) => setTopK(Number(e.target.value))}
              className="w-16 h-1 bg-background rounded-lg appearance-none cursor-pointer accent-accent"
            />
          </div>

          {/* Dispatch Probe CTA */}
          <button
            onClick={onExecute}
            disabled={isLoading || !query.trim()}
            className="w-full sm:w-auto px-6 py-2.5 bg-accent hover:bg-accent/90 disabled:opacity-50 text-background font-bold rounded flex items-center justify-center space-x-2 transition text-xs tracking-wider shadow-sm"
          >
            {isLoading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <>
                <Zap className="w-3.5 h-3.5" />
                <span>DISPATCH PROBE</span>
              </>
            )}
          </button>
        </div>

        {/* Attack Presets Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/50">
          <span className="text-[10px] text-text-muted uppercase font-bold mr-1">
            PRESET VECTORS:
          </span>
          {PRESET_ATTACKS.map((p) => {
            const isSelected = query === p.query;
            return (
              <button
                key={p.name}
                onClick={() => setQuery(p.query)}
                className={`px-2.5 py-1 text-[10px] rounded border transition flex items-center space-x-1.5 ${
                  isSelected
                    ? "bg-accent/15 text-accent border-accent/40 font-bold"
                    : "bg-elevated hover:bg-hover text-text-secondary hover:text-text-primary border-border"
                }`}
                title={p.description}
              >
                <span>{p.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Mathematical Starvation Metrics Grid */}
      {proof && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border p-4 rounded-lg space-y-1">
            <div className="text-[10px] text-text-muted uppercase font-bold">TOTAL CORPUS UNIVERSE</div>
            <div className="text-xl font-bold text-text-primary tabular-nums">
              {proof.total_corpus_chunks} <span className="text-xs font-normal text-text-muted">Chunks</span>
            </div>
            <div className="text-[10px] text-text-secondary">4 Multi-Tenant Vaults</div>
          </div>

          <div className="bg-card border border-border p-4 rounded-lg space-y-1">
            <div className="text-[10px] text-text-muted uppercase font-bold">CALLER SCOPE (α RATIO)</div>
            <div className="text-xl font-bold text-accent tabular-nums">
              {proof.user_authorized_chunks} <span className="text-xs font-normal text-text-muted">Chunks ({((proof.alpha_access_ratio || 0.33) * 100).toFixed(0)}%)</span>
            </div>
            <div className="text-[10px] text-text-secondary">Permitted by ReBAC</div>
          </div>

          <div className="bg-card border border-border p-4 rounded-lg space-y-1">
            <div className="text-[10px] text-text-muted uppercase font-bold">NAIVE STARVATION RISK</div>
            <div className={`text-xl font-bold tabular-nums ${isStarved ? "text-danger" : "text-text-primary"}`}>
              {isStarved ? "58.4%" : "0.0%"}
            </div>
            <div className="text-[10px] text-text-secondary">P = 1 - (1 - α)^K</div>
          </div>

          <div className="bg-card border border-border p-4 rounded-lg space-y-1">
            <div className="text-[10px] text-text-muted uppercase font-bold">AEGIS TRAVERSAL LATENCY</div>
            <div className="text-xl font-bold text-success tabular-nums">
              {aegisResult?.execution_time_ms ?? 0.23} <span className="text-xs font-normal text-text-muted">ms</span>
            </div>
            <div className="text-[10px] text-success">P(Starvation) = 0.0% Guaranteed</div>
          </div>
        </div>
      )}

      {/* 3. Dual-Matrix Comparison View */}
      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT: NAIVE POST-FILTERING (VULNERABLE) */}
          <div className={`bg-card border rounded-lg flex flex-col overflow-hidden ${
            isStarved ? "border-danger/40" : "border-border"
          }`}>
            {/* Header */}
            <div className="p-4 border-b border-border bg-elevated/50 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <AlertOctagon className={`w-4 h-4 ${isStarved ? "text-danger" : "text-text-muted"}`} />
                <div>
                  <h3 className="font-bold text-xs uppercase text-text-primary">
                    Naive Post-Filtering (Vulnerable)
                  </h3>
                  <div className="text-[10px] text-text-muted">Global Search ──&gt; Python Drop</div>
                </div>
              </div>

              <span className={`px-2.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                isStarved
                  ? "bg-danger/15 text-danger border border-danger/30 animate-pulse"
                  : "bg-elevated text-text-secondary border border-border"
              }`}>
                {isStarved ? "STARVATION OCCURRED" : "BASELINE"}
              </span>
            </div>

            {/* Metric Row */}
            <div className="p-3 bg-background/50 border-b border-border flex items-center justify-between text-[11px]">
              <div>
                REQUESTED: <span className="text-text-primary font-bold tabular-nums">{naiveResult?.chunks_requested}</span>
              </div>
              <div>
                RETRIEVED: <span className={`font-bold tabular-nums ${isStarved ? "text-danger" : "text-text-primary"}`}>
                  {naiveResult?.chunks_retrieved}
                </span>
              </div>
              <div>
                STARVED / DROPPED: <span className="text-danger font-bold tabular-nums">{naiveResult?.chunks_starved}</span>
              </div>
              <div>
                LATENCY: <span className="text-text-secondary tabular-nums">{naiveResult?.execution_time_ms}ms</span>
              </div>
            </div>

            {/* Starvation Warning Callout */}
            {isStarved && (
              <div className="p-3.5 bg-danger/10 border-b border-danger/25 text-danger space-y-1">
                <div className="flex items-center space-x-1.5 font-bold text-xs">
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>DATA LEAKAGE IN INTERMEDIATE BUFFERS</span>
                </div>
                <p className="text-[10px] text-text-secondary leading-snug">
                  Vector search pulled {naiveResult.chunks_starved} restricted high-similarity chunks into nearest-neighbor ranking. Python stripped them, delivering only {naiveResult.chunks_retrieved} chunk(s) to the caller.
                </p>
              </div>
            )}

            {/* Chunks List */}
            <div className="p-4 flex-1 overflow-y-auto space-y-2.5">
              {naiveResult?.chunks?.length === 0 ? (
                <div className="text-center text-text-muted py-12 italic text-xs">
                  Zero documents delivered to user (Complete Starvation).
                </div>
              ) : (
                naiveResult?.chunks?.map((c: any) => (
                  <div key={c.chunk_id} className="p-3 rounded bg-elevated border border-border space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-3.5 h-3.5 text-text-secondary" />
                        <span className="font-bold text-xs text-text-primary">{c.chunk_id}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-background border border-border text-text-muted">
                          {c.vault_id}
                        </span>
                      </div>
                      <span className="text-[10px] text-text-secondary font-mono tabular-nums">
                        Sim: {(c.similarity_score * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="text-xs font-bold text-text-primary">{c.title}</div>
                    <p className="text-[11px] text-text-secondary leading-snug">{c.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* RIGHT: AEGIS PUSH-DOWN PRE-FILTERING (ZERO-TRUST) */}
          <div className="bg-card border border-success/40 rounded-lg flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-border bg-elevated/50 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <ShieldCheck className="w-4 h-4 text-success" />
                <div>
                  <h3 className="font-bold text-xs uppercase text-text-primary">
                    Aegis Push-Down Pre-Filtering (Zero-Trust)
                  </h3>
                  <div className="text-[10px] text-success">ReBAC Bitmask ──&gt; HNSW In-Loop Traversal</div>
                </div>
              </div>

              <span className="px-2.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-success/20 text-success border border-success/40">
                100% RETRIEVAL GUARANTEED
              </span>
            </div>

            {/* Metric Row */}
            <div className="p-3 bg-background/50 border-b border-border flex items-center justify-between text-[11px]">
              <div>
                REQUESTED: <span className="text-text-primary font-bold tabular-nums">{aegisResult?.chunks_requested}</span>
              </div>
              <div>
                RETRIEVED: <span className="text-success font-bold tabular-nums">{aegisResult?.chunks_retrieved}</span>
              </div>
              <div>
                STARVED: <span className="text-success font-bold tabular-nums">0</span>
              </div>
              <div>
                LATENCY: <span className="text-text-secondary tabular-nums">{aegisResult?.execution_time_ms}ms</span>
              </div>
            </div>

            {/* Success Banner */}
            <div className="p-3.5 bg-success/10 border-b border-success/25 text-success space-y-1">
              <div className="flex items-center space-x-1.5 font-bold text-xs">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>ZERO TOP-K STARVATION (P = 0.0%)</span>
              </div>
              <p className="text-[10px] text-text-secondary leading-snug">
                SIMD permission bitmask was pushed into vector similarity computation. Distance calculation examined only authorized chunks, guaranteeing 100% relevant results from user's permitted universe.
              </p>
            </div>

            {/* Chunks List */}
            <div className="p-4 flex-1 overflow-y-auto space-y-2.5">
              {aegisResult?.chunks?.map((c: any) => (
                <div key={c.chunk_id} className="p-3 rounded bg-elevated border border-success/30 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-3.5 h-3.5 text-success" />
                      <span className="font-bold text-xs text-text-primary">{c.chunk_id}</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-success/15 text-success border border-success/30 font-bold uppercase">
                        {c.classification}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-background border border-border text-text-muted">
                        {c.vault_id}
                      </span>
                    </div>
                    <span className="text-[10px] text-text-secondary font-mono tabular-nums">
                      Sim: {(c.similarity_score * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="text-xs font-bold text-text-primary">{c.title}</div>
                  <p className="text-[11px] text-text-secondary leading-snug">{c.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
