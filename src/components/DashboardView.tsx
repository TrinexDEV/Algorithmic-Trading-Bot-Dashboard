import React, { useState, useEffect, useRef } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { 
  Play, Pause, TrendingUp, DollarSign, Activity, ListCollapse, Trash2, 
  ShieldAlert, RefreshCw, Layers, ArrowUpRight, ArrowDownRight, Radio, Server, CheckCircle2, ShieldCheck, X
} from "lucide-react";
import { Asset, TradingPosition, TradeLog, BotPerformance, BotConfig } from "../types";
import CorrelationMatrix from "./CorrelationMatrix";
import AISentinel from "./AISentinel";

interface DashboardProps {
  assets: Asset[];
  performance: BotPerformance;
  positions: TradingPosition[];
  logs: TradeLog[];
  historicalBalances: { time: string; balance: number; equity: number }[];
  config: BotConfig;
  onUpdateConfig: (updated: Partial<BotConfig>) => void;
  onRefresh: () => void;
}

export default function DashboardView({
  assets,
  performance,
  positions,
  logs,
  historicalBalances,
  config,
  onUpdateConfig,
  onRefresh
}: DashboardProps) {
  // Manual Trade state
  const [selectedAssetId, setSelectedAssetId] = useState("BTCUSD");
  const [tradeType, setTradeType] = useState<"BUY" | "SELL">("BUY");
  const [quantity, setQuantity] = useState("0.1");
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [confirmingWipe, setConfirmingWipe] = useState(false);
  const [dailyResetSuccess, setDailyResetSuccess] = useState(false);

  // Inline trade modification states
  const [editingPosId, setEditingPosId] = useState<string | null>(null);
  const [editSl, setEditSl] = useState("");
  const [editTp, setEditTp] = useState("");

  const startEditing = (pos: TradingPosition) => {
    setEditingPosId(pos.id);
    setEditSl(pos.stopLoss.toString());
    setEditTp(pos.takeProfit.toString());
  };

  const handleSaveEdit = async (positionId: string) => {
    try {
      const res = await fetch("/api/trade/modify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ positionId, stopLoss: editSl, takeProfit: editTp })
      });
      if (res.ok) {
        setEditingPosId(null);
        onRefresh();
      }
    } catch (err) {
      console.error("Modify position failed", err);
    }
  };

  // Price change tracking for flash animation
  const [pricePrevMap, setPricePrevMap] = useState({} as Record<string, number>);
  const [flashMap, setFlashMap] = useState({} as Record<string, "up" | "down" | "">);

  useEffect(() => {
    const newFlashes: Record<string, "up" | "down" | ""> = {};
    let hasChanges = false;

    assets.forEach(asset => {
      const prev = pricePrevMap[asset.id];
      if (prev !== undefined && prev !== asset.currentPrice) {
        newFlashes[asset.id] = asset.currentPrice > prev ? "up" : "down";
        hasChanges = true;
      }
    });

    if (hasChanges) {
      setFlashMap(prev => ({ ...prev, ...newFlashes }));
      const timer = setTimeout(() => {
        setFlashMap({});
      }, 800);

      const newPrices: Record<string, number> = {};
      assets.forEach(a => {
        newPrices[a.id] = a.currentPrice;
      });
      setPricePrevMap(newPrices);

      return () => clearTimeout(timer);
    } else if (Object.keys(pricePrevMap).length === 0 && assets.length > 0) {
      const initialPrices: Record<string, number> = {};
      assets.forEach(a => {
        initialPrices[a.id] = a.currentPrice;
      });
      setPricePrevMap(initialPrices);
    }
  }, [assets]);

  // Handle Quick Manual Trade Submit
  const handleExecuteTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await fetch("/api/trade/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetId: selectedAssetId,
          type: tradeType,
          quantity,
          stopLossPrice: stopLoss,
          takeProfitPrice: takeProfit
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Execution failed.");
      }

      setSuccessMessage(`Position opened successfully!`);
      setStopLoss("");
      setTakeProfit("");
      onRefresh();

      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || "Network error.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Close position
  const handleClosePosition = async (positionId: string) => {
    try {
      const res = await fetch("/api/trade/close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ positionId })
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error("Failed to close position", err);
    }
  };

  // Reset Account performance
  const handleResetAccount = async () => {
    if (!confirmingWipe) {
      setConfirmingWipe(true);
      setTimeout(() => setConfirmingWipe(false), 4000);
      return;
    }

    try {
      const res = await fetch("/api/account/reset", { method: "POST" });
      if (res.ok) {
        setConfirmingWipe(false);
        onRefresh();
      }
    } catch (err) {
      console.error("Reset failed", err);
    }
  };

  // Reset daily limits
  const handleResetDailyLimit = async () => {
    try {
      const res = await fetch("/api/account/daily-reset", { method: "POST" });
      if (res.ok) {
        setDailyResetSuccess(true);
        setTimeout(() => setDailyResetSuccess(false), 4000);
        onRefresh();
      }
    } catch (err) {
      console.error("Daily reset failed", err);
    }
  };

  // Toggle bot active state
  const toggleBotState = () => {
    onUpdateConfig({ isActive: !config.isActive });
  };

  const selectedAsset = assets.find(a => a.id === selectedAssetId);

  // Set default SL/TP values based on asset type on change
  useEffect(() => {
    if (selectedAsset) {
      const price = selectedAsset.currentPrice;
      const isBuy = tradeType === "BUY";
      const slMultiplier = config.risk.stopLossPercent / 100;
      const tpMultiplier = config.risk.takeProfitPercent / 100;

      const slVal = isBuy ? price * (1 - slMultiplier) : price * (1 + slMultiplier);
      const tpVal = isBuy ? price * (1 + tpMultiplier) : price * (1 - tpMultiplier);

      const decimals = selectedAsset.type === "forex" ? 5 : 2;
      setStopLoss(slVal.toFixed(decimals));
      setTakeProfit(tpVal.toFixed(decimals));
    }
  }, [selectedAssetId, tradeType]);

  // Chart data formatting
  const chartData = historicalBalances.length > 0 
    ? historicalBalances 
    : [
        { time: "00:00", balance: 100000, equity: 100000 },
        { time: "12:00", balance: 100000, equity: 100000 }
      ];

  const currentPnLSum = positions.reduce((sum, pos) => sum + pos.pnl, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      
      {/* HEADER PERFORMANCE METRICS CARD BLOCK */}
      <div className="col-span-1 lg:col-span-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        {/* Metric 1 */}
        <div className="bg-[#1A1D23] border border-white/5 p-4 rounded-xl flex flex-col justify-between" id="metric-balance">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>BALANCE</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 font-mono text-xl font-bold text-[#E2E8F0] tracking-tight">
            ${performance.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-slate-500">Prop Account Balance</span>
        </div>

        {/* Metric 2 */}
        <div className="bg-[#1A1D23] border border-white/5 p-4 rounded-xl flex flex-col justify-between" id="metric-equity">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>EQUITY</span>
            <Activity className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 font-mono text-xl font-bold text-[#E2E8F0] tracking-tight">
            ${performance.equity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="flex items-center gap-1">
            {currentPnLSum >= 0 ? (
              <span className="text-[10px] text-emerald-400 flex items-center">
                <ArrowUpRight className="w-3 h-3" /> +${currentPnLSum.toFixed(2)} active
              </span>
            ) : (
              <span className="text-[10px] text-rose-400 flex items-center">
                <ArrowDownRight className="w-3 h-3" /> -${Math.abs(currentPnLSum).toFixed(2)} active
              </span>
            )}
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-[#1A1D23] border border-white/5 p-4 rounded-xl flex flex-col justify-between" id="metric-pnl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>REALIZED PNL</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 font-mono text-xl font-bold tracking-tight text-[#E2E8F0]">
            <span className={performance.totalProfit - performance.totalLoss >= 0 ? "text-emerald-400" : "text-rose-400"}>
              ${(performance.totalProfit - performance.totalLoss).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <span className="text-[10px] text-slate-500">Gross Realized Total</span>
        </div>

        {/* Metric 4 */}
        <div className="bg-[#1A1D23] border border-white/5 p-4 rounded-xl flex flex-col justify-between" id="metric-winrate">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>WIN RATE</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 font-mono text-xl font-bold text-[#E2E8F0] tracking-tight">
            {performance.winRate}%
          </div>
          <span className="text-[10px] text-slate-500">Completed Trades</span>
        </div>

        {/* Metric 5 */}
        <div className="bg-[#1A1D23] border border-white/5 p-4 rounded-xl flex flex-col justify-between" id="metric-profit-factor">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>PROFIT FACTOR</span>
            <Layers className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 font-mono text-xl font-bold text-slate-200 tracking-tight">
            {performance.profitFactor}
          </div>
          <span className="text-[10px] text-slate-500">Gross Profit / Loss</span>
        </div>

        {/* Metric 6 */}
        <div className="bg-[#1A1D23] border border-white/5 p-4 rounded-xl flex flex-col justify-between" id="metric-drawdown">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>MAX DRAWDOWN</span>
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 font-mono text-xl font-bold text-rose-400 tracking-tight">
            {performance.maxDrawdownPercent}%
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Limit: {config.risk.maxDailyDrawdownPercent}%</span>
        </div>

        {/* Metric 7: Weekly Loss */}
        <div className="bg-[#1A1D23] border border-white/5 p-4 rounded-xl flex flex-col justify-between" id="metric-weekly-loss">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>WEEKLY LOSS</span>
            <ShieldAlert className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 font-mono text-xl font-bold text-[#E2E8F0] tracking-tight">
            ${(performance.weeklyLossTotal || 0.00).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Limit: ${config.risk.weeklyLossLimitUSD || 15000}</span>
        </div>

        {/* Metric 8: Bot Controls */}
        <div className="bg-[#12151A] border border-white/10 p-3 rounded-xl flex flex-col justify-between col-span-2 md:col-span-1" id="metric-bot-control">
          <div className="text-slate-400 text-[10px] font-medium tracking-wider uppercase font-mono">AUTOMATION STATUS</div>
          <button
            onClick={toggleBotState}
            className={`w-full py-2 px-3 rounded-lg font-medium text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              config.isActive 
                ? "bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30" 
                : "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20"
            }`}
          >
            {config.isActive ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Stop Bot Mode</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start Bot Mode</span>
              </>
            )}
          </button>
          <div className="flex items-center justify-center gap-1.5 mt-1.5">
            <span className={`w-2 h-2 rounded-full ${config.isActive ? "bg-emerald-400 animate-pulse" : "bg-slate-600"}`} />
            <span className="text-[10px] font-mono text-slate-400 uppercase">
              {config.isActive ? "Auto Trading" : "Suspended"}
            </span>
          </div>
        </div>
      </div>

      {/* COLUMN 1: INTERACTIVE MARKET WATCHLIST & QUICK TERMINAL */}
      <div className="lg:col-span-1 flex flex-col gap-6">
        {/* Watchlist */}
        <div className="bg-[#1A1D23] border border-white/5 rounded-xl overflow-hidden" id="market-watchlist">
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <h3 className="font-display font-semibold text-sm text-[#E2E8F0] flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400" />
              <span>Live Watchlist</span>
            </h3>
            <span className="text-[10px] font-mono bg-[#12151A] text-emerald-400 px-1.5 py-0.5 rounded flex items-center gap-1 border border-white/5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              TICKING
            </span>
          </div>
          
          <div className="divide-y divide-white/5 max-h-[310px] overflow-y-auto">
            {assets.map(asset => {
              const flash = flashMap[asset.id];
              const flashClass = flash === "up" 
                ? "bg-emerald-500/20 text-emerald-400 font-bold" 
                : flash === "down" 
                ? "bg-rose-500/20 text-rose-400 font-bold" 
                : "";

              return (
                <div 
                  key={asset.id} 
                  onClick={() => setSelectedAssetId(asset.id)}
                  className={`p-3 flex items-center justify-between hover:bg-white/5 cursor-pointer transition-colors ${
                    selectedAssetId === asset.id ? "bg-white/5 border-l-2 border-blue-500" : ""
                  }`}
                >
                  <div>
                    <div className="font-mono text-xs font-semibold text-white">{asset.id}</div>
                    <div className="text-[10px] text-slate-500">{asset.name}</div>
                  </div>
                  <div className="text-right">
                    <div className={`font-mono text-xs p-1 rounded transition-all ${flashClass}`}>
                      ${asset.currentPrice.toLocaleString(undefined, { 
                        minimumFractionDigits: asset.type === "forex" ? 5 : 2,
                        maximumFractionDigits: asset.type === "forex" ? 5 : 2
                      })}
                    </div>
                    <span className={`text-[10px] font-mono ${asset.change24h >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {asset.change24h >= 0 ? "+" : ""}{asset.change24h}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Order Terminal */}
        <div className="bg-[#1A1D23] border border-white/5 rounded-xl p-4" id="manual-execution-terminal">
          <h3 className="font-display font-semibold text-sm text-[#E2E8F0] mb-3 flex items-center gap-2">
            <Server className="w-4 h-4 text-blue-400" />
            <span>Order Ticket</span>
          </h3>

          <form onSubmit={handleExecuteTrade} className="space-y-3">
            <div>
              <label className="block text-[10px] font-medium text-slate-400 mb-1">ASSET CONTRACT</label>
              <select
                value={selectedAssetId}
                onChange={(e) => setSelectedAssetId(e.target.value)}
                className="w-full bg-[#12151A] border border-white/10 rounded-lg py-1.5 px-3 font-mono text-xs text-white focus:outline-none focus:border-blue-500"
              >
                {assets.map(a => (
                  <option key={a.id} value={a.id}>{a.id} - {a.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTradeType("BUY")}
                className={`py-1.5 rounded-lg font-semibold text-xs transition-colors cursor-pointer ${
                  tradeType === "BUY"
                    ? "bg-emerald-500 text-slate-950"
                    : "bg-[#12151A] text-slate-400 border border-white/5 hover:bg-white/5"
                }`}
              >
                BUY / LONG
              </button>
              <button
                type="button"
                onClick={() => setTradeType("SELL")}
                className={`py-1.5 rounded-lg font-semibold text-xs transition-colors cursor-pointer ${
                  tradeType === "SELL"
                    ? "bg-rose-500 text-white"
                    : "bg-[#12151A] text-slate-400 border border-white/5 hover:bg-white/5"
                }`}
              >
                SELL / SHORT
              </button>
            </div>

            <div>
              <label className="block text-[10px] font-medium text-slate-400 mb-1 font-mono">POSITION SIZE (LOTS / QTY)</label>
              <input
                type="number"
                step="0.0001"
                min="0.0001"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full bg-[#12151A] border border-white/10 rounded-lg py-1.5 px-3 font-mono text-xs text-white focus:outline-none focus:border-blue-500"
                placeholder="e.g. 0.1, 1.5"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-medium text-slate-400 mb-1 font-mono">STOP LOSS ($)</label>
                <input
                  type="number"
                  step="0.00001"
                  value={stopLoss}
                  onChange={(e) => setStopLoss(e.target.value)}
                  className="w-full bg-[#12151A] border border-white/10 rounded-lg py-1.5 px-3 font-mono text-xs text-white focus:outline-none focus:border-blue-500"
                  placeholder="SL Price"
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-slate-400 mb-1 font-mono">TAKE PROFIT ($)</label>
                <input
                  type="number"
                  step="0.00001"
                  value={takeProfit}
                  onChange={(e) => setTakeProfit(e.target.value)}
                  className="w-full bg-[#12151A] border border-white/10 rounded-lg py-1.5 px-3 font-mono text-xs text-white focus:outline-none focus:border-blue-500"
                  placeholder="TP Price"
                />
              </div>
            </div>

            {errorMessage && (
              <div className="text-[10px] bg-rose-500/10 border border-rose-500/20 text-rose-400 p-2 rounded font-mono">
                {errorMessage}
              </div>
            )}
            {successMessage && (
              <div className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-2 rounded flex items-center gap-1 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800/50 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-md shadow-blue-600/10 flex items-center justify-center gap-2"
            >
              <Server className="w-3.5 h-3.5" />
              <span>{isSubmitting ? "Routing to Broker..." : `Transmit manual ${tradeType}`}</span>
            </button>
          </form>
        </div>
      </div>

      {/* COLS 2-4: LIVE PERFORMANCE CHART, OPEN POSITIONS & LOGS */}
      <div className="lg:col-span-3 flex flex-col gap-6">
        
        {/* Live Equity Performance Curve Chart */}
        <div className="bg-[#1A1D23] border border-white/5 rounded-xl p-4" id="performance-chart">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-semibold text-sm text-[#E2E8F0]">Equity Performance</h3>
              <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Live account history tracker comparing balance vs active float equity</span>
            </div>
            
            <div className="flex items-center gap-4 font-mono text-[10px]">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-slate-400">Balance</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-slate-400">Equity</span>
              </div>
            </div>
          </div>

          <div className="h-[230px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#475569" fontSize={9} tickLine={false} />
                <YAxis stroke="#475569" fontSize={9} domain={['auto', 'auto']} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#12151A', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  labelStyle={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: '10px' }}
                  itemStyle={{ fontFamily: 'monospace', fontSize: '11px' }}
                />
                <Area type="monotone" dataKey="balance" stroke="#3b82f6" strokeWidth={1.5} fillOpacity={1} fill="url(#colorBalance)" />
                <Area type="monotone" dataKey="equity" stroke="#34d399" strokeWidth={1.5} fillOpacity={1} fill="url(#colorEquity)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Sentinel Engine & News Scrawler */}
        <AISentinel config={config} onRefresh={onRefresh} />

        {/* Asset Class Correlation Matrix */}
        <CorrelationMatrix assets={assets} />

        {/* Active Open Positions Terminal */}
        <div className="bg-[#1A1D23] border border-white/5 rounded-xl overflow-hidden" id="open-positions-terminal">
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <h3 className="font-display font-semibold text-sm text-[#E2E8F0] flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" />
              <span>Active Positions ({positions.length})</span>
            </h3>
            
            <div className="flex gap-2">
              <button
                onClick={handleResetDailyLimit}
                className={`py-1 px-2 border rounded text-[10px] font-medium flex items-center gap-1 cursor-pointer transition-colors ${
                  dailyResetSuccess
                    ? "border-emerald-500/50 text-emerald-400 bg-emerald-500/10"
                    : "border-rose-500/30 text-rose-400 bg-rose-500/5 hover:bg-rose-500/10"
                }`}
                title="Wipes daily losses/drawdown counters so that the bot can trade again."
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{dailyResetSuccess ? "Limits Reset!" : "Reset Daily Limits"}</span>
              </button>
              <button
                onClick={handleResetAccount}
                className={`py-1 px-2 border rounded text-[10px] font-medium flex items-center gap-1 cursor-pointer transition-colors ${
                  confirmingWipe
                    ? "border-rose-500 bg-rose-600 text-white animate-pulse"
                    : "border-white/10 text-slate-400 hover:bg-white/5 bg-[#12151A]"
                }`}
                title="Completely resets balance history, positions, and logs back to baseline."
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{confirmingWipe ? "Confirm Wipe?" : "Wipe Engine"}</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            {positions.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No active positions. Open a contract manually above or activate Bot Automation mode.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#12151A] text-slate-400 font-mono text-[10px] uppercase border-b border-white/10">
                    <th className="p-3">Asset</th>
                    <th className="p-3">Type</th>
                    <th className="p-3 text-right">Size</th>
                    <th className="p-3 text-right">Entry</th>
                    <th className="p-3 text-right">Current</th>
                    <th className="p-3 text-right">Stop Loss</th>
                    <th className="p-3 text-right">Take Profit</th>
                    <th className="p-3 text-right">Floating Profit</th>
                    <th className="p-3 text-right">Execution Route</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {positions.map(pos => {
                    const isLong = pos.type === "BUY";
                    const isWin = pos.pnl >= 0;

                    return (
                      <tr key={pos.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-3">
                          <div className="font-mono text-xs font-bold text-white">{pos.assetId}</div>
                          <div className="text-[9px] text-slate-500">{pos.name}</div>
                        </td>
                        <td className="p-3">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold font-mono ${
                            isLong ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                          }`}>
                            {pos.type}
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono text-xs text-slate-300">
                          {pos.quantity}
                        </td>
                        <td className="p-3 text-right font-mono text-xs text-slate-300">
                          ${pos.entryPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-right font-mono text-xs text-slate-300">
                          ${pos.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-right font-mono text-xs text-rose-400/80">
                          {editingPosId === pos.id ? (
                            <input
                              type="number"
                              step="0.01"
                              value={editSl}
                              onChange={(e) => setEditSl(e.target.value)}
                              className="w-20 bg-[#12151A] border border-white/10 rounded py-0.5 px-1 text-center font-mono text-xs text-white"
                            />
                          ) : (
                            pos.stopLoss > 0 ? `$${pos.stopLoss.toLocaleString()}` : "NONE"
                          )}
                        </td>
                        <td className="p-3 text-right font-mono text-xs text-emerald-400/80">
                          {editingPosId === pos.id ? (
                            <input
                              type="number"
                              step="0.01"
                              value={editTp}
                              onChange={(e) => setEditTp(e.target.value)}
                              className="w-20 bg-[#12151A] border border-white/10 rounded py-0.5 px-1 text-center font-mono text-xs text-white"
                            />
                          ) : (
                            pos.takeProfit > 0 ? `$${pos.takeProfit.toLocaleString()}` : "NONE"
                          )}
                        </td>
                        <td className={`p-3 text-right font-mono text-xs font-semibold ${isWin ? "text-emerald-400" : "text-rose-400"}`}>
                          {isWin ? "+" : ""}${pos.pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          <span className="text-[9px] block">({isWin ? "+" : ""}{pos.pnlPercent.toFixed(2)}%)</span>
                        </td>
                        <td className="p-3 text-right">
                          <span className="text-[10px] font-mono bg-[#12151A] px-1.5 py-0.5 rounded text-slate-400 border border-white/10">
                            {pos.provider}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {editingPosId === pos.id ? (
                              <>
                                <button
                                  onClick={() => handleSaveEdit(pos.id)}
                                  className="p-1 text-emerald-400 hover:text-emerald-300 bg-[#12151A] hover:bg-emerald-950/30 border border-emerald-500/20 rounded cursor-pointer transition-colors text-[10px] font-bold font-mono"
                                  title="Save SL/TP Limits"
                                >
                                  SAVE
                                </button>
                                <button
                                  onClick={() => setEditingPosId(null)}
                                  className="p-1 text-slate-400 hover:text-white bg-[#12151A] border border-white/10 rounded cursor-pointer transition-colors text-[10px] font-bold font-mono"
                                  title="Cancel"
                                >
                                  CANCEL
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => startEditing(pos)}
                                  className="p-1 text-slate-400 hover:text-blue-400 bg-[#12151A] hover:bg-blue-950/30 border border-white/10 hover:border-blue-900/50 rounded cursor-pointer transition-colors text-[10px] font-bold font-mono"
                                  title="Modify SL/TP"
                                >
                                  MODIFY
                                </button>
                                <button
                                  onClick={() => handleClosePosition(pos.id)}
                                  className="p-1 text-slate-400 hover:text-rose-400 bg-[#12151A] hover:bg-rose-950/30 border border-white/10 hover:border-rose-900/50 rounded cursor-pointer transition-colors"
                                  title="Instant Liquidation"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Real-time Bot Console Logs */}
        <div className="bg-[#1A1D23] border border-white/5 rounded-xl overflow-hidden" id="live-bot-logs">
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <h3 className="font-display font-semibold text-sm text-[#E2E8F0] flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Diagnostic Terminal Console</span>
            </h3>
            <span className="text-[9px] text-slate-400 font-mono">Max entries: 50</span>
          </div>

          <div className="bg-[#12151A] p-4 font-mono text-xs h-[160px] overflow-y-auto space-y-1 text-slate-300">
            {logs.length === 0 ? (
              <div className="text-slate-600 text-center py-4">
                Diagnostic system idle. All modules active.
              </div>
            ) : (
              logs.map((log) => {
                let colorClass = "text-slate-400";
                if (log.type === "BUY") colorClass = "text-emerald-400";
                else if (log.type === "SELL") colorClass = "text-rose-400";
                else if (log.type === "CLOSE_TP") colorClass = "text-emerald-500 font-medium";
                else if (log.type === "CLOSE_SL") colorClass = "text-rose-500 font-medium";

                return (
                  <div key={log.id} className="leading-5 hover:bg-white/5 px-1 rounded transition-colors flex items-start gap-2">
                    <span className="text-slate-600 select-none shrink-0 font-mono">
                      [{new Date(log.timestamp).toLocaleTimeString()}]
                    </span>
                    <span className={`font-semibold uppercase shrink-0 font-mono text-[11px] ${
                      log.assetId === "SYSTEM" ? "text-blue-400" : log.assetId === "FTMO" ? "text-amber-500" : log.assetId === "JIFO" ? "text-cyan-400" : "text-slate-200"
                    }`}>
                      {log.assetId}:
                    </span>
                    <span className={colorClass}>{log.details}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
