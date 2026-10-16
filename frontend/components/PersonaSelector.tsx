"use client";

import React from "react";
import { User, Shield, Briefcase, FileCheck, Crown } from "lucide-react";

export interface PersonaInfo {
  id: string;
  name: string;
  role: string;
  clearance: string;
  description: string;
  vaults: string[];
}

export const PERSONAS: PersonaInfo[] = [
  {
    id: "user_intern",
    name: "Alex Vance",
    role: "Engineering Intern",
    clearance: "LEVEL_1_PUBLIC",
    description: "Public company handbook, engineering guidelines, stipend info. Restricted from project alpha, audit, and M&A.",
    vaults: ["vault_public"],
  },
  {
    id: "user_pm",
    name: "Sarah Chen",
    role: "FinTech Product Lead",
    clearance: "LEVEL_2_TEAM",
    description: "Project Alpha specifications, cloud GPU budgets, team rosters, public docs. Restricted from audit & M&A.",
    vaults: ["vault_public", "vault_alpha"],
  },
  {
    id: "user_auditor",
    name: "Marcus Reed",
    role: "Compliance Officer",
    clearance: "LEVEL_3_COMPLIANCE",
    description: "SOC-2 Type II audit logs, AML wire records, customer PII decryption clearance, public docs.",
    vaults: ["vault_public", "vault_compliance"],
  },
  {
    id: "user_csuite",
    name: "Elena Rostova",
    role: "Chief Strategy Officer",
    clearance: "LEVEL_4_EXECUTIVE",
    description: "Full enterprise clearance: Confidential M&A deal rooms, executive stock grants, CEO compensation.",
    vaults: ["vault_public", "vault_alpha", "vault_compliance", "vault_mna"],
  },
];

interface PersonaSelectorProps {
  selectedPersona: PersonaInfo;
  onSelectPersona: (p: PersonaInfo) => void;
  authorizedChunkCount?: number;
}

export const PersonaSelector: React.FC<PersonaSelectorProps> = ({
  selectedPersona,
  onSelectPersona,
  authorizedChunkCount,
}) => {
  const getClearanceBadge = (clearance: string) => {
    switch (clearance) {
      case "LEVEL_1_PUBLIC":
        return <span className="bg-surface-elevated text-aegis-secondary border border-border px-1.5 py-0.2 rounded-sm text-[9px] font-bold">LEVEL 1 // PUBLIC</span>;
      case "LEVEL_2_TEAM":
        return <span className="bg-aegis-blue/15 text-aegis-blue border border-aegis-blue/30 px-1.5 py-0.2 rounded-sm text-[9px] font-bold">LEVEL 2 // TEAM ALPHA</span>;
      case "LEVEL_3_COMPLIANCE":
        return <span className="bg-aegis-amber/15 text-aegis-amber border border-aegis-amber/30 px-1.5 py-0.2 rounded-sm text-[9px] font-bold">LEVEL 3 // COMPLIANCE</span>;
      case "LEVEL_4_EXECUTIVE":
        return <span className="bg-aegis-red/20 text-aegis-red border border-aegis-red/40 px-1.5 py-0.2 rounded-sm text-[9px] font-bold">LEVEL 4 // C-SUITE</span>;
      default:
        return null;
    }
  };

  const getPersonaIcon = (clearance: string) => {
    switch (clearance) {
      case "LEVEL_1_PUBLIC":
        return <User className="w-3.5 h-3.5 text-aegis-secondary" />;
      case "LEVEL_2_TEAM":
        return <Briefcase className="w-3.5 h-3.5 text-aegis-blue" />;
      case "LEVEL_3_COMPLIANCE":
        return <FileCheck className="w-3.5 h-3.5 text-aegis-amber" />;
      case "LEVEL_4_EXECUTIVE":
        return <Crown className="w-3.5 h-3.5 text-aegis-red" />;
      default:
        return <Shield className="w-3.5 h-3.5 text-aegis-muted" />;
    }
  };

  return (
    <div className="bg-surface border-b border-border px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 font-mono text-xs select-none">
      <div className="flex items-center space-x-2">
        <span className="text-[10px] text-aegis-muted uppercase tracking-wider font-bold">
          CALLER PERSONA:
        </span>
        <div className="flex flex-wrap items-center gap-1.5">
          {PERSONAS.map((p) => {
            const isSelected = p.id === selectedPersona.id;
            return (
              <button
                key={p.id}
                onClick={() => onSelectPersona(p)}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-sm border transition text-[11px] ${
                  isSelected
                    ? "bg-aegis-blue text-canvas border-aegis-blue font-bold shadow-sm"
                    : "bg-surface-elevated hover:bg-surface-hover text-aegis-secondary hover:text-aegis-text border-border"
                }`}
              >
                {getPersonaIcon(p.clearance)}
                <span>{p.name}</span>
                <span className={`text-[9px] px-1 py-0.2 rounded-sm ${isSelected ? "bg-black/30 text-white" : "text-aegis-muted"}`}>
                  {p.role.split(" ")[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Persona Summary Pill */}
      <div className="flex items-center space-x-3 text-[11px]">
        {getClearanceBadge(selectedPersona.clearance)}
        <div className="text-aegis-secondary flex items-center space-x-1.5">
          <span>VAULTS:</span>
          <span className="text-aegis-text font-bold">
            {selectedPersona.vaults.map((v) => v.replace("vault_", "").toUpperCase()).join(", ")}
          </span>
          {authorizedChunkCount !== undefined && (
            <span className="text-[10px] text-aegis-muted">({authorizedChunkCount} chunks)</span>
          )}
        </div>
      </div>
    </div>
  );
};
