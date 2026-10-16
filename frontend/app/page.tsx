"use client";

import React, { useState, useEffect } from "react";
import { AegisSidebar } from "../components/AegisSidebar";
import { AegisNavbar } from "../components/AegisNavbar";
import { StarvationView, PRESET_ATTACKS } from "../components/StarvationView";
import { PIIVaultTelemetry } from "../components/PIIVaultTelemetry";
import { ZanzibarGraphViewer } from "../components/ZanzibarGraphViewer";
import { AuditLedgerViewer } from "../components/AuditLedgerViewer";
import { PersonaInfo, PERSONAS } from "../components/PersonaSelector";
import { API_BASE } from "../config/api";

export default function AegisDashboard() {
  const [selectedPersona, setSelectedPersona] = useState<PersonaInfo>(PERSONAS[0]);
  const [query, setQuery] = useState<string>(PRESET_ATTACKS[0].query);
  const [topK, setTopK] = useState<number>(4);
  const [mode, setMode] = useState<"SIDE_BY_SIDE" | "AEGIS_PUSH_DOWN" | "NAIVE_POST_FILTER">("SIDE_BY_SIDE");
  const [activeView, setActiveView] = useState<"STARVATION" | "PII" | "REBAC" | "AUDIT">("STARVATION");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [comparisonData, setComparisonData] = useState<any | null>(null);

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
                chunk_id: "PUB-003",
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
                chunk_id: "PUB-001",
                title: "Global Employee Conduct & Zero-Trust Security Policy",
                content: "All personnel must adhere to least-privilege access rules across all internal environments.",
                classification: "PUBLIC",
                vault_id: "vault_public",
                similarity_score: 0.812,
                rehydrated: false,
              },
              {
                chunk_id: "PUB-002",
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
        execution_time_ms: 0.23,
        audit_event_id: "evt_sim_aegis_" + Math.random().toString(36).substring(7),
        chunks: [
          {
            chunk_id: "PUB-001",
            title: "Global Employee Conduct & Zero-Trust Security Policy",
            content: "All personnel must adhere to least-privilege access rules across all internal environments.",
            classification: "PUBLIC",
            vault_id: "vault_public",
            similarity_score: 0.812,
            rehydrated: false,
          },
          {
            chunk_id: "PUB-002",
            title: "Corporate Expense & Cloud Travel Reimbursement Guidelines",
            content: "Per-diem allowance limits and receipt submission processes for official enterprise travel.",
            classification: "PUBLIC",
            vault_id: "vault_public",
            similarity_score: 0.741,
            rehydrated: false,
          },
          {
            chunk_id: "PUB-003",
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
        } else {
          setComparisonData(generateOfflineComparison(selectedPersona, query, topK));
        }
      } else {
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
          setComparisonData({
            query,
            user_id: selectedPersona.id,
            naive_result: singleResult,
            aegis_result: singleResult,
            mathematical_proof: {
              total_corpus_chunks: 12,
              user_authorized_chunks: selectedPersona.vaults.length * 3,
              alpha_access_ratio: (selectedPersona.vaults.length * 3 / 12).toFixed(3),
              security_verdict: "EXECUTION COMPLETE",
            },
          });
        } else {
          setComparisonData(generateOfflineComparison(selectedPersona, query, topK));
        }
      }
    } catch {
      setComparisonData(generateOfflineComparison(selectedPersona, query, topK));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleExecute();
  }, [selectedPersona.id]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-text-primary font-sans antialiased">
      {/* 1. Deterministic Fixed Sidebar (w-64) */}
      <AegisSidebar
        currentPersona={selectedPersona}
        onSelectPersona={setSelectedPersona}
        activeView={activeView}
        onSelectView={setActiveView}
      />

      {/* 2. Main Workspace Layout */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
        {/* Sticky Telemetry Header (h-14) */}
        <AegisNavbar
          currentPersona={selectedPersona}
          activeView={activeView}
          onRefresh={handleExecute}
          isLoading={isLoading}
        />

        {/* Scrollable Workspace (p-6) */}
        <main className="flex-1 min-w-0 min-h-0 overflow-y-auto p-6 bg-background">
          <div className="max-w-[1600px] mx-auto w-full">
            {activeView === "STARVATION" && (
              <StarvationView
                currentPersona={selectedPersona}
                query={query}
                setQuery={setQuery}
                topK={topK}
                setTopK={setTopK}
                mode={mode}
                setMode={setMode}
                onExecute={handleExecute}
                isLoading={isLoading}
                data={comparisonData}
              />
            )}

            {activeView === "PII" && (
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

            {activeView === "REBAC" && (
              <ZanzibarGraphViewer currentPersona={selectedPersona} />
            )}

            {activeView === "AUDIT" && (
              <AuditLedgerViewer />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
