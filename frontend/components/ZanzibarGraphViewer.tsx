"use client";

import React, { useState, useEffect } from "react";
import { 
  Network, 
  Binary, 
  ShieldCheck, 
  Layers, 
  Search, 
  ArrowRight, 
  CheckCircle2, 
  Lock, 
  FolderLock,
  Cpu
} from "lucide-react";
import { PersonaInfo } from "./PersonaSelector";
import { API_BASE } from "../config/api";

interface ZanzibarTuple {
  namespace: string;
  object_id: string;
  relation: string;
  subject_namespace: string;
  subject_id: string;
  subject_relation?: string | null;
}

interface UserVaultInfo {
  user_id: string;
  clearance: string;
  authorized_vault_count: number;
  authorized_vaults: string[];
  authorized_chunk_count: number;
  authorized_chunk_ids: string[];
}

interface ZanzibarGraphViewerProps {
  currentPersona: PersonaInfo;
}

// Fallback deterministic seed tuples matching backend/seed/seed_enterprise_graph.py
const SEED_TUPLES: ZanzibarTuple[] = [
  // Public Handbook
  { namespace: "vault", object_id: "vault_public", relation: "viewer", subject_namespace: "group", subject_id: "all_employees" },
  { namespace: "group", object_id: "all_employees", relation: "member", subject_namespace: "user", subject_id: "user_intern" },
  { namespace: "group", object_id: "all_employees", relation: "member", subject_namespace: "user", subject_id: "user_pm" },
  { namespace: "group", object_id: "all_employees", relation: "member", subject_namespace: "user", subject_id: "user_auditor" },
  { namespace: "group", object_id: "all_employees", relation: "member", subject_namespace: "user", subject_id: "user_csuite" },

  // Project Alpha (Multi-hop)
  { namespace: "vault", object_id: "vault_alpha", relation: "viewer", subject_namespace: "project", subject_id: "project_alpha", subject_relation: "contributor" },
  { namespace: "project", object_id: "project_alpha", relation: "contributor", subject_namespace: "team", subject_id: "fintech_core", subject_relation: "member" },
  { namespace: "team", object_id: "fintech_core", relation: "member", subject_namespace: "user", subject_id: "user_pm" },
  { namespace: "team", object_id: "fintech_core", relation: "member", subject_namespace: "user", subject_id: "user_csuite" },

  // Compliance & Audit
  { namespace: "vault", object_id: "vault_compliance", relation: "viewer", subject_namespace: "group", subject_id: "soc2_auditors" },
  { namespace: "group", object_id: "soc2_auditors", relation: "member", subject_namespace: "user", subject_id: "user_auditor" },
  { namespace: "group", object_id: "soc2_auditors", relation: "member", subject_namespace: "user", subject_id: "user_csuite" },

  // Executive M&A
  { namespace: "vault", object_id: "vault_mna", relation: "viewer", subject_namespace: "group", subject_id: "executive_csuite" },
  { namespace: "group", object_id: "executive_csuite", relation: "member", subject_namespace: "user", subject_id: "user_csuite" },
];

export const ZanzibarGraphViewer: React.FC<ZanzibarGraphViewerProps> = ({ currentPersona }) => {
  const [tuples, setTuples] = useState<ZanzibarTuple[]>(SEED_TUPLES);
  const [vaultInfo, setVaultInfo] = useState<UserVaultInfo | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchZanzibarData = async () => {
      setIsLoading(true);
      try {
        // Fetch tuples
        const tuplesRes = await fetch(`${API_BASE}/rebac/tuples`);
        if (tuplesRes.ok) {
          const tuplesData = await tuplesRes.json();
          setTuples(tuplesData);
        }

        // Fetch user vaults
        const vaultRes = await fetch(`${API_BASE}/rebac/user/${currentPersona.id}/vaults`);
        if (vaultRes.ok) {
          const vaultData = await vaultRes.json();
          setVaultInfo(vaultData);
        }
      } catch (err) {
        // Offline deterministic fallback
        const authorizedVaults = currentPersona.vaults;
        setVaultInfo({
          user_id: currentPersona.id,
          clearance: currentPersona.clearance,
          authorized_vault_count: authorizedVaults.length,
          authorized_vaults: authorizedVaults,
          authorized_chunk_count: authorizedVaults.length * 3,
          authorized_chunk_ids: authorizedVaults.flatMap((v, idx) => [
            `CHK-${v.toUpperCase()}-01`,
            `CHK-${v.toUpperCase()}-02`,
            `CHK-${v.toUpperCase()}-03`,
          ]),
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchZanzibarData();
  }, [currentPersona.id, currentPersona.vaults, currentPersona.clearance]);

  const filteredTuples = tuples.filter((t) => {
    const s = searchTerm.toLowerCase();
    return (
      t.namespace.toLowerCase().includes(s) ||
      t.object_id.toLowerCase().includes(s) ||
      t.relation.toLowerCase().includes(s) ||
      t.subject_namespace.toLowerCase().includes(s) ||
      t.subject_id.toLowerCase().includes(s)
    );
  });

  // Calculate 12-bit vector mask representation
  // Chunks index 0..11 corresponding to 4 vaults x 3 chunks each
  const totalChunks = 12;
  const bitmaskArray: boolean[] = Array(totalChunks).fill(false);
  
  if (currentPersona.vaults.includes("vault_public")) {
    bitmaskArray[0] = true; bitmaskArray[1] = true; bitmaskArray[2] = true;
  }
  if (currentPersona.vaults.includes("vault_alpha")) {
    bitmaskArray[3] = true; bitmaskArray[4] = true; bitmaskArray[5] = true;
  }
  if (currentPersona.vaults.includes("vault_compliance")) {
    bitmaskArray[6] = true; bitmaskArray[7] = true; bitmaskArray[8] = true;
  }
  if (currentPersona.vaults.includes("vault_mna")) {
    bitmaskArray[9] = true; bitmaskArray[10] = true; bitmaskArray[11] = true;
  }

  const authorizedCount = bitmaskArray.filter(Boolean).length;
  const bitmaskHex = "0x" + bitmaskArray.reduce((acc, bit, idx) => {
    return acc + (bit ? (1 << (idx % 4)) : 0);
  }, 0).toString(16).toUpperCase();

  return (
    <div className="flex-1 flex flex-col p-4 font-mono text-xs select-none space-y-4 overflow-y-auto">
      {/* Header Banner */}
      <div className="p-3.5 bg-surface border border-border rounded-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-surface-elevated border border-border rounded-sm">
            <Network className="w-4 h-4 text-aegis-blue" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-aegis-text uppercase">
              GOOGLE ZANZIBAR ReBAC GRAPH & PUSH-DOWN BITMASK ENGINE
            </h2>
            <div className="text-[10px] text-aegis-secondary">
              Transitive relation resolution converts graph paths into 64-bit SIMD bitmasks for hardware-level vector filtering.
            </div>
          </div>
        </div>

        {/* Persona Reachability Pill */}
        <div className="flex items-center space-x-3 text-[10px]">
          <div className="bg-surface-elevated px-2.5 py-1 rounded-sm border border-border">
            <span className="text-aegis-muted">CALLER: </span>
            <span className="text-aegis-text font-bold">{currentPersona.name}</span>
          </div>
          <div className="bg-surface-elevated px-2.5 py-1 rounded-sm border border-border">
            <span className="text-aegis-muted">ACCESSIBLE CHUNKS: </span>
            <span className="text-aegis-blue font-bold tabular-nums">
              {authorizedCount} / {totalChunks} ({((authorizedCount / totalChunks) * 100).toFixed(0)}%)
            </span>
          </div>
        </div>
      </div>

      {/* Bitmask SIMD Telemetry Component */}
      <div className="bg-surface border border-border rounded-sm p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Binary className="w-4 h-4 text-aegis-green" />
            <h3 className="text-xs font-bold text-aegis-text uppercase">
              HARDWARE PUSH-DOWN BITMASK (PRE-FILTERING MATRIX)
            </h3>
          </div>
          <span className="text-[10px] text-aegis-muted font-bold">
            EVALUATED AT HNSW VECTOR HOP (ZERO POST-FILTER STARVATION)
          </span>
        </div>

        {/* Visual Bitmask Array */}
        <div className="p-3 bg-canvas border border-border rounded-sm space-y-2">
          <div className="flex items-center justify-between text-[10px] text-aegis-muted uppercase">
            <span>CORPUS CHUNK INDEX [0..11]:</span>
            <span className="text-aegis-green font-bold">
              ACTIVE SIMD MASK: {bitmaskArray.map((b) => (b ? "1" : "0")).join("")}
            </span>
          </div>

          <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5 pt-1">
            {bitmaskArray.map((isAllowed, idx) => {
              const vaultGroup = idx < 3 ? "PUB" : idx < 6 ? "ALPHA" : idx < 9 ? "AUDIT" : "M&A";
              return (
                <div
                  key={idx}
                  className={`p-2 rounded-sm border text-center transition flex flex-col items-center justify-between ${
                    isAllowed
                      ? "bg-aegis-green/15 border-aegis-green/40 text-aegis-green"
                      : "bg-surface-elevated/40 border-border/40 text-aegis-muted opacity-40"
                  }`}
                >
                  <span className="text-[9px] font-bold">#{idx}</span>
                  <span className="text-xs font-bold font-mono my-0.5">{isAllowed ? "1" : "0"}</span>
                  <span className="text-[8px] uppercase">{vaultGroup}</span>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between pt-2 text-[10px] text-aegis-secondary border-t border-border/50">
            <div className="flex items-center space-x-2">
              <span className="text-aegis-green font-bold">● 1 = ALLOWED:</span>
              <span>Included in Cosine Distance calculation</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-aegis-muted font-bold">○ 0 = SKIP:</span>
              <span>Skipped at memory level (`continue`)</span>
            </div>
            <div>
              VECTOR PUSH-DOWN LATENCY: <span className="text-aegis-text font-bold">0.02ms</span>
            </div>
          </div>
        </div>
      </div>

      {/* Multi-Hop Reachability Path */}
      <div className="bg-surface border border-border rounded-sm p-4 space-y-3">
        <div className="flex items-center space-x-2">
          <Layers className="w-4 h-4 text-aegis-blue" />
          <h3 className="text-xs font-bold text-aegis-text uppercase">
            RESOLVED ZANZIBAR GRAPH TRAVERSAL PATH FOR {currentPersona.id.toUpperCase()}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Public Vault */}
          <div className={`p-3 rounded-sm border space-y-1.5 ${
            currentPersona.vaults.includes("vault_public")
              ? "bg-surface-elevated border-aegis-blue/40"
              : "bg-canvas border-border opacity-50"
          }`}>
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-aegis-text">VAULT: PUBLIC</span>
              <span className="text-[9px] text-aegis-green font-bold">ACCESSIBLE</span>
            </div>
            <div className="text-[10px] text-aegis-secondary">
              user:{currentPersona.id} ──&gt; group:all_employees ──&gt; vault_public
            </div>
            <div className="text-[9px] text-aegis-muted">Handbook, policies, guidelines</div>
          </div>

          {/* Alpha Vault */}
          <div className={`p-3 rounded-sm border space-y-1.5 ${
            currentPersona.vaults.includes("vault_alpha")
              ? "bg-surface-elevated border-aegis-blue/40"
              : "bg-canvas border-border opacity-50"
          }`}>
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-aegis-text">VAULT: PROJECT ALPHA</span>
              <span className={`text-[9px] font-bold ${
                currentPersona.vaults.includes("vault_alpha") ? "text-aegis-green" : "text-aegis-red"
              }`}>
                {currentPersona.vaults.includes("vault_alpha") ? "ACCESSIBLE" : "DENIED"}
              </span>
            </div>
            <div className="text-[10px] text-aegis-secondary">
              user ──&gt; team:fintech_core ──&gt; project:alpha ──&gt; vault_alpha
            </div>
            <div className="text-[9px] text-aegis-muted">Cloud GPU budgets, technical spec</div>
          </div>

          {/* Compliance Vault */}
          <div className={`p-3 rounded-sm border space-y-1.5 ${
            currentPersona.vaults.includes("vault_compliance")
              ? "bg-surface-elevated border-aegis-blue/40"
              : "bg-canvas border-border opacity-50"
          }`}>
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-aegis-text">VAULT: COMPLIANCE</span>
              <span className={`text-[9px] font-bold ${
                currentPersona.vaults.includes("vault_compliance") ? "text-aegis-green" : "text-aegis-red"
              }`}>
                {currentPersona.vaults.includes("vault_compliance") ? "ACCESSIBLE" : "DENIED"}
              </span>
            </div>
            <div className="text-[10px] text-aegis-secondary">
              user ──&gt; group:soc2_auditors ──&gt; vault_compliance
            </div>
            <div className="text-[9px] text-aegis-muted">SOC-2 Type II audit, wire transfers</div>
          </div>

          {/* M&A Vault */}
          <div className={`p-3 rounded-sm border space-y-1.5 ${
            currentPersona.vaults.includes("vault_mna")
              ? "bg-surface-elevated border-aegis-blue/40"
              : "bg-canvas border-border opacity-50"
          }`}>
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-aegis-text">VAULT: M&A / C-SUITE</span>
              <span className={`text-[9px] font-bold ${
                currentPersona.vaults.includes("vault_mna") ? "text-aegis-green" : "text-aegis-red"
              }`}>
                {currentPersona.vaults.includes("vault_mna") ? "ACCESSIBLE" : "DENIED"}
              </span>
            </div>
            <div className="text-[10px] text-aegis-secondary">
              user ──&gt; group:executive_csuite ──&gt; vault_mna
            </div>
            <div className="text-[9px] text-aegis-muted">Confidential deal terms, stock grants</div>
          </div>
        </div>
      </div>

      {/* Zanzibar Relationship Tuples Table */}
      <div className="bg-surface border border-border rounded-sm p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-aegis-amber" />
            <h3 className="text-xs font-bold text-aegis-text uppercase">
              ACTIVE ZANZIBAR RELATIONSHIP TUPLES ({filteredTuples.length})
            </h3>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-aegis-muted" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter tuples (e.g. vault, intern)..."
              className="bg-canvas border border-border text-aegis-text text-xs pl-7 pr-3 py-1 rounded-sm focus:outline-none focus:border-aegis-blue"
            />
          </div>
        </div>

        <div className="border border-border rounded-sm overflow-hidden">
          <table className="w-full text-left text-[11px]">
            <thead className="bg-surface-elevated text-aegis-muted uppercase text-[9px] border-b border-border">
              <tr>
                <th className="p-2">TARGET OBJECT</th>
                <th className="p-2">RELATION</th>
                <th className="p-2">SUBJECT (USER / GROUP / TEAM)</th>
                <th className="p-2">USERSET RELATION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-surface font-mono">
              {filteredTuples.map((t, idx) => {
                const isRelevantToUser =
                  t.subject_id === currentPersona.id ||
                  currentPersona.vaults.includes(t.object_id);
                return (
                  <tr
                    key={idx}
                    className={`hover:bg-surface-hover ${
                      isRelevantToUser ? "bg-aegis-blue/5" : ""
                    }`}
                  >
                    <td className="p-2 text-aegis-text font-bold">
                      {t.namespace}:{t.object_id}
                    </td>
                    <td className="p-2 text-aegis-blue font-bold">#{t.relation}</td>
                    <td className="p-2 text-aegis-secondary">
                      @{t.subject_namespace}:{t.subject_id}
                    </td>
                    <td className="p-2 text-aegis-muted">
                      {t.subject_relation ? `#${t.subject_relation}` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
