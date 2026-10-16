"use client";

import React, { useState } from "react";
import { 
  Shield, 
  Flame, 
  Lock, 
  Network, 
  FileCheck2, 
  User, 
  Briefcase, 
  FileCheck, 
  Crown,
  ChevronDown,
  Check,
  Activity,
  Layers
} from "lucide-react";
import { PersonaInfo, PERSONAS } from "./PersonaSelector";

interface SidebarProps {
  currentPersona: PersonaInfo;
  onSelectPersona: (p: PersonaInfo) => void;
  activeView: "STARVATION" | "PII" | "REBAC" | "AUDIT";
  onSelectView: (view: "STARVATION" | "PII" | "REBAC" | "AUDIT") => void;
}

export const AegisSidebar: React.FC<SidebarProps> = ({
  currentPersona,
  onSelectPersona,
  activeView,
  onSelectView,
}) => {
  const [personaDropdownOpen, setPersonaDropdownOpen] = useState(false);

  const getPersonaIcon = (clearance: string) => {
    switch (clearance) {
      case "LEVEL_1_PUBLIC":
        return <User className="w-3.5 h-3.5 text-text-secondary" />;
      case "LEVEL_2_TEAM":
        return <Briefcase className="w-3.5 h-3.5 text-accent" />;
      case "LEVEL_3_COMPLIANCE":
        return <FileCheck className="w-3.5 h-3.5 text-warning" />;
      case "LEVEL_4_EXECUTIVE":
        return <Crown className="w-3.5 h-3.5 text-danger" />;
      default:
        return <Shield className="w-3.5 h-3.5 text-text-muted" />;
    }
  };

  const navItems = [
    {
      id: "STARVATION" as const,
      label: "Starvation Diagnostics",
      subtitle: "Dual-matrix vector probe",
      icon: Flame,
      badge: "LIVE",
    },
    {
      id: "PII" as const,
      label: "PII Token Vault",
      subtitle: "Ingress HMAC & Egress gate",
      icon: Lock,
    },
    {
      id: "REBAC" as const,
      label: "Zanzibar ReBAC Graph",
      subtitle: "Transitive DAG & SIMD mask",
      icon: Network,
    },
    {
      id: "AUDIT" as const,
      label: "Cryptographic Audit",
      subtitle: "Immutable SHA-256 WAL",
      icon: FileCheck2,
    },
  ];

  return (
    <aside className="w-64 shrink-0 bg-card border-r border-border h-screen flex flex-col justify-between font-mono text-xs select-none sticky top-0">
      {/* 1. Brand Header */}
      <div className="h-14 shrink-0 px-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded bg-elevated border border-border flex items-center justify-center">
            <Shield className="w-4 h-4 text-accent" />
          </div>
          <div>
            <div className="font-bold tracking-wider text-text-primary uppercase flex items-center space-x-1.5">
              <span>AEGIS</span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-accent/15 text-accent border border-accent/30">
                PRO-MAX
              </span>
            </div>
            <div className="text-[10px] text-text-muted">Zero-Trust ReBAC Proxy</div>
          </div>
        </div>
      </div>

      {/* 2. Persona Selector Card */}
      <div className="p-3 border-b border-border">
        <div className="text-[9px] text-text-muted uppercase tracking-wider font-bold mb-1.5 flex items-center justify-between">
          <span>CALLER CONTEXT</span>
          <span className="text-accent text-[9px]">{currentPersona.vaults.length * 3} CHUNKS</span>
        </div>

        <div className="relative">
          <button
            onClick={() => setPersonaDropdownOpen(!personaDropdownOpen)}
            className="w-full p-2 rounded bg-elevated hover:bg-hover border border-border transition flex items-center justify-between text-left"
          >
            <div className="flex items-center space-x-2 min-w-0">
              <div className="p-1 rounded bg-background border border-border">
                {getPersonaIcon(currentPersona.clearance)}
              </div>
              <div className="min-w-0">
                <div className="font-bold text-text-primary truncate">{currentPersona.name}</div>
                <div className="text-[10px] text-text-secondary truncate">{currentPersona.role}</div>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-text-muted shrink-0 ml-1" />
          </button>

          {/* Persona Dropdown Menu */}
          {personaDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-elevated border border-border rounded shadow-xl z-50 p-1 space-y-1">
              {PERSONAS.map((p) => {
                const isSelected = p.id === currentPersona.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      onSelectPersona(p);
                      setPersonaDropdownOpen(false);
                    }}
                    className={`w-full p-2 rounded text-left flex items-center justify-between transition ${
                      isSelected
                        ? "bg-accent/15 text-accent border border-accent/30 font-bold"
                        : "hover:bg-hover text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      {getPersonaIcon(p.clearance)}
                      <div>
                        <div className="text-xs">{p.name}</div>
                        <div className="text-[9px] opacity-75">{p.clearance.replace("LEVEL_", "LVL ")}</div>
                      </div>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-accent" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 3. Security Subsystems Navigation */}
      <div className="p-3 flex-1 overflow-y-auto space-y-1">
        <div className="text-[9px] text-text-muted uppercase tracking-wider font-bold px-2 py-1">
          SECURITY SUBSYSTEMS
        </div>

        {navItems.map((item) => {
          const isActive = activeView === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              className={`w-full p-2.5 rounded text-left transition flex items-center justify-between group ${
                isActive
                  ? "bg-accent/15 text-accent border border-accent/40 font-bold shadow-sm"
                  : "hover:bg-hover text-text-secondary hover:text-text-primary border border-transparent"
              }`}
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-accent" : "text-text-muted group-hover:text-text-primary"}`} />
                <div className="min-w-0">
                  <div className="text-xs truncate">{item.label}</div>
                  <div className="text-[10px] text-text-muted truncate">{item.subtitle}</div>
                </div>
              </div>

              {item.badge && (
                <span className="text-[8px] font-bold px-1.5 py-0.2 rounded bg-success/20 text-success border border-success/30">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 4. Engine Health & Hardware Telemetry Footer */}
      <div className="p-3 border-t border-border bg-card space-y-2">
        <div className="text-[9px] text-text-muted uppercase tracking-wider font-bold">
          SECURITY KERNEL STATUS
        </div>

        <div className="space-y-1 text-[10px] text-text-secondary">
          <div className="flex items-center justify-between p-1.5 rounded bg-elevated border border-border">
            <span className="flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              <span>HNSW BITMASK</span>
            </span>
            <span className="text-success font-bold font-mono">PUSH-DOWN</span>
          </div>

          <div className="flex items-center justify-between p-1.5 rounded bg-elevated border border-border">
            <span>ZANZIBAR REBAC</span>
            <span className="text-accent font-bold font-mono">0ms DAG</span>
          </div>

          <div className="flex items-center justify-between p-1.5 rounded bg-elevated border border-border">
            <span>CRYPTO AUDIT</span>
            <span className="text-text-primary font-bold font-mono">SHA-256 WAL</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
