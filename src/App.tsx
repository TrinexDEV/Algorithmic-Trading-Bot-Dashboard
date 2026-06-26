import React, { useState, useEffect } from "react";
import { 
  LineChart, Activity, Sliders, Shield, KeyRound, Wifi, Landmark, 
  Play, Pause, Compass, DollarSign, Terminal, ArrowUpRight, ArrowDownRight, Server
} from "lucide-react";
import { BotConfig, BotPerformance, TradingPosition, TradeLog, Asset } from "./types";
import DashboardView from "./components/DashboardView";
import BacktestView from "./components/BacktestView";
import RiskSettingsView from "./components/RiskSettingsView";
import ProviderKeysView from "./components/ProviderKeysView";

type TabID = "dashboard" | "backtest" | "risk_settings" | "provider_keys";

export default function App() {
  const [activeTab, setActiveTab] = useState<TabID>("dashboard");
  const [assets, setAssets] = useState<Asset[]>([]);
  const [config, setConfig] = useState<BotConfig | null>(null);
  const [performance, setPerformance] = useState<BotPerformance | null>(null);
  const [positions, setPositions] = useState<TradingPosition[]>([]);
  const [logs, setLogs] = useState<TradeLog[]>([]);
  const [historicalBalances, setHistoricalBalances] = useState<{ time: string; balance: number; equity: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Core API State Poller
  const fetchState = async () => {
    try {
      const res = await fetch("/api/state");
      if (res.ok) {
        const data = await res.json();
        setAssets(data.assets || []);
        setConfig(data.config || null);
        setPerformance(data.performance || null);
        setPositions(data.positions || []);
        setLogs(data.logs || []);
        setHistoricalBalances(data.historicalBalances || []);
      }
    } catch (err) {
      console.error("Failed to sync backend state.", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 1500); // Poll every 1.5 seconds for instant ticking updates!
    return () => clearInterval(interval);
  }, []);

  const handleUpdateConfig = async (updatedConfig: Partial<BotConfig>) => {
    try {
      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedConfig)
      });
      if (res.ok) {
        fetchState();
      }
    } catch (err) {
      console.error("Failed to update bot config", err);
    }
  };

  if (isLoading || !config || !performance) {
    return (
      <div className="min-h-screen bg-[#0F1115] flex flex-col items-center justify-center text-center p-4">
        <div className="relative w-14 h-14 mb-4">
          <div className="absolute inset-0 border-4 border-blue-500/10 rounded-full" />
          <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
        <h3 className="font-display font-bold text-[#E2E8F0] text-lg tracking-wide">Syncing Aegis Engine...</h3>
        <p className="text-slate-500 text-xs mt-1.5 max-w-xs">
          Connecting to Cloud Run server, loading persistent database, and compiling secure market indices.
        </p>
      </div>
    );
  }

  // Active Connection Info strings
  const activeProviders: string[] = [];
  if (config.providers.jifo.isConnected) activeProviders.push("JIFO");
  if (config.providers.ftmo.isConnected) activeProviders.push("FTMO");
  const providerLabel = activeProviders.length > 0 ? activeProviders.join(" + ") : "Local Simulator";

  return (
    <div className="min-h-screen bg-[#0F1115] text-[#E2E8F0] font-sans selection:bg-blue-500/30 flex flex-col justify-between">
      
      {/* NORTH NAVIGATION HEADER BAR */}
      <header className="bg-[#15181E] border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 h-16 flex items-center justify-between gap-4">
          
          {/* Logo & Status */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-600/20">
              <Terminal className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display font-bold text-base text-[#E2E8F0] tracking-tight">
                  Algorithmic Trading Bot & Dashboard
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[9px] font-mono font-bold uppercase py-0.5 px-2 rounded-full">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                  <span>Cloud Active</span>
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-mono tracking-wider uppercase">
                Multi-Asset Strategy Engine
              </p>
            </div>
          </div>

          {/* Quick Broker Status info */}
          <div className="hidden md:flex items-center gap-4 font-mono text-[10px] text-slate-400">
            <div className="flex items-center gap-1.5 bg-[#12151A] py-1.5 px-3 rounded-lg border border-white/10">
              <Server className="w-3.5 h-3.5 text-blue-400" />
              <span>Route: <b className="text-blue-400">{providerLabel}</b></span>
            </div>
            
            <div className="flex items-center gap-1.5 bg-[#12151A] py-1.5 px-3 rounded-lg border border-white/10">
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              <span>Latency: <b>12ms</b></span>
            </div>
          </div>

        </div>
      </header>

      {/* CORE WRAPPER SCREEN SECTION */}
      <main className="max-w-7xl mx-auto w-full px-4 lg:px-6 py-6 flex-1 flex flex-col gap-6">
        
        {/* TABS SELECTOR ROW */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-1 bg-[#12151A] border border-white/10 p-1 rounded-xl">
            {/* Tab 1 */}
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`py-2 px-4 rounded-lg font-medium text-xs flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === "dashboard"
                  ? "bg-blue-600 text-white font-semibold shadow"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Live Monitor</span>
            </button>

            {/* Tab 2 */}
            <button
              onClick={() => setActiveTab("backtest")}
              className={`py-2 px-4 rounded-lg font-medium text-xs flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === "backtest"
                  ? "bg-blue-600 text-white font-semibold shadow"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Strategy Backtester</span>
            </button>

            {/* Tab 3 */}
            <button
              onClick={() => setActiveTab("risk_settings")}
              className={`py-2 px-4 rounded-lg font-medium text-xs flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === "risk_settings"
                  ? "bg-blue-600 text-white font-semibold shadow"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Risk Management</span>
            </button>

            {/* Tab 4 */}
            <button
              onClick={() => setActiveTab("provider_keys")}
              className={`py-2 px-4 rounded-lg font-medium text-xs flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === "provider_keys"
                  ? "bg-blue-600 text-white font-semibold shadow"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <KeyRound className="w-4 h-4" />
              <span>Broker API Keys</span>
            </button>
          </div>

          {/* Quick Active Trade Counters */}
          <div className="hidden sm:flex items-center gap-2 font-mono text-[11px] bg-[#12151A] border border-white/10 px-3 py-1.5 rounded-xl">
            <span className="text-slate-500">Active Positions:</span>
            <span className={`font-bold ${positions.length > 0 ? "text-blue-400" : "text-slate-400"}`}>
              {positions.length}
            </span>
          </div>
        </div>

        {/* TAB ACTIVE PANEL VIEWPORT */}
        <div className="flex-1 min-h-0">
          {activeTab === "dashboard" && (
            <DashboardView
              assets={assets}
              performance={performance}
              positions={positions}
              logs={logs}
              historicalBalances={historicalBalances}
              config={config}
              onUpdateConfig={handleUpdateConfig}
              onRefresh={fetchState}
            />
          )}

          {activeTab === "backtest" && (
            <BacktestView
              assets={assets}
              config={config}
            />
          )}

          {activeTab === "risk_settings" && (
            <RiskSettingsView
              config={config}
              onUpdateConfig={handleUpdateConfig}
            />
          )}

          {activeTab === "provider_keys" && (
            <ProviderKeysView
              config={config}
              onRefresh={fetchState}
            />
          )}
        </div>

      </main>

      {/* FOOTER METRICS AND SECURITY DISCLAIMERS */}
      <footer className="bg-[#0F1115] border-t border-white/10 py-4 mt-6">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-[10px] text-slate-500 font-mono text-center sm:text-left leading-5">
            <span>© 2026 Aegis Automated Systems. Run on sandboxed Docker nodes.</span>
            <span className="block sm:inline sm:ml-2 text-rose-400 font-semibold uppercase tracking-wider">
              ⚠️ Risk Warning: CFD and proprietary challenge leverage involve substantial loss rules.
            </span>
          </div>

          <div className="flex gap-4 font-mono text-[9px] text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span>TLS v1.3</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>HMAC-SHA255</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
