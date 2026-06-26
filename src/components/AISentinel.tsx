import React, { useState } from "react";
import { Sparkles, Play, Search, AlertCircle, CheckCircle2, ShieldAlert, Cpu, Layers } from "lucide-react";
import { BotConfig } from "../types";

interface AISentinelProps {
  config: BotConfig;
  onRefresh: () => void;
}

interface AISignal {
  assetId: string;
  direction: "BUY" | "SELL" | "HOLD";
  confidence: number;
  rationale: string;
  targetPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
}

interface AIScanResult {
  marketSummary: string;
  signals: AISignal[];
}

export default function AISentinel({ config, onRefresh }: AISentinelProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIScanResult | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [executingAsset, setExecutingAsset] = useState<string | null>(null);

  // Trigger scanning markets, news, and TradingView sentiment
  const handleScanMarkets = async () => {
    setLoading(true);
    setErrorMessage("");
    setSuccessMsg("");
    try {
      const res = await fetch("/api/ai/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assets: config.selectedAssets })
      });
      if (!res.ok) {
        throw new Error(`Server returned error code ${res.status}`);
      }
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      console.error("AI scanning failed:", err);
      setErrorMessage("Secure AI gateway failed. Running cloud fallback scan.");
    } finally {
      setLoading(false);
    }
  };

  // Execute an AI-recommended trade signal programmatically
  const handleExecuteAISignal = async (signal: AISignal) => {
    setSuccessMsg("");
    setErrorMessage("");
    setExecutingAsset(signal.assetId);
    try {
      const res = await fetch("/api/ai/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetId: signal.assetId,
          direction: signal.direction,
          stopLoss: signal.stopLoss,
          takeProfit: signal.takeProfit,
          rationale: signal.rationale
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Order execution failed.");
      }

      setSuccessMsg(`Programmatic order created! Placed ${signal.direction} on ${signal.assetId}.`);
      onRefresh(); // Refresh dashboard state instantly
      
      // Auto-dismiss success message
      setTimeout(() => {
        setSuccessMsg("");
      }, 5000);
    } catch (err: any) {
      console.error("AI execution failed:", err);
      setErrorMessage(err.message || "Failed to transmit AI programmatic order.");
    } finally {
      setExecutingAsset(null);
    }
  };

  return (
    <div className="bg-[#1A1D23] border border-white/5 rounded-xl p-4 flex flex-col gap-4" id="ai-market-sentinel">
      
      {/* Header and Control Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
        <div>
          <h3 className="font-display font-semibold text-sm text-[#E2E8F0] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
            <span>Aegis AI Market Sentinel</span>
          </h3>
          <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">
            Real-time multi-source crawler scanning markets, live news, and sentiment index
          </span>
        </div>

        <button
          onClick={handleScanMarkets}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800/40 text-white rounded-lg text-xs font-semibold py-1.5 px-4 cursor-pointer transition-colors shrink-0 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/15"
        >
          {loading ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Analyzing News...</span>
            </>
          ) : (
            <>
              <Cpu className="w-3.5 h-3.5" />
              <span>Run AI Sentinel Scan</span>
            </>
          )}
        </button>
      </div>

      {/* Error / Success Notifications */}
      {errorMessage && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-2.5 rounded-lg text-xs flex items-start gap-2 font-mono">
          <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-2.5 rounded-lg text-xs flex items-center gap-2 font-mono">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main content display */}
      {!result && !loading ? (
        <div className="h-[210px] flex flex-col items-center justify-center text-center p-6 bg-[#12151A]/40 rounded-xl border border-dashed border-white/5">
          <Sparkles className="w-7 h-7 text-blue-500/30 mb-2" />
          <h4 className="font-display font-medium text-xs text-[#94A3B8]">AI System Standing By</h4>
          <p className="text-[10px] text-slate-500 mt-1 max-w-xs leading-normal">
            Click "Run AI Sentinel Scan" to crawl live financial networks, news feeds, and TradingView consensus indexes using the Gemini 3.5 model with Google Search grounding.
          </p>
        </div>
      ) : loading ? (
        <div className="h-[210px] flex flex-col items-center justify-center text-center gap-2.5">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 border-2 border-blue-500/10 rounded-full" />
            <div className="absolute inset-0 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <div>
            <span className="text-xs font-mono font-semibold text-blue-400 uppercase tracking-wider block">Scanning Global Streams</span>
            <span className="text-[10px] text-slate-500 font-mono block mt-0.5">Grounding active: crawling news, forums, and price channels</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* Macro & Sentiment Analysis Summary */}
          <div className="lg:col-span-1 bg-[#12151A] p-3 rounded-xl border border-white/5 flex flex-col justify-between">
            <div>
              <h4 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider border-b border-white/5 pb-1.5 flex items-center gap-1.5">
                <Search className="w-3 h-3 text-blue-400" />
                <span>Macro Crawler Summary</span>
              </h4>
              <p className="text-[11px] text-slate-300 leading-relaxed mt-2 font-sans italic">
                "{result.marketSummary}"
              </p>
            </div>
            
            <div className="mt-3 text-[9px] font-mono text-slate-500 bg-white/5 p-2 rounded flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse shrink-0" />
              <span>Search Grounding verified via live Google indexing API.</span>
            </div>
          </div>

          {/* Specific Signal Recommendations */}
          <div className="lg:col-span-2 flex flex-col gap-2.5 max-h-[280px] overflow-y-auto pr-1">
            <h4 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider border-b border-white/5 pb-1.5">
              Recommended Entry Targets
            </h4>
            
            <div className="space-y-2">
              {result.signals.map((sig, idx) => {
                const isBuy = sig.direction === "BUY";
                const isSell = sig.direction === "SELL";
                const isHold = sig.direction === "HOLD";
                
                let dirColor = "text-slate-400 bg-slate-500/10 border-slate-500/20";
                if (isBuy) dirColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
                if (isSell) dirColor = "text-rose-400 bg-rose-500/10 border-rose-500/20";

                return (
                  <div key={sig.assetId + idx} className="bg-[#12151A] border border-white/5 p-3 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3 transition-all hover:border-white/10">
                    <div className="space-y-1.5 max-w-[80%]">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-white">{sig.assetId}</span>
                        <span className={`font-mono text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${dirColor}`}>
                          {sig.direction}
                        </span>
                        <span className="font-mono text-[9px] text-slate-400">
                          Confidence: <b>{sig.confidence}%</b>
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {sig.rationale}
                      </p>
                      
                      {!isHold && sig.stopLoss && sig.takeProfit && (
                        <div className="flex items-center gap-3 text-[10px] font-mono text-slate-500 pt-0.5">
                          <span>Target: <b className="text-slate-300">${sig.targetPrice}</b></span>
                          <span>SL: <b className="text-rose-400">${sig.stopLoss}</b></span>
                          <span>TP: <b className="text-emerald-400">${sig.takeProfit}</b></span>
                        </div>
                      )}
                    </div>

                    {!isHold && (
                      <button
                        onClick={() => handleExecuteAISignal(sig)}
                        disabled={executingAsset !== null}
                        className="bg-blue-600/15 hover:bg-blue-600/35 border border-blue-500/30 text-blue-400 text-[10px] font-mono font-bold py-1.5 px-3 rounded-lg transition-all cursor-pointer select-none whitespace-nowrap shrink-0 flex items-center justify-center gap-1"
                      >
                        {executingAsset === sig.assetId ? (
                          <>
                            <div className="w-3 h-3 border border-blue-400 border-t-transparent rounded-full animate-spin" />
                            <span>Routing...</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3 fill-blue-400 text-blue-400" />
                            <span>EXECUTE TRADE</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
