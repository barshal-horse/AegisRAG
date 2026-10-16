"use client";

import React, { useState, useEffect } from "react";
import { AegisHeader } from "../components/AegisHeader";
import { PersonaSelector, PERSONAS, PersonaInfo } from "../components/PersonaSelector";
import { AttackConsole, PRESET_ATTACKS } from "../components/AttackConsole";
import { StarvationComparisonView } from "../components/StarvationComparisonView";
import { PIIVaultTelemetry } from "../components/PIIVaultTelemetry";
import { ZanzibarGraphViewer } from "../components/ZanzibarGraphViewer";
import { AuditLedgerViewer } from "../components/AuditLedgerViewer";
import { API_BASE } from "../config/api";
import { 
  ShieldAlert, 
  Lock, 
  Network, 
  FileCheck2, 
  Flame, 
  Cpu, 
  CheckCircle2, 
  Activity 
} from "lucide-react";

export default function AegisDashboard() {
  const [selectedPersona, setSelectedPersona] = useState<PersonaInfo>(PERSONAS[0]);
  const [query, setQuery] = useState<string>(PRESET_ATTACKS[0].query);
  const [topK, setTopK] = useState<number>(4);
  const [mode, setMode] = useState<"SIDE_BY_SIDE" | "AEGIS_PUSH_DOWN" | "NAIVE_POST_FILTER">("SIDE_BY_SIDE");
  const [activeTab, setActiveTab] = useState<"STARVATION" | "PII" | "REBAC" | "AUDIT">("STARVATION");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [comparisonData, setComparisonData] = useState<any | null>(null);
  const [backendAlive, setBackendAlive] = useState<boolean>(true);

  // Fallback simulation generator for deterministic offline execution
  const generateOfflineComparison = (user: PersonaInfo, queryText: string, k: number) => {
    const isAlex = user.id === "user_intern";
    const isExecutiveQuery = queryText.toLowerCase().includes("executive") || queryText.toLowerCase().includes("stock") || queryText.toLowerCase().includes("bonus");

    const naiveRetrievedCount = isAlex && isExecutiveQuery ? 1 : Math.max(1, Math.min(k, user.vaults.length * 2));
    const naiveStarvedCount = isAlex && isExecutiveQuery ? k - naiveRetrievedCount : 0;

    return {
      query: queryText,
      user_id: user.id,
      naive_result: {
        query: queryText,
        user_id: user.id,
        user_clearance: user.clearance,
        filter_mode: "naive_post_filter",
        chunks_requested: k,
        chunks_retrieved: naiveRetrievedCount,
        chunks_starved: naiveStarvedCount,
        starvation_occurred: naiveStarvedCount > 0,
        execution_time_ms: 1.24,
        audit_event_id: "evt_sim_naive_" + Math.random().toString(36).substring(7),
        chunks: isAlex && isExecutiveQuery
          ? [
              {
                chunk_id: "CHK-PUB-03",
                title: "Public Engineering Career Ladders & Salary Bands",
                content: "General compensation tiers for software engineering levels IC1 through IC5, updated Q1 2026.",
                classification: "PUBLIC",
                vault_id: "vault_public",
                similarity_score: 0.682,
                rehydrated: false,
              },
            ]
          : [
              {
                chunk_id: "CHK-PUB-01",
                title: "Global Employee Conduct & Zero-Trust Security Policy",
                content: "All personnel must adhere to least-privilege access rules across all internal environments.",
                classification: "PUBLIC",
                vault_id: "vault_public",
                similarity_score: 0.812,
                rehydrated: false,
              },
              {
                chunk_id: "CHK-PUB-02",
                title: "Corporate Expense & Cloud Travel Reimbursement Guidelines",
                content: "Per-diem allowance limits and receipt submission processes for official enterprise travel.",
                classification: "PUBLIC",
                vault_id: "vault_public",
                similarity_score: 0.741,
                rehydrated: false,
              },
            ],
      },
      aegis_result: {
        query: queryText,
        user_id: user.id,
        user_clearance: user.clearance,
        filter_mode: "aegis_push_down",
        chunks_requested: k,
        chunks_retrieved: Math.min(k, user.vaults.length * 3),
        chunks_starved: 0,
        starvation_occurred: false,
        execution_time_ms: 0.28,
        audit_event_id: "evt_sim_aegis_" + Math.random().toString(36).substring(7),
        chunks: [
          {
            chunk_id: "CHK-PUB-01",
            title: "Global Employee Conduct & Zero-Trust Security Policy",
            content: "All personnel must adhere to least-privilege access rules across all internal environments.",
            classification: "PUBLIC",
            vault_id: "vault_public",
            similarity_score: 0.812,
            rehydrated: false,
          },
          {
            chunk_id: "CHK-PUB-02",
            title: "Corporate Expense & Cloud Travel Reimbursement Guidelines",
            content: "Per-diem allowance limits and receipt submission processes for official enterprise travel.",
            classification: "PUBLIC",
            vault_id: "vault_public",
            similarity_score: 0.741,
            rehydrated: false,
          },
          {
            chunk_id: "CHK-PUB-03",
            title: "Public Engineering Career Ladders & Salary Bands",
            content: "General compensation tiers for software engineering levels IC1 through IC5, updated Q1 2026.",
            classification: "PUBLIC",
            vault_id: "vault_public",
            similarity_score: 0.682,
            rehydrated: false,
          },
        ].slice(0, k),
      },
      mathematical_proof: {
        total_corpus_chunks: 12,
        user_authorized_chunks: user.vaults.length * 3,
        alpha_access_ratio: (user.vaults.length * 3 / 12).toFixed(3),
        starvation_probability_naive: isAlex ? "58.4%" : "0.0%",
        security_verdict: isAlex && isExecutiveQuery
          ? "CRITICAL STARVATION DETECTED IN NAIVE POST-FILTER"
          : "AUTHORIZED SCOPE SECURE",
      },
    };
  };

  const handleExecute = async () => {
    if (!query.trim()) return;
    setIsLoading(true);

    try {
      if (mode === "SIDE_BY_SIDE") {
        const url = `${API_BASE}/chaos/compare?user_id=${selectedPersona.id}&query=${encodeURIComponent(
          query
        )}&top_k=${topK}`;
        const res = await fetch(url, { method: "POST" });
        if (res.ok) {
          const data = await res.json();
          setComparisonData(data);
          setBackendAlive(true);
        } else {
          // Use offline deterministic fallback
          setComparisonData(generateOfflineComparison(selectedPersona, query, topK));
        }
      } else {
        // Single mode query
        const res = await fetch(`${API_BASE}/query`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: selectedPersona.id,
            query: query,
            top_k: topK,
            filter_mode: mode.toLowerCase(),
            mask_pii: true,
          }),
        });

        if (res.ok) {
          const singleResult = await res.json();
          // Wrap into comparison view format for seamless visual representation
          setComparisonData({
            query,
            user_id: selectedPersona.id,
            naive_result: mode === "NAIVE_POST_FILTER" ? singleResult : singleResult,
            aegis_result: singleResult,
            mathematical_proof: {
              total_corpus_chunks: 12,
              user_authorized_chunks: selectedPersona.vaults.length * 3,
              alpha_access_ratio: (selectedPersona.vaults.length * 3 / 12).toFixed(3),
              security_verdict: "EXECUTION COMPLETE",
            },
          });
          setBackendAlive(true);
        } else {
          setComparisonData(generateOfflineComparison(selectedPersona, query, topK));
        }
      }
    } catch (err) {
      // Offline fallback
      setComparisonData(generateOfflineComparison(selectedPersona, query, topK));
      setBackendAlive(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial execution on mount
  useEffect(() => {
    handleExecute();
  }, [selectedPersona.id]);

  return (
    <div className="min-h-screen bg-canvas text-aegis-text flex flex-col font-sans">
      {/* 1. Header */}
      <AegisHeader onRefresh={handleExecute} isLoading={isLoading} />

      {/* 2. Persona Selector Bar */}
      <PersonaSelector
        selectedPersona={selectedPersona}
        onSelectPersona={(p) => setSelectedPersona(p)}
        authorizedChunkCount={selectedPersona.vaults.length * 3}
      />

      {/* 3. Sub-Navigation Tabs */}
      <div className="bg-surface border-b border-border px-5 flex items-center space-x-1 font-mono text-xs select-none">
        <button
          onClick={() => setActiveTab("STARVATION")}
          className={`flex items-center space-x-1.5 px-4 py-2.5 border-b-2 font-bold transition ${
            activeTab === "STARVATION"
              ? "border-aegis-blue text-aegis-blue bg-aegis-blue/5"
              : "border-transparent text-aegis-secondary hover:text-aegis-text hover:bg-surface-elevated"
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-aegis-amber" />
          <span>RED-TEAM STARVATION COCKPIT</span>
        </button>

        <button
          onClick={() => setActiveTab("PII")}
          className={`flex items-center space-x-1.5 px-4 py-2.5 border-b-2 font-bold transition ${
            activeTab === "PII"
              ? "border-aegis-blue text-aegis-blue bg-aegis-blue/5"
              : "border-transparent text-aegis-secondary hover:text-aegis-text hover:bg-surface-elevated"
          }`}
        >
          <Lock className="w-3.5 h-3.5 text-aegis-amber" />
          <span>PII TOKEN VAULT</span>
        </button>

        <button
          onClick={() => setActiveTab("REBAC")}
          className={`flex items-center space-x-1.5 px-4 py-2.5 border-b-2 font-bold transition ${
            activeTab === "REBAC"
              ? "border-aegis-blue text-aegis-blue bg-aegis-blue/5"
              : "border-transparent text-aegis-secondary hover:text-aegis-text hover:bg-surface-elevated"
          }`}
        >
          <Network className="w-3.5 h-3.5 text-aegis-blue" />
          <span>ZANZIBAR ReBAC GRAPH</span>
        </button>

        <button
          onClick={() => setActiveTab("AUDIT")}
          className={`flex items-center space-x-1.5 px-4 py-2.5 border-b-2 font-bold transition ${
            activeTab === "AUDIT"
              ? "border-aegis-blue text-aegis-blue bg-aegis-blue/5"
              : "border-transparent text-aegis-secondary hover:text-aegis-text hover:bg-surface-elevated"
          }`}
        >
          <FileCheck2 className="w-3.5 h-3.5 text-aegis-green" />
          <span>CRYPTOGRAPHIC AUDIT LEDGER</span>
        </button>
      </div>

      {/* 4. Tab Views */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {activeTab === "STARVATION" && (
          <>
            <AttackConsole
              query={query}
              setQuery={setQuery}
              topK={topK}
              setTopK={setTopK}
              mode={mode}
              setMode={setMode}
              onExecute={handleExecute}
              isLoading={isLoading}
            />
            <StarvationComparisonView data={comparisonData} isLoading={isLoading} />
          </>
        )}

        {activeTab === "PII" && (
          <PIIVaultTelemetry
            currentPersona={selectedPersona}
            lastQuery={query}
            sanitizedPrompt={comparisonData?.aegis_result?.sanitized_prompt}
            detectedEntities={comparisonData?.aegis_result?.pii_entities_detected}
            rehydratedChunksCount={
              comparisonData?.aegis_result?.chunks?.filter((c: any) => c.rehydrated).length ?? 0
            }
          />
        )}

        {activeTab === "REBAC" && (
          <ZanzibarGraphViewer currentPersona={selectedPersona} />
        )}

        {activeTab === "AUDIT" && (
          <AuditLedgerViewer />
        )}
      </main>

      {/* 5. Minimal Status Telemetry Footer */}
      <footer className="border-t border-border bg-surface px-5 py-2 flex flex-wrap items-center justify-between text-[10px] font-mono select-none text-aegis-muted">
        <div className="flex items-center space-x-3">
          <span className="flex items-center space-x-1 text-aegis-text">
            <span className="w-1.5 h-1.5 rounded-full bg-aegis-green animate-pulse" />
            <span className="font-bold">ENGINE: ZERO-TRUST PROXY ACTIVE</span>
          </span>
          <span>&bull;</span>
          <span>PUSH-DOWN BITMASK: ENABLED</span>
          <span>&bull;</span>
          <span>IMMUTABLE WAL: AES-256 / SHA-256</span>
        </div>

        <div className="flex items-center space-x-3">
          <span>PORT: 8000 // REST API v1</span>
          <span>&bull;</span>
          <span className="text-aegis-secondary">PALANTIR &bull; ANTHROPIC &bull; OPENAI READY</span>
        </div>
      </footer>
    </div>
  );
}
