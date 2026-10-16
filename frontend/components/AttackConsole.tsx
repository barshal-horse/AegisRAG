"use client";

import React from "react";
import { Search, Flame, ShieldAlert, Cpu, ArrowRight, RefreshCw, Zap } from "lucide-react";

export const PRESET_ATTACKS = [
  {
    name: "TOP-K STARVATION PROBE",
    query: "What are the executive compensation targets, bonus pools, and stock option grants?",
    description: "Probes executive files. In Naive mode, unconstrained search pulls confidential M&A chunks and deletes them in Python, returning 0 or 1 chunk (starvation). In Aegis mode, push-down pre-filtering delivers 100% authorized public docs.",
    target: "starvation",
  },
  {
    name: "PII EXFILTRATION PROBE",
    query: "Customer John Doe SSN 481-22-9012 audit log and account verification",
    description: "Contains raw SSN. Tests inbound tokenization (<SSN_...>) and verifies whether user's clearance allows outbound plaintext rehydration.",
    target: "pii",
  },
  {
    name: "TRANSITIVE ALPHA ACCESS",
    query: "Project Alpha Q4 cloud infrastructure credits and GPU cluster allocation",
    description: "Tests Zanzibar ReBAC multi-hop graph reachability (User -> Team FinTech -> Project Alpha -> Vault Alpha).",
    target: "rebac",
  },
  {
    name: "PUBLIC POLICIES",
    query: "Enterprise cloud infrastructure cost policy and travel reimbursement rules",
    description: "Baseline public documentation reachable by all clearance levels.",
    target: "public",
  },
];

interface AttackConsoleProps {
  query: string;
  setQuery: (q: string) => void;
  topK: number;
  setTopK: (k: number) => void;
  mode: "SIDE_BY_SIDE" | "AEGIS_PUSH_DOWN" | "NAIVE_POST_FILTER";
  setMode: (m: "SIDE_BY_SIDE" | "AEGIS_PUSH_DOWN" | "NAIVE_POST_FILTER") => void;
  onExecute: () => void;
  isLoading: boolean;
}

export const AttackConsole: React.FC<AttackConsoleProps> = ({
  query,
  setQuery,
  topK,
  setTopK,
  mode,
  setMode,
  onExecute,
  isLoading,
}) => {
  return (
    <div className="bg-surface border-b border-border p-4 font-mono text-xs select-none space-y-3">
      {/* Attack / Diagnostic Presets */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <span className="text-[10px] text-aegis-muted uppercase tracking-wider font-bold flex items-center space-x-1">
            <Flame className="w-3 h-3 text-aegis-amber" />
            <span>RED-TEAM PROBE PRESETS:</span>
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {PRESET_ATTACKS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => setQuery(preset.query)}
                className={`px-2.5 py-1 text-[10px] rounded-sm border transition ${
                  query === preset.query
                    ? "bg-aegis-amber/20 text-aegis-amber border-aegis-amber/50 font-bold"
                    : "bg-surface-elevated hover:bg-surface-hover text-aegis-secondary hover:text-aegis-text border-border"
                }`}
                title={preset.description}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center space-x-1 bg-surface-elevated p-0.5 rounded-sm border border-border text-[11px]">
          <button
            onClick={() => setMode("SIDE_BY_SIDE")}
            className={`px-2.5 py-1 rounded-sm font-bold transition flex items-center space-x-1 ${
              mode === "SIDE_BY_SIDE"
                ? "bg-aegis-blue text-canvas"
                : "text-aegis-secondary hover:text-aegis-text"
            }`}
          >
            <ShieldAlert className="w-3 h-3" />
            <span>SIDE-BY-SIDE DIAGNOSTIC</span>
          </button>
          <button
            onClick={() => setMode("AEGIS_PUSH_DOWN")}
            className={`px-2.5 py-1 rounded-sm font-bold transition ${
              mode === "AEGIS_PUSH_DOWN"
                ? "bg-aegis-blue text-canvas"
                : "text-aegis-secondary hover:text-aegis-text"
            }`}
          >
            AEGIS ONLY
          </button>
          <button
            onClick={() => setMode("NAIVE_POST_FILTER")}
            className={`px-2.5 py-1 rounded-sm font-bold transition ${
              mode === "NAIVE_POST_FILTER"
                ? "bg-aegis-red text-canvas"
                : "text-aegis-secondary hover:text-aegis-text"
            }`}
          >
            NAIVE ONLY
          </button>
        </div>
      </div>

      {/* Query Bar & Controls */}
      <div className="flex flex-col sm:flex-row items-center gap-2">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-aegis-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onExecute()}
            placeholder="Enter search prompt or probe attack vector..."
            className="w-full bg-canvas border border-border text-aegis-text text-xs pl-9 pr-3 py-2 rounded-sm focus:outline-none focus:border-aegis-blue"
          />
        </div>

        {/* Top-K Selector */}
        <div className="flex items-center space-x-2 bg-surface-elevated px-3 py-1.5 rounded-sm border border-border text-xs whitespace-nowrap">
          <span className="text-[10px] text-aegis-muted">TOP-K:</span>
          <span className="font-bold text-aegis-text tabular-nums">{topK}</span>
          <input
            type="range"
            min="1"
            max="8"
            value={topK}
            onChange={(e) => setTopK(Number(e.target.value))}
            className="w-16 h-1 bg-canvas rounded-lg appearance-none cursor-pointer accent-aegis-blue"
          />
        </div>

        {/* Execute Button */}
        <button
          onClick={onExecute}
          disabled={isLoading || !query.trim()}
          className="w-full sm:w-auto px-5 py-2 bg-aegis-blue hover:bg-aegis-blue/90 disabled:opacity-50 text-canvas font-bold rounded-sm flex items-center justify-center space-x-1.5 transition text-xs tracking-wider"
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
    </div>
  );
};
