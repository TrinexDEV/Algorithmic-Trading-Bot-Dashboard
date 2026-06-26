import React, { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { 
  Sliders, Play, CheckCircle2, TrendingUp, AlertTriangle, HelpCircle, 
  Layers, ArrowUpRight, ArrowDownRight, Award, Shield, FileText, Compass, Sparkles 
} from "lucide-react";
import { BotConfig, BacktestResult, Asset } from "../types";

interface BacktestViewProps {
  assets: Asset[];
  config: BotConfig;
}

export default function BacktestView({ assets, config }: BacktestViewProps) {
  const [assetId, setAssetId] = useState("XAU/USD"); // default gold trading
  const [strategyId, setStrategyId] = useState<BotConfig["strategyId"]>("ema_crossover");
  const [backtestDays, setBacktestDays] = useState("30");
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Parameter states (copied initial state defaults)
  const [emaFast, setEmaFast] = useState(config.indicators.emaCross.fastPeriod.toString());
  const [emaSlow, setEmaSlow] = useState(config.indicators.emaCross.slowPeriod.toString());
  const [rsiPeriod, setRsiPeriod] = useState(config.indicators.rsi.period.toString());
  const [rsiOverbought, setRsiOverbought] = useState(config.indicators.rsi.overbought.toString());
  const [rsiOversold, setRsiOversold] = useState(config.indicators.rsi.oversold.toString());
  const [macdFast, setMacdFast] = useState(config.indicators.macd.fastPeriod.toString());
  const [macdSlow, setMacdSlow] = useState(config.indicators.macd.slowPeriod.toString());
  const [macdSignal, setMacdSignal] = useState(config.indicators.macd.signalPeriod.toString());
  const [bbPeriod, setBbPeriod] = useState(config.indicators.bollinger.period.toString());
  const [bbStdDev, setBbStdDev] = useState(config.indicators.bollinger.stdDev.toString());

  const [stochKPeriod, setStochKPeriod] = useState(config.indicators.stochastic?.kPeriod?.toString() || "14");
  const [stochDPeriod, setStochDPeriod] = useState(config.indicators.stochastic?.dPeriod?.toString() || "3");
  const [stochOverbought, setStochOverbought] = useState(config.indicators.stochastic?.overbought?.toString() || "80");
  const [stochOversold, setStochOversold] = useState(config.indicators.stochastic?.oversold?.toString() || "20");

  const [ichiTenkan, setIchiTenkan] = useState(config.indicators.ichimoku?.tenkanPeriod?.toString() || "9");
  const [ichiKijun, setIchiKijun] = useState(config.indicators.ichimoku?.kijunPeriod?.toString() || "26");
  const [ichiSenkouB, setIchiSenkouB] = useState(config.indicators.ichimoku?.senkouBPeriod?.toString() || "52");

  // Risk parameters for backtester override
  const [stopLossPercent, setStopLossPercent] = useState(config.risk.stopLossPercent.toString());
  const [takeProfitPercent, setTakeProfitPercent] = useState(config.risk.takeProfitPercent.toString());
  const [positionSizePercent, setPositionSizePercent] = useState(config.risk.positionSizePercent.toString());
  const [trailingStop, setTrailingStop] = useState(config.risk.trailingStop);

  const handleRunBacktest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRunning(true);
    setResult(null);
    setErrorMsg("");

    // Package request
    const payload = {
      assetId,
      strategyId,
      days: backtestDays,
      indicators: {
        rsi: { period: parseInt(rsiPeriod), overbought: parseInt(rsiOverbought), oversold: parseInt(rsiOversold) },
        macd: { fastPeriod: parseInt(macdFast), slowPeriod: parseInt(macdSlow), signalPeriod: parseInt(macdSignal) },
        emaCross: { fastPeriod: parseInt(emaFast), slowPeriod: parseInt(emaSlow) },
        bollinger: { period: parseInt(bbPeriod), stdDev: parseFloat(bbStdDev) },
        stochastic: { kPeriod: parseInt(stochKPeriod), dPeriod: parseInt(stochDPeriod), overbought: parseInt(stochOverbought), oversold: parseInt(stochOversold) },
        ichimoku: { tenkanPeriod: parseInt(ichiTenkan), kijunPeriod: parseInt(ichiKijun), senkouBPeriod: parseInt(ichiSenkouB) }
      },
      stopLossPercent: parseFloat(stopLossPercent),
      takeProfitPercent: parseFloat(takeProfitPercent),
      positionSizePercent: parseFloat(positionSizePercent),
      trailingStop
    };

    try {
      const res = await fetch("/api/backtest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to execute backtest");
      }

      // Simulate a brief premium "calculating" pause for UI immersion
      setTimeout(() => {
        setResult(data);
        setIsRunning(false);
      }, 1200);

    } catch (err: any) {
      setErrorMsg(err.message || "Network execution failed.");
      setIsRunning(false);
    }
  };

  const selectedAsset = assets.find(a => a.id === assetId);

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="bg-[#1A1D23] border border-white/5 p-6 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-xl text-white flex items-center gap-2">
            <Compass className="w-5 h-5 text-blue-400" />
            <span>Backtesting Strategy Engine</span>
          </h2>
          <p className="text-slate-400 text-xs mt-1 max-w-xl">
            Simulate your trading strategy over deep historical periods using real candles data logic. Optimise indicator levels, lot allocation sizes, and trailing boundaries prior to live implementation.
          </p>
        </div>
        
        <div className="bg-[#12151A] border border-white/10 px-4 py-2.5 rounded-lg flex items-center gap-3">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <div className="text-left">
            <div className="text-[9px] text-slate-500 font-medium">SANDBOX PERSISTENCE</div>
            <div className="text-[10px] font-mono text-emerald-400 font-semibold">100% Client-Side Risk Free</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* STRATEGY PARAMETER BUILDER SIDEBAR */}
        <div className="bg-[#1A1D23] border border-white/5 rounded-xl p-4">
          <h3 className="font-display font-semibold text-sm text-[#E2E8F0] mb-4 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-400" />
            <span>Strategy Inputs</span>
          </h3>

          <form onSubmit={handleRunBacktest} className="space-y-4">
            {/* Asset */}
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1 font-mono">ASSET FOR TEST</label>
              <select
                value={assetId}
                onChange={(e) => setAssetId(e.target.value)}
                className="w-full bg-[#12151A] border border-white/10 rounded-lg py-1.5 px-3 font-mono text-xs text-white focus:outline-none focus:border-blue-500"
              >
                {assets.map(a => (
                  <option key={a.id} value={a.id}>{a.id} - {a.name}</option>
                ))}
              </select>
            </div>

            {/* Strategy Selection */}
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1 font-mono">CORE INDICATOR ALGORITHM</label>
              <select
                value={strategyId}
                onChange={(e) => setStrategyId(e.target.value as any)}
                className="w-full bg-[#12151A] border border-white/10 rounded-lg py-1.5 px-3 font-mono text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="ema_crossover">EMA Crossover (Trend Follow)</option>
                <option value="rsi_divergence">RSI Overbought/Oversold (Mean Reversion)</option>
                <option value="macd_trend">MACD Signal Line Crossover (Trend momentum)</option>
                <option value="bollinger_mean_reversion">Bollinger Bands Deviation (Volatility breakout)</option>
                <option value="stochastic_oscillator">Stochastic Oscillator (Momentum Crossover)</option>
                <option value="ichimoku_cloud">Ichimoku Cloud (TK Crossover & Filter)</option>
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1 font-mono">SIMULATION DATE WINDOW</label>
              <select
                value={backtestDays}
                onChange={(e) => setBacktestDays(e.target.value)}
                className="w-full bg-[#12151A] border border-white/10 rounded-lg py-1.5 px-3 font-mono text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="7">Last 7 Days (Short Term Volatility)</option>
                <option value="15">Last 15 Days (Mid Term Trend)</option>
                <option value="30">Last 30 Days (Standard 1 Month)</option>
                <option value="90">Last 90 Days (Deep Backtest)</option>
              </select>
            </div>

            {/* STRATEGY SPECIFIC CONFIG BLOCKS */}
            <div className="bg-[#12151A] p-3 border border-white/10 rounded-lg space-y-3">
              <span className="text-[9px] text-blue-400 font-mono font-bold tracking-wider uppercase block">TECHNICAL INDICES</span>
              
              {strategyId === "ema_crossover" && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] text-slate-500 mb-1">FAST EMA</label>
                    <input
                      type="number"
                      value={emaFast}
                      onChange={(e) => setEmaFast(e.target.value)}
                      className="w-full bg-[#1A1D23] border border-white/5 rounded py-1 px-2 font-mono text-xs text-white text-center"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-500 mb-1">SLOW EMA</label>
                    <input
                      type="number"
                      value={emaSlow}
                      onChange={(e) => setEmaSlow(e.target.value)}
                      className="w-full bg-[#1A1D23] border border-white/5 rounded py-1 px-2 font-mono text-xs text-white text-center"
                      required
                    />
                  </div>
                </div>
              )}

              {strategyId === "rsi_divergence" && (
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-1">
                    <div>
                      <label className="block text-[9px] text-slate-500 mb-1 text-center font-mono">PERIOD</label>
                      <input
                        type="number"
                        value={rsiPeriod}
                        onChange={(e) => setRsiPeriod(e.target.value)}
                        className="w-full bg-[#1A1D23] border border-white/5 rounded py-1 px-1 font-mono text-xs text-white text-center"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-rose-400 mb-1 text-center font-mono">OVERBOUGHT</label>
                      <input
                        type="number"
                        value={rsiOverbought}
                        onChange={(e) => setRsiOverbought(e.target.value)}
                        className="w-full bg-[#1A1D23] border border-white/5 rounded py-1 px-1 font-mono text-xs text-white text-center"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-emerald-400 mb-1 text-center font-mono">OVERSOLD</label>
                      <input
                        type="number"
                        value={rsiOversold}
                        onChange={(e) => setRsiOversold(e.target.value)}
                        className="w-full bg-[#1A1D23] border border-white/5 rounded py-1 px-1 font-mono text-xs text-white text-center"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {strategyId === "macd_trend" && (
                <div className="grid grid-cols-3 gap-1">
                  <div>
                    <label className="block text-[9px] text-slate-500 mb-1 text-center">FAST</label>
                    <input
                      type="number"
                      value={macdFast}
                      onChange={(e) => setMacdFast(e.target.value)}
                      className="w-full bg-[#1A1D23] border border-white/5 rounded py-1 px-1 font-mono text-xs text-white text-center"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-500 mb-1 text-center">SLOW</label>
                    <input
                      type="number"
                      value={macdSlow}
                      onChange={(e) => setMacdSlow(e.target.value)}
                      className="w-full bg-[#1A1D23] border border-white/5 rounded py-1 px-1 font-mono text-xs text-white text-center"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-500 mb-1 text-center">SIGNAL</label>
                    <input
                      type="number"
                      value={macdSignal}
                      onChange={(e) => setMacdSignal(e.target.value)}
                      className="w-full bg-[#1A1D23] border border-white/5 rounded py-1 px-1 font-mono text-xs text-white text-center"
                      required
                    />
                  </div>
                </div>
              )}

              {strategyId === "bollinger_mean_reversion" && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] text-slate-500 mb-1">MA PERIOD</label>
                    <input
                      type="number"
                      value={bbPeriod}
                      onChange={(e) => setBbPeriod(e.target.value)}
                      className="w-full bg-[#1A1D23] border border-white/5 rounded py-1 px-2 font-mono text-xs text-white text-center"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-500 mb-1">STDEV MULT</label>
                    <input
                      type="number"
                      step="0.1"
                      value={bbStdDev}
                      onChange={(e) => setBbStdDev(e.target.value)}
                      className="w-full bg-[#1A1D23] border border-white/5 rounded py-1 px-2 font-mono text-xs text-white text-center"
                      required
                    />
                  </div>
                </div>
              )}

              {strategyId === "stochastic_oscillator" && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] text-slate-500 mb-1 text-center font-mono">%K PERIOD</label>
                      <input
                        type="number"
                        value={stochKPeriod}
                        onChange={(e) => setStochKPeriod(e.target.value)}
                        className="w-full bg-[#1A1D23] border border-white/5 rounded py-1 px-1 font-mono text-xs text-white text-center"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-slate-500 mb-1 text-center font-mono">%D SMOOTH</label>
                      <input
                        type="number"
                        value={stochDPeriod}
                        onChange={(e) => setStochDPeriod(e.target.value)}
                        className="w-full bg-[#1A1D23] border border-white/5 rounded py-1 px-1 font-mono text-xs text-white text-center"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] text-rose-400 mb-1 text-center font-mono">OVERBOUGHT</label>
                      <input
                        type="number"
                        value={stochOverbought}
                        onChange={(e) => setStochOverbought(e.target.value)}
                        className="w-full bg-[#1A1D23] border border-white/5 rounded py-1 px-1 font-mono text-xs text-white text-center"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-emerald-400 mb-1 text-center font-mono">OVERSOLD</label>
                      <input
                        type="number"
                        value={stochOversold}
                        onChange={(e) => setStochOversold(e.target.value)}
                        className="w-full bg-[#1A1D23] border border-white/5 rounded py-1 px-1 font-mono text-xs text-white text-center"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {strategyId === "ichimoku_cloud" && (
                <div className="grid grid-cols-3 gap-1">
                  <div>
                    <label className="block text-[9px] text-slate-500 mb-1 text-center">TENKAN (9)</label>
                    <input
                      type="number"
                      value={ichiTenkan}
                      onChange={(e) => setIchiTenkan(e.target.value)}
                      className="w-full bg-[#1A1D23] border border-white/5 rounded py-1 px-1 font-mono text-xs text-white text-center"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-500 mb-1 text-center">KIJUN (26)</label>
                    <input
                      type="number"
                      value={ichiKijun}
                      onChange={(e) => setIchiKijun(e.target.value)}
                      className="w-full bg-[#1A1D23] border border-white/5 rounded py-1 px-1 font-mono text-xs text-white text-center"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-500 mb-1 text-center">SENKOU B (52)</label>
                    <input
                      type="number"
                      value={ichiSenkouB}
                      onChange={(e) => setIchiSenkouB(e.target.value)}
                      className="w-full bg-[#1A1D23] border border-white/5 rounded py-1 px-1 font-mono text-xs text-white text-center"
                      required
                    />
                  </div>
                </div>
              )}
            </div>

            {/* RISK RULES SECTION OVERRIDE */}
            <div className="bg-[#12151A] p-3 border border-white/10 rounded-lg space-y-3">
              <span className="text-[9px] text-amber-500 font-mono font-bold tracking-wider uppercase block">RISK MANAGEMENT LIMITS</span>

              <div className="grid grid-cols-3 gap-1">
                <div>
                  <label className="block text-[9px] text-slate-500 mb-1 text-center font-mono">STOP LOSS (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={stopLossPercent}
                    onChange={(e) => setStopLossPercent(e.target.value)}
                    className="w-full bg-[#1A1D23] border border-white/5 rounded py-1 px-1 font-mono text-xs text-white text-center"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-slate-500 mb-1 text-center font-mono">TAKE PROFIT (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={takeProfitPercent}
                    onChange={(e) => setTakeProfitPercent(e.target.value)}
                    className="w-full bg-[#1A1D23] border border-white/5 rounded py-1 px-1 font-mono text-xs text-white text-center"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-slate-500 mb-1 text-center font-mono">TRADE CAP (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={positionSizePercent}
                    onChange={(e) => setPositionSizePercent(e.target.value)}
                    className="w-full bg-[#1A1D23] border border-white/5 rounded py-1 px-1 font-mono text-xs text-white text-center"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-slate-400 font-medium font-mono">TRAILING STOP-LOSS</span>
                <button
                  type="button"
                  onClick={() => setTrailingStop(!trailingStop)}
                  className={`w-9 h-5 rounded-full transition-colors cursor-pointer relative flex items-center ${
                    trailingStop ? "bg-blue-600" : "bg-[#12151A] border border-white/10"
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform absolute ${
                    trailingStop ? "translate-x-4.5" : "translate-x-1"
                  }`} />
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="text-[11px] text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg font-mono">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={isRunning}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800/40 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-lg shadow-blue-600/10 flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{isRunning ? "Recompiling Indicators..." : "Run Historical Backtest"}</span>
            </button>
          </form>
        </div>

        {/* RESULTS SCREEN OR BLANK CANVAS */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {isRunning ? (
            <div className="bg-[#1A1D23] border border-white/5 rounded-xl p-8 flex flex-col items-center justify-center text-center h-[520px]">
              <div className="relative w-12 h-12 mb-4">
                <div className="absolute inset-0 border-2 border-blue-500/30 rounded-full" />
                <div className="absolute inset-0 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
              <h4 className="font-display font-bold text-[#E2E8F0]">Reconstructing Candle Data...</h4>
              <p className="text-slate-500 text-xs mt-2 max-w-xs leading-5">
                Calculating standard deviations, moving averages, relative strength index intervals, and routing backtest trades on {backtestDays} days of candle sets.
              </p>
            </div>
          ) : result ? (
            <div className="space-y-6">
              
              {/* BACKTEST STATISTICS CARDS */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Metric A */}
                <div className="bg-[#1A1D23] border border-white/5 p-4 rounded-xl">
                  <div className="text-slate-400 text-[10px] font-medium uppercase font-mono">NET PROFIT</div>
                  <div className={`text-xl font-mono font-bold mt-1 ${result.metrics.netProfit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {result.metrics.netProfit >= 0 ? "+" : ""}${result.metrics.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <span className={`text-[10px] font-mono font-medium ${result.metrics.netProfitPercent >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {result.metrics.netProfitPercent >= 0 ? "+" : ""}{result.metrics.netProfitPercent.toFixed(2)}%
                  </span>
                </div>

                {/* Metric B */}
                <div className="bg-[#1A1D23] border border-white/5 p-4 rounded-xl">
                  <div className="text-slate-400 text-[10px] font-medium uppercase font-mono">TOTAL TRADES</div>
                  <div className="text-xl font-mono font-bold mt-1 text-slate-200">
                    {result.metrics.totalTrades}
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">Buy / Sell Positions</span>
                </div>

                {/* Metric C */}
                <div className="bg-[#1A1D23] border border-white/5 p-4 rounded-xl">
                  <div className="text-slate-400 text-[10px] font-medium uppercase font-mono">WIN RATE</div>
                  <div className="text-xl font-mono font-bold mt-1 text-emerald-400">
                    {result.metrics.winRate}%
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono font-medium">Positive PnL Closes</span>
                </div>

                {/* Metric D */}
                <div className="bg-[#1A1D23] border border-white/5 p-4 rounded-xl">
                  <div className="text-slate-400 text-[10px] font-medium uppercase font-mono">SHARPE RATIO</div>
                  <div className="text-xl font-mono font-bold mt-1 text-blue-400 flex items-center gap-1">
                    <Award className="w-4 h-4 text-blue-400" />
                    <span>{result.metrics.sharpeRatio}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">Max Drawdown: <b className="text-rose-400">{result.metrics.maxDrawdownPercent}%</b></span>
                </div>
              </div>

              {/* EQUITY COMPOUNDING GRAPH */}
              <div className="bg-[#1A1D23] border border-white/5 rounded-xl p-4">
                <h3 className="font-display font-semibold text-sm text-[#E2E8F0] mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                  <span>Simulated Equity Curve</span>
                </h3>
                
                <div className="h-[210px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={result.equityCurve}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <defs>
                        <linearGradient id="colorBacktest" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="time" stroke="#475569" fontSize={9} tickLine={false} />
                      <YAxis stroke="#475569" fontSize={9} domain={['auto', 'auto']} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#12151A', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                        labelStyle={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: '10px' }}
                        itemStyle={{ fontFamily: 'monospace', fontSize: '11px', color: '#60a5fa' }}
                      />
                      <Area type="monotone" dataKey="equity" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorBacktest)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* SIMULATION TRADES TABLE LIST */}
              <div className="bg-[#1A1D23] border border-white/5 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-white/5">
                  <h3 className="font-display font-semibold text-sm text-[#E2E8F0] flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-400" />
                    <span>Backtest Positions History</span>
                  </h3>
                </div>

                <div className="overflow-y-auto max-h-[220px]">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#12151A] text-slate-500 font-mono text-[9px] uppercase border-b border-white/10">
                        <th className="p-2.5">Asset</th>
                        <th className="p-2.5">Action</th>
                        <th className="p-2.5 text-right">Entry</th>
                        <th className="p-2.5 text-right">Exit</th>
                        <th className="p-2.5 text-right">Closed PnL</th>
                        <th className="p-2.5 text-right font-mono">Trigger</th>
                        <th className="p-2.5 text-center">Entry / Exit Hours</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {result.trades.map((t, idx) => {
                        const isWin = t.pnl >= 0;
                        return (
                          <tr key={idx} className="hover:bg-white/5 transition-colors font-mono text-xs">
                            <td className="p-2.5 font-bold text-white">
                              {t.assetId}
                            </td>
                            <td className="p-2.5">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                t.type === "BUY" ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                              }`}>
                                {t.type}
                              </span>
                            </td>
                            <td className="p-2.5 text-right text-slate-300">
                              ${t.entryPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-2.5 text-right text-slate-300">
                              ${t.exitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className={`p-2.5 text-right font-bold ${isWin ? "text-emerald-400" : "text-rose-400"}`}>
                              {isWin ? "+" : ""}${t.pnl.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              <span className="text-[9px] font-normal block">({isWin ? "+" : ""}{t.pnlPercent.toFixed(2)}%)</span>
                            </td>
                            <td className="p-2.5 text-right">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                t.exitReason === "TP" ? "bg-emerald-500/10 text-emerald-400" : t.exitReason === "SL" ? "bg-rose-500/10 text-rose-400" : "bg-[#12151A] text-slate-400 border border-white/10"
                              }`}>
                                {t.exitReason}
                              </span>
                            </td>
                            <td className="p-2.5 text-center text-[10px] text-slate-500">
                              <div className="truncate max-w-[150px]" title={`Entry: ${new Date(t.entryTime).toLocaleString()}\nExit: ${new Date(t.exitTime).toLocaleString()}`}>
                                In: {new Date(t.entryTime).toLocaleDateString()} to {new Date(t.exitTime).toLocaleDateString()}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-[#1A1D23] border border-white/5 rounded-xl p-8 flex flex-col items-center justify-center text-center h-[520px]">
              <Compass className="w-12 h-12 text-slate-700 mb-4 animate-pulse" />
              <h4 className="font-display font-semibold text-slate-400">Backtest Idle</h4>
              <p className="text-slate-500 text-xs mt-2 max-w-xs leading-5">
                Select a high-volatility financial asset (such as Gold XAU/USD, Silver, or BTC), pick your trading indicator strategy, customize risk levels, and click "Run Historical Backtest".
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
