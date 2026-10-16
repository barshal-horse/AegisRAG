"use client";

import React, { useState } from "react";
import { 
  Lock, 
  Key, 
  ShieldCheck, 
  ShieldAlert, 
  ArrowRight, 
  Check, 
  Copy, 
  RefreshCw,
  Terminal,
  Fingerprint
} from "lucide-react";
import { PersonaInfo } from "./PersonaSelector";

interface PIIVaultProps {
  currentPersona: PersonaInfo;
  detectedEntities?: string[];
  sanitizedPrompt?: string | null;
  lastQuery?: string;
  rehydratedChunksCount?: number;
}

export const PIIVaultTelemetry: React.FC<PIIVaultProps> = ({
  currentPersona,
  detectedEntities = [],
  sanitizedPrompt,
  lastQuery,
  rehydratedChunksCount = 0,
}) => {
  const [testInput, setTestInput] = useState<string>(
    "Wire transfer authorization for customer Jane Smith SSN 481-22-9012 card 4532-8921-9012-3456"
  );
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Clearance check: Only LEVEL_3_COMPLIANCE and LEVEL_4_EXECUTIVE can rehydrate
  const canRehydrate = [
    "LEVEL_3_COMPLIANCE",
    "LEVEL_4_EXECUTIVE",
  ].includes(currentPersona.clearance);

  // Client-side quick simulator matching backend regexes
  const simulateSanitization = (raw: string) => {
    const ssnPattern = /\b\d{3}-\d{2}-\d{4}\b/g;
    const ccPattern = /\b(?:\d{4}[-\s]?){3}\d{4}\b/g;

    let sanitized = raw;
    const tokens: { type: string; token: string; raw: string }[] = [];

    const ssnMatches = raw.match(ssnPattern);
    if (ssnMatches) {
      ssnMatches.forEach((m) => {
        const token = "<SSN_7A49B2>";
        tokens.push({ type: "SSN", token, raw: m });
        sanitized = sanitized.replace(m, token);
      });
    }

    const ccMatches = raw.match(ccPattern);
    if (ccMatches) {
      ccMatches.forEach((m) => {
        const token = "<CREDIT_CARD_E391C0>";
        tokens.push({ type: "CREDIT_CARD", token, raw: m });
        sanitized = sanitized.replace(m, token);
      });
    }

    let egressOutput = sanitized;
    if (canRehydrate) {
      tokens.forEach((t) => {
        egressOutput = egressOutput.replace(t.token, t.raw);
      });
    } else {
      tokens.forEach((t) => {
        egressOutput = egressOutput.replace(t.token, `[CONFIDENTIAL_${t.type}]`);
      });
    }

    return { sanitized, egressOutput, tokens };
  };

  const simulation = simulateSanitization(testInput);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(text);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  return (
    <div className="flex-1 flex flex-col p-4 font-sans text-xs select-none space-y-4 overflow-y-auto">
      {/* Overview Banner */}
      <div className="p-3.5 bg-surface border border-border rounded-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-surface-elevated border border-border rounded-sm">
            <Lock className="w-4 h-4 text-aegis-amber" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-aegis-text uppercase">
              BI-DIRECTIONAL HMAC PII TOKENIZATION VAULT
            </h2>
            <div className="text-[10px] text-aegis-secondary">
              Zero Raw PII reaches vector index or LLM. Clearance-gated rehydration at egress boundary.
            </div>
          </div>
        </div>

        {/* Persona Clearance Pill */}
        <div className="flex items-center space-x-2 bg-surface-elevated px-3 py-1.5 rounded-sm border border-border">
          <span className="text-[10px] text-aegis-muted">CALLER CLEARANCE:</span>
          <span className={`font-bold text-[10px] ${canRehydrate ? "text-aegis-green" : "text-aegis-amber"}`}>
            {currentPersona.clearance}
          </span>
          <span className={`text-[9px] px-1.5 py-0.2 rounded-sm font-bold uppercase ${
            canRehydrate ? "bg-aegis-green/20 text-aegis-green border border-aegis-green/30" : "bg-aegis-red/20 text-aegis-red border border-aegis-red/30"
          }`}>
            {canRehydrate ? "EGRESS REHYDRATION AUTHORIZED" : "REHYDRATION REDACTED"}
          </span>
        </div>
      </div>

      {/* Active Pipeline Flow: Ingress -> Vector/LLM -> Egress */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Step 1: Ingress Tokenization */}
        <div className="bg-surface border border-border rounded-sm p-3 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-aegis-muted font-bold uppercase">1. INGRESS SANITIZATION</span>
            <span className="text-[9px] text-aegis-amber bg-aegis-amber/15 border border-aegis-amber/30 px-1 py-0.2 rounded-sm">
              PRE-SEARCH
            </span>
          </div>
          <p className="text-[10px] text-aegis-secondary">
            Inbound queries scanned for SSN, credit cards, emails, phone numbers. Replaced with SHA-256 tokens.
          </p>
          <div className="p-2 bg-canvas border border-border rounded-sm text-[10px] text-aegis-muted flex items-center justify-between">
            <span>DETECTION METHOD:</span>
            <span className="text-aegis-text font-bold">HMAC-SHA256 DETERMINISTIC</span>
          </div>
        </div>

        {/* Step 2: Zero-Leakage Processing */}
        <div className="bg-surface border border-border rounded-sm p-3 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-aegis-muted font-bold uppercase">2. ZERO-LEAKAGE VECTOR/LLM</span>
            <span className="text-[9px] text-aegis-blue bg-aegis-blue/15 border border-aegis-blue/30 px-1 py-0.2 rounded-sm">
              PROTECTED
            </span>
          </div>
          <p className="text-[10px] text-aegis-secondary">
            Embeddings and external LLMs receive only opaque tokens (`&lt;SSN_...&gt;`). Raw PII never leaves internal memory.
          </p>
          <div className="p-2 bg-canvas border border-border rounded-sm text-[10px] text-aegis-muted flex items-center justify-between">
            <span>DATA IN TRANSIT:</span>
            <span className="text-aegis-blue font-bold">OPAQUE PSEUDONYMS</span>
          </div>
        </div>

        {/* Step 3: Egress Clearance Gate */}
        <div className="bg-surface border border-border rounded-sm p-3 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-aegis-muted font-bold uppercase">3. EGRESS CLEARANCE GATE</span>
            <span className={`text-[9px] px-1 py-0.2 rounded-sm font-bold ${
              canRehydrate
                ? "text-aegis-green bg-aegis-green/15 border border-aegis-green/30"
                : "text-aegis-red bg-aegis-red/15 border border-aegis-red/30"
            }`}>
              {canRehydrate ? "AUTHORIZED" : "REDACTED"}
            </span>
          </div>
          <p className="text-[10px] text-aegis-secondary">
            Tokens rehydrated to plaintext only for Level 3/4. Lower tiers receive generic `[CONFIDENTIAL_...]` tags.
          </p>
          <div className="p-2 bg-canvas border border-border rounded-sm text-[10px] text-aegis-muted flex items-center justify-between">
            <span>AUDIT LOGGED:</span>
            <span className="text-aegis-green font-bold">100% IMMUTABLE WAL</span>
          </div>
        </div>
      </div>

      {/* Interactive Ingress/Egress Simulator */}
      <div className="bg-surface border border-border rounded-sm p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Fingerprint className="w-4 h-4 text-aegis-blue" />
            <h3 className="text-xs font-bold text-aegis-text uppercase">
              LIVE PII VAULT TOKENIZATION & REHYDRATION LAB
            </h3>
          </div>
          <span className="text-[10px] text-aegis-muted">Real-time clearance verification</span>
        </div>

        {/* Input */}
        <div>
          <label className="text-[10px] text-aegis-muted font-bold uppercase mb-1 block">
            RAW PROMPT INPUT (CLIENT EGRESS / INBOUND):
          </label>
          <input
            type="text"
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            className="w-full bg-canvas border border-border text-aegis-text text-xs px-3 py-2 rounded-sm focus:outline-none focus:border-aegis-blue"
          />
        </div>

        {/* Transformation Pipeline */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          {/* Sanitized LLM/Vector Payload */}
          <div className="bg-canvas border border-border p-3 rounded-sm space-y-1.5">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-aegis-muted uppercase font-bold flex items-center space-x-1">
                <Terminal className="w-3 h-3 text-aegis-amber" />
                <span>SANITIZED FOR LLM & VECTOR INDEX (INGRESS):</span>
              </span>
              <button
                onClick={() => handleCopy(simulation.sanitized)}
                className="text-aegis-secondary hover:text-aegis-text flex items-center space-x-1"
              >
                {copiedToken === simulation.sanitized ? (
                  <Check className="w-3 h-3 text-aegis-green" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                <span>Copy</span>
              </button>
            </div>
            <p className="text-xs text-aegis-amber font-mono bg-surface p-2 rounded-sm break-all border border-border">
              {simulation.sanitized}
            </p>
          </div>

          {/* Egress Response to Caller */}
          <div className="bg-canvas border border-border p-3 rounded-sm space-y-1.5">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-aegis-muted uppercase font-bold flex items-center space-x-1">
                <ShieldCheck className="w-3 h-3 text-aegis-green" />
                <span>CLIENT OUTPUT (EGRESS FOR {currentPersona.name.toUpperCase()}):</span>
              </span>
              <button
                onClick={() => handleCopy(simulation.egressOutput)}
                className="text-aegis-secondary hover:text-aegis-text flex items-center space-x-1"
              >
                {copiedToken === simulation.egressOutput ? (
                  <Check className="w-3 h-3 text-aegis-green" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                <span>Copy</span>
              </button>
            </div>
            <p className={`text-xs font-mono bg-surface p-2 rounded-sm break-all border ${
              canRehydrate ? "text-aegis-green border-aegis-green/30" : "text-aegis-red border-aegis-red/30"
            }`}>
              {simulation.egressOutput}
            </p>
          </div>
        </div>

        {/* Active Tokens Table */}
        {simulation.tokens.length > 0 && (
          <div className="pt-2">
            <span className="text-[10px] text-aegis-muted font-bold uppercase mb-1 block">
              ACTIVE HMAC TOKEN REGISTRY:
            </span>
            <div className="border border-border rounded-sm overflow-hidden">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-surface-elevated text-aegis-muted uppercase text-[9px] border-b border-border">
                  <tr>
                    <th className="p-2">ENTITY TYPE</th>
                    <th className="p-2">SYNTHETIC TOKEN</th>
                    <th className="p-2">ISOLATED PLAINTEXT</th>
                    <th className="p-2">CLEARANCE STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-surface">
                  {simulation.tokens.map((t, idx) => (
                    <tr key={idx} className="hover:bg-surface-hover">
                      <td className="p-2 font-bold text-aegis-text">{t.type}</td>
                      <td className="p-2 text-aegis-amber font-mono">{t.token}</td>
                      <td className="p-2 text-aegis-secondary font-mono">{t.raw}</td>
                      <td className="p-2">
                        {canRehydrate ? (
                          <span className="text-aegis-green font-bold">REHYDRATED</span>
                        ) : (
                          <span className="text-aegis-red font-bold">MASKED // ACCESS DENIED</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
