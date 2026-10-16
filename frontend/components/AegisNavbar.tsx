"use client";

import React, { useState, useEffect } from "react";
import { RefreshCw, ExternalLink, ShieldCheck, Terminal, Clock } from "lucide-react";
import { PersonaInfo } from "./PersonaSelector";

interface NavbarProps {
  currentPersona: PersonaInfo;
  activeView: string;
  onRefresh: () => void;
  isLoading: boolean;
}

export const AegisNavbar: React.FC<NavbarProps> = ({
  currentPersona,
  activeView,
  onRefresh,
  isLoading,
}) => {
  const [zuluTime, setZuluTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setZuluTime(now.toISOString().slice(11, 19) + " ZULU");
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const getViewTitle = (view: string) => {
    switch (view) {
      case "STARVATION":
        return "Top-K Starvation Diagnostic Matrix";
      case "PII":
        return "Bi-Directional HMAC PII Token Vault";
      case "REBAC":
        return "Google Zanzibar ReBAC Graph Engine";
      case "AUDIT":
        return "Cryptographic Tamper-Evident Audit Ledger";
      default:
        return "Security Cockpit";
    }
  };

  return (
    <header className="h-14 shrink-0 bg-card border-b border-border px-6 flex items-center justify-between sticky top-0 z-10 font-mono text-xs select-none">
      {/* Breadcrumb / Title */}
      <div className="flex items-center space-x-3 min-w-0">
        <span className="text-text-muted hidden sm:inline">Aegis Security</span>
        <span className="text-text-muted hidden sm:inline">/</span>
        <h1 className="font-bold text-text-primary uppercase tracking-wide truncate">
          {getViewTitle(activeView)}
        </h1>

        <span className="text-[9px] px-2 py-0.5 rounded bg-accent/15 text-accent border border-accent/30 font-bold hidden md:inline-flex items-center space-x-1">
          <span>CALLER:</span>
          <span className="text-text-primary">{currentPersona.name.toUpperCase()}</span>
        </span>
      </div>

      {/* Telemetry Actions */}
      <div className="flex items-center space-x-4">
        {/* Zulu Clock */}
        <div className="hidden lg:flex items-center space-x-1.5 text-text-secondary text-[11px] bg-elevated px-2.5 py-1 rounded border border-border">
          <Clock className="w-3.5 h-3.5 text-accent" />
          <span className="tabular-nums font-bold text-text-primary">{zuluTime}</span>
        </div>

        {/* Refresh Action */}
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="p-1.5 rounded bg-elevated hover:bg-hover border border-border text-text-secondary hover:text-text-primary transition focus-visible:ring-2 focus-visible:ring-accent"
          title="Refresh Active Diagnostics"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
        </button>

        {/* GitHub Link */}
        <a
          href="https://github.com/barshal-horse/AegisRAG"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] flex items-center space-x-1 text-text-secondary hover:text-text-primary transition p-1.5 rounded bg-elevated hover:bg-hover border border-border"
          title="View GitHub Repository"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">GitHub</span>
        </a>
      </div>
    </header>
  );
};
