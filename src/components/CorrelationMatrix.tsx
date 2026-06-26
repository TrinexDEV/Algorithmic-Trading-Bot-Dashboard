import React, { useState, useEffect } from "react";
import { Layers, HelpCircle, Check, Info } from "lucide-react";
import { Asset } from "../types";

interface CorrelationMatrixProps {
  assets: Asset[];
}

export default function CorrelationMatrix({ assets }: CorrelationMatrixProps) {
  // Preset list of 8 core assets across different classes for high-density readability
  const corePresetIds = ["BTCUSD", "XAUUSD", "EURUSD", "GBPUSD", "US100.cash", "US30.cash", "AAPL", "TSLA"];
  
  // State for assets currently visualized in the matrix
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    // Return assets that exist in the loaded assets array
    const available = assets.map(a => a.id);
    const initial = corePresetIds.filter(id => available.includes(id));
    return initial.length > 0 ? initial : available.slice(0, 8);
  });

  const [matrix, setMatrix] = useState<Record<string, Record<string, number>>>({});
  const [loading, setLoading] = useState(true);
  const [activePair, setActivePair] = useState<{ id1: string; id2: string; val: number } | null>(null);

  // Fetch correlation data from backend
  const fetchCorrelations = async () => {
    if (selectedIds.length === 0) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/correlation?assets=${selectedIds.join(",")}`);
      if (res.ok) {
        const data = await res.json();
        setMatrix(data.matrix || {});
      }
    } catch (err) {
      console.error("Failed to fetch correlation matrix:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCorrelations();
  }, [selectedIds]);

  // Toggle asset in/out of matrix selection
  const handleToggleAsset = (id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        if (prev.length <= 2) return prev; // Keep at least 2 for a matrix
        return prev.filter(x => x !== id);
      } else {
        if (prev.length >= 10) return prev; // Keep max 10 to preserve grid fit
        return [...prev, id];
      }
    });
  };

  // Get professional insight based on Pearson R value
  const getCorrelationInsight = (r: number, id1: string, id2: string) => {
    if (id1 === id2) {
      return {
        label: "Identical Asset",
        desc: "Perfect self-covariance. No diversification benefit.",
        color: "text-blue-400"
      };
    }
    if (r >= 0.70) {
      return {
        label: "Strong Positive Correlation",
        desc: "High risk amplification. Avoid holding parallel long positions to prevent exposure compounding.",
        color: "text-emerald-400 font-semibold"
      };
    }
    if (r >= 0.30) {
      return {
        label: "Moderate Positive Correlation",
        desc: "Moderate coupling. Price movements are somewhat synchronized across standard indices.",
        color: "text-teal-400"
      };
    }
    if (r > -0.30 && r < 0.30) {
      return {
        label: "Uncorrelated / Independent",
        desc: "Excellent diversification! Price vectors are independent. Great for smoothing systematic risk.",
        color: "text-slate-300 font-medium"
      };
    }
    if (r <= -0.70) {
      return {
        label: "Strong Negative Correlation",
        desc: "Perfect risk offset. Excellent for hedging. Moves in opposing cycles.",
        color: "text-rose-400 font-bold"
      };
    }
    return {
      label: "Moderate Negative Correlation",
      desc: "Good hedging offset. Acts as a natural stabilizer during cross-market fluctuations.",
      color: "text-rose-300 font-medium"
    };
  };

  // Determine cell background color class based on correlation coefficient
  const getCellBgClass = (val: number) => {
    if (val === 1) return "bg-blue-600/60 text-white font-bold";
    if (val >= 0.8) return "bg-emerald-600/70 text-emerald-50";
    if (val >= 0.5) return "bg-emerald-600/40 text-emerald-100";
    if (val >= 0.2) return "bg-emerald-600/20 text-emerald-200/80";
    if (val > -0.2) return "bg-slate-800 text-slate-400";
    if (val > -0.5) return "bg-rose-950/40 text-rose-200/80";
    if (val > -0.8) return "bg-rose-600/30 text-rose-100";
    return "bg-rose-600/60 text-rose-50";
  };

  return (
    <div className="bg-[#1A1D23] border border-white/5 rounded-xl p-4 flex flex-col gap-4" id="portfolio-correlation">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-white/5 pb-3">
        <div>
          <h3 className="font-display font-semibold text-sm text-[#E2E8F0] flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>Aegis Diversification & Correlation Matrix</span>
          </h3>
          <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">
            Real-time Pearson Coefficient Matrix (r) calculated over rolling market days
          </span>
        </div>
        
        {/* Quick Presets info */}
        <div className="text-[10px] font-mono text-slate-400 bg-[#12151A] px-2.5 py-1 rounded border border-white/5 flex items-center gap-1">
          <Info className="w-3 h-3 text-emerald-400 shrink-0" />
          <span>Select 2 to 10 assets to calculate dynamic covariance.</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        
        {/* LEFT COLUMN: TICKER MANAGER */}
        <div className="xl:col-span-1 bg-[#12151A] border border-white/5 p-3 rounded-xl flex flex-col gap-2.5 max-h-[380px] overflow-y-auto">
          <h4 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider border-b border-white/5 pb-1.5 flex items-center justify-between">
            <span>Asset Catalog ({assets.length})</span>
            <span className="text-emerald-400 text-[9px] lowercase font-normal">{selectedIds.length} active</span>
          </h4>
          
          <div className="space-y-1">
            {assets.map(a => {
              const active = selectedIds.includes(a.id);
              return (
                <button
                  key={a.id}
                  onClick={() => handleToggleAsset(a.id)}
                  className={`w-full flex items-center justify-between p-1.5 px-2.5 rounded-lg text-left text-xs font-mono transition-all cursor-pointer ${
                    active 
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                      : "text-slate-500 hover:text-slate-300 border border-transparent hover:bg-white/5"
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-bold">{a.id}</span>
                    <span className="text-[9px] text-slate-500 font-sans truncate max-w-[120px]">{a.name}</span>
                  </div>
                  {active && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: CORE MATRIX GRID */}
        <div className="xl:col-span-3 flex flex-col gap-3 justify-center">
          {loading ? (
            <div className="h-[280px] flex flex-col items-center justify-center text-slate-500 font-mono text-xs gap-2">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <span>Recalculating covariance vectors...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="p-1 px-1.5 text-left text-[9px] font-mono text-slate-500 font-bold border-b border-r border-white/5 bg-[#12151A]/40 min-w-[65px]" />
                    {selectedIds.map(id => (
                      <th key={id} className="p-1 px-1.5 text-center text-[9px] font-mono text-slate-400 font-semibold border-b border-white/5 bg-[#12151A]/40">
                        {id.split("/")[0]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selectedIds.map(id1 => (
                    <tr key={id1}>
                      <td className="p-1 px-1.5 text-left text-[9px] font-mono text-slate-400 font-semibold border-r border-white/5 bg-[#12151A]/20">
                        {id1}
                      </td>
                      {selectedIds.map(id2 => {
                        const val = matrix[id1]?.[id2] ?? 0;
                        const cellClass = getCellBgClass(val);
                        return (
                          <td 
                            key={id2} 
                            onClick={() => setActivePair({ id1, id2, val })}
                            onMouseEnter={() => setActivePair({ id1, id2, val })}
                            className={`p-2.5 text-center text-xs font-mono border border-white/5 cursor-pointer transition-all hover:scale-105 hover:z-10 relative ${cellClass}`}
                            title={`${id1} vs ${id2}: ${val >= 0 ? "+" : ""}${val}`}
                          >
                            {val >= 0 ? "+" : ""}{val.toFixed(2)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* DYNAMIC ANALYSIS DETAILS BOX */}
          <div className="bg-[#12151A] border border-white/5 p-3 rounded-xl min-h-[75px] flex flex-col justify-center">
            {activePair ? (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-white">
                    {activePair.id1} <span className="text-slate-500 font-normal">vs</span> {activePair.id2}
                  </span>
                  <span className="font-mono text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    r = {activePair.val >= 0 ? "+" : ""}{activePair.val.toFixed(2)}
                  </span>
                </div>
                
                {/* Insights */}
                {(() => {
                  const insight = getCorrelationInsight(activePair.val, activePair.id1, activePair.id2);
                  return (
                    <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                      <b className={`font-mono uppercase tracking-wider text-[10px] mr-1.5 ${insight.color}`}>
                        [{insight.label}]
                      </b>
                      {insight.desc}
                    </p>
                  );
                })()}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-slate-500 text-xs">
                <HelpCircle className="w-4 h-4 text-slate-600 shrink-0" />
                <span>Hover or click any coefficient block in the grid to view dynamic hedge ratios and diversification tips.</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
