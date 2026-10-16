"use client";

import React, { useState, useEffect } from "react";
import { Shield, ShieldAlert, CheckCircle, RefreshCw, Lock, Terminal } from "lucide-react";

interface HeaderProps {
  onRefresh: () => void;
  isLoading: boolean;
}

export const AegisHeader: React.FC<HeaderProps> = ({ onRefresh, isLoading }) => {
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

  return (
    <header className="border-b border-border bg-surface px-5 py-2.5 flex items-center justify-between select-none">
      {/* Brand & Classification */}
      <div className="flex items-center space-x-3.5">
        <div className="w-8 h-8 bg-surface-elevated border border-border flex items-center justify-center rounded-sm">
          <Shield className="w-4 h-4 text-aegis-blue" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xs font-mono font-bold tracking-widest text-aegis-text uppercase">
              AEGIS // ZERO-TRUST RAG PROXY
            </h1>
            <span className="text-[9px] font-mono tracking-wider px-1.5 py-0.2 bg-aegis-blue/15 text-aegis-blue border border-aegis-blue/30 rounded-sm font-bold">
              PUSH-DOWN ReBAC
            </span>
          </div>
          <div className="text-[10px] text-aegis-secondary font-mono tracking-tight flex items-center space-x-2">
            <span>DEFENSE & FINANCIAL MULTI-TENANT PROXY</span>
            <span className="text-border">|</span>
            <span className="text-aegis-blue">FAIL-CLOSED PROTOCOL</span>
            <span className="text-border">|</span>
            <span className="text-aegis-text tabular-nums">{zuluTime}</span>
          </div>
        </div>
      </div>

      {/* Security Engine Telemetry Badges */}
      <div className="hidden lg:flex items-center space-x-3 text-xs font-mono">
        <div className="flex items-center space-x-2 px-3 py-1 rounded-sm border border-border bg-surface-elevated">
          <CheckCircle className="w-3.5 h-3.5 text-aegis-green" />
          <div>
            <div className="text-[9px] text-aegis-muted uppercase tracking-wider">Zanzibar ReBAC</div>
            <div className="text-[10px] font-bold text-aegis-text">Graph Synced (0ms)</div>
          </div>
        </div>

        <div className="flex items-center space-x-2 px-3 py-1 rounded-sm border border-border bg-surface-elevated">
          <Lock className="w-3.5 h-3.5 text-aegis-amber" />
          <div>
            <div className="text-[9px] text-aegis-muted uppercase tracking-wider">PII Token Vault</div>
            <div className="text-[10px] font-bold text-aegis-text">Bi-directional HMAC</div>
          </div>
        </div>

        <div className="flex items-center space-x-2 px-3 py-1 rounded-sm border border-border bg-surface-elevated">
          <Terminal className="w-3.5 h-3.5 text-aegis-blue" />
          <div>
            <div className="text-[9px] text-aegis-muted uppercase tracking-wider">Vector Index</div>
            <div className="text-[10px] font-bold text-aegis-text">Push-Down Bitmask</div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-2">
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="p-1.5 border border-border bg-surface-elevated hover:bg-surface-hover text-aegis-secondary hover:text-aegis-text rounded-sm transition focus-visible:ring-1 focus-visible:ring-aegis-blue"
          title="Refresh Security Status"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>
    </header>
  );
};
