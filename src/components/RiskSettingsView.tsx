import React, { useState } from "react";
import { 
  ShieldCheck, AlertTriangle, ShieldAlert, CheckCircle2, 
  HelpCircle, Settings, Award, Scale, HelpCircle as HelpIcon, Sparkles
} from "lucide-react";
import { BotConfig } from "../types";

interface RiskSettingsViewProps {
  config: BotConfig;
  onUpdateConfig: (updated: Partial<BotConfig>) => void;
}

export default function RiskSettingsView({ config, onUpdateConfig }: RiskSettingsViewProps) {
  const [maxDailyDrawdownPercent, setMaxDailyDrawdownPercent] = useState(config.risk.maxDailyDrawdownPercent.toString());
  const [dailyLossLimitUSD, setDailyLossLimitUSD] = useState(config.risk.dailyLossLimitUSD.toString());
  const [weeklyLossLimitUSD, setWeeklyLossLimitUSD] = useState((config.risk.weeklyLossLimitUSD || 15000).toString());
  const [positionSizingBase, setPositionSizingBase] = useState<"balance" | "equity">(config.risk.positionSizingBase || "balance");
  const [stopLossPercent, setStopLossPercent] = useState(config.risk.stopLossPercent.toString());
  const [takeProfitPercent, setTakeProfitPercent] = useState(config.risk.takeProfitPercent.toString());
  const [positionSizePercent, setPositionSizePercent] = useState(config.risk.positionSizePercent.toString());
  const [maxConcurrentTrades, setMaxConcurrentTrades] = useState(config.risk.maxConcurrentTrades.toString());
  const [trailingStop, setTrailingStop] = useState(config.risk.trailingStop);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleSaveRisk = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage("");

    const updatedRisk = {
      risk: {
        maxDailyDrawdownPercent: parseFloat(maxDailyDrawdownPercent),
        dailyLossLimitUSD: parseFloat(dailyLossLimitUSD),
        weeklyLossLimitUSD: parseFloat(weeklyLossLimitUSD),
        positionSizingBase,
        stopLossPercent: parseFloat(stopLossPercent),
        takeProfitPercent: parseFloat(takeProfitPercent),
        positionSizePercent: parseFloat(positionSizePercent),
        maxConcurrentTrades: parseInt(maxConcurrentTrades),
        trailingStop
      }
    };

    try {
      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedRisk)
      });
      if (res.ok) {
        onUpdateConfig(updatedRisk);
        setSuccessMessage("Risk management parameters committed and updated on Cloud Server.");
        setTimeout(() => setSuccessMessage(""), 4000);
      }
    } catch (err) {
      console.error("Save risk failed", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Preset configuration helpers
  const applyPreset = (type: "ftmo_standard" | "conservative" | "aggressive") => {
    if (type === "ftmo_standard") {
      setMaxDailyDrawdownPercent("4.5"); // safe buffer below FTMO 5%
      setDailyLossLimitUSD("4500");
      setWeeklyLossLimitUSD("9000"); // safe buffer below FTMO 10% ($10,000)
      setPositionSizingBase("equity"); // Floating equity position sizing
      setStopLossPercent("1.2");
      setTakeProfitPercent("3.6"); // 1:3 Risk Reward Ratio
      setPositionSizePercent("1.5");
      setMaxConcurrentTrades("4");
      setTrailingStop(true);
    } else if (type === "conservative") {
      setMaxDailyDrawdownPercent("2.0");
      setDailyLossLimitUSD("2000");
      setWeeklyLossLimitUSD("5000");
      setPositionSizingBase("balance");
      setStopLossPercent("0.8");
      setTakeProfitPercent("2.4");
      setPositionSizePercent("0.5");
      setMaxConcurrentTrades("3");
      setTrailingStop(true);
    } else if (type === "aggressive") {
      setMaxDailyDrawdownPercent("8.0");
      setDailyLossLimitUSD("8000");
      setWeeklyLossLimitUSD("15000");
      setPositionSizingBase("balance");
      setStopLossPercent("2.5");
      setTakeProfitPercent("5.0");
      setPositionSizePercent("3.0");
      setMaxConcurrentTrades("8");
      setTrailingStop(false);
    }
  };

  // Real-time compliance checking
  const maxDrawdownNum = parseFloat(maxDailyDrawdownPercent) || 0;
  const isFtmoDailyBreached = maxDrawdownNum > 5.0;
  const isLossLimitBreached = (parseFloat(dailyLossLimitUSD) || 0) > 5000;
  const isWeeklyLossLimitBreached = (parseFloat(weeklyLossLimitUSD) || 0) > 10000;
  const maxExposurePct = (parseFloat(positionSizePercent) || 0) * (parseInt(maxConcurrentTrades) || 0);
  const isOverExposed = maxExposurePct > 10.0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* COLUMN 1 & 2: INPUT CONFIGURATION FORM */}
      <div className="lg:col-span-2 bg-[#1A1D23] border border-white/5 rounded-xl p-5">
        <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-5">
          <h3 className="font-display font-semibold text-sm text-[#E2E8F0] flex items-center gap-2">
            <Settings className="w-4 h-4 text-blue-400" />
            <span>Risk Management Parameters</span>
          </h3>
          <span className="text-[10px] bg-[#12151A] px-2 py-0.5 border border-white/10 text-blue-400 font-mono rounded">
            Server-Authoritative Shield Active
          </span>
        </div>

        {/* QUICK PRESETS SELECTION ROW */}
        <div className="mb-6">
          <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2 font-mono">APPLY STRATEGY PRESETS</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => applyPreset("ftmo_standard")}
              className="py-2 px-3 bg-[#12151A] border border-amber-500/20 hover:border-amber-500/40 text-amber-400 hover:bg-white/5 rounded-lg text-xs font-semibold cursor-pointer transition-colors text-center flex flex-col items-center justify-center font-mono"
            >
              <Award className="w-4 h-4 mb-1" />
              <span>FTMO Standard</span>
              <span className="text-[9px] text-slate-500 font-normal">Passed Challenge Buffer</span>
            </button>
            <button
              onClick={() => applyPreset("conservative")}
              className="py-2 px-3 bg-[#12151A] border border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400 hover:bg-white/5 rounded-lg text-xs font-semibold cursor-pointer transition-colors text-center flex flex-col items-center justify-center font-mono"
            >
              <ShieldCheck className="w-4 h-4 mb-1" />
              <span>Conservative Shield</span>
              <span className="text-[9px] text-slate-500 font-normal">Strict Capital Protection</span>
            </button>
            <button
              onClick={() => applyPreset("aggressive")}
              className="py-2 px-3 bg-[#12151A] border border-rose-500/20 hover:border-rose-500/40 text-rose-400 hover:bg-white/5 rounded-lg text-xs font-semibold cursor-pointer transition-colors text-center flex flex-col items-center justify-center font-mono"
            >
              <AlertTriangle className="w-4 h-4 mb-1" />
              <span>Aggressive Growth</span>
              <span className="text-[9px] text-slate-500 font-normal">High Volatility Targets</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSaveRisk} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Drawdown limit */}
            <div className="bg-[#12151A] p-4 border border-white/10 rounded-xl space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-[11px] font-bold text-slate-300 font-mono">MAX DAILY DRAWDOWN (%)</label>
                {isFtmoDailyBreached ? (
                  <span className="px-1.5 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded text-[9px] font-mono font-bold flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" /> FTMO VIOLATION
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded text-[9px] font-mono font-bold">
                    COMPLIANT
                  </span>
                )}
              </div>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="50"
                value={maxDailyDrawdownPercent}
                onChange={(e) => setMaxDailyDrawdownPercent(e.target.value)}
                className="w-full bg-[#1A1D23] border border-white/5 rounded-lg py-1.5 px-3 font-mono text-xs text-white focus:outline-none focus:border-blue-500"
                required
              />
              <span className="text-[10px] text-slate-500 block">Emergency halts if active equity falls below this daily % from starting benchmark.</span>
            </div>

            {/* Daily loss USD */}
            <div className="bg-[#12151A] p-4 border border-white/10 rounded-xl space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-[11px] font-bold text-slate-300 font-mono">DAILY LOSS LIMIT (USD $)</label>
                {isLossLimitBreached ? (
                  <span className="px-1.5 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded text-[9px] font-mono font-bold flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" /> BUFFER EXCEEDED
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded text-[9px] font-mono font-bold">
                    SECURE BUFFER
                  </span>
                )}
              </div>
              <input
                type="number"
                step="10"
                min="100"
                value={dailyLossLimitUSD}
                onChange={(e) => setDailyLossLimitUSD(e.target.value)}
                className="w-full bg-[#1A1D23] border border-white/5 rounded-lg py-1.5 px-3 font-mono text-xs text-white focus:outline-none focus:border-blue-500"
                required
              />
              <span className="text-[10px] text-slate-500 block">Deactivates automated modules if total closed loss exceeds this USD valuation in a single trading day.</span>
            </div>

            {/* Weekly loss USD */}
            <div className="bg-[#12151A] p-4 border border-white/10 rounded-xl space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-[11px] font-bold text-slate-300 font-mono">WEEKLY LOSS LIMIT (USD $)</label>
                {isWeeklyLossLimitBreached ? (
                  <span className="px-1.5 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded text-[9px] font-mono font-bold flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" /> PROP RISK LIMIT REACHED
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded text-[9px] font-mono font-bold">
                    COMPLIANT BUFFER
                  </span>
                )}
              </div>
              <input
                type="number"
                step="50"
                min="200"
                value={weeklyLossLimitUSD}
                onChange={(e) => setWeeklyLossLimitUSD(e.target.value)}
                className="w-full bg-[#1A1D23] border border-white/5 rounded-lg py-1.5 px-3 font-mono text-xs text-white focus:outline-none focus:border-blue-500"
                required
              />
              <span className="text-[10px] text-slate-500 block">Halts all trading and closes active positions if total accumulated loss in the current weekly cycle exceeds this limit.</span>
            </div>

            {/* Position Sizing Base */}
            <div className="bg-[#12151A] p-4 border border-white/10 rounded-xl space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-300 font-mono">POSITION SIZING BASE</label>
              <select
                value={positionSizingBase}
                onChange={(e) => setPositionSizingBase(e.target.value as any)}
                className="w-full bg-[#1A1D23] border border-white/5 rounded-lg py-1.5 px-3 font-mono text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="balance">Closed Account Balance (Standard)</option>
                <option value="equity">Floating Account Equity (Advanced Risk-Adjusted)</option>
              </select>
              <span className="text-[10px] text-slate-500 block">Calculates leverage size based on closed cash balance or live floating net asset equity (FTMO/Prop Recommended).</span>
            </div>

            {/* Default stop loss */}
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1 font-mono">DEFAULT TRADE STOP LOSS (%)</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="30"
                value={stopLossPercent}
                onChange={(e) => setStopLossPercent(e.target.value)}
                className="w-full bg-[#12151A] border border-white/10 rounded-lg py-1.5 px-3 font-mono text-xs text-white focus:outline-none focus:border-blue-500"
                required
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Automatic initial SL percentage embedded into opened contracts.</span>
            </div>

            {/* Default take profit */}
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1 font-mono">DEFAULT TRADE TAKE PROFIT (%)</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="100"
                value={takeProfitPercent}
                onChange={(e) => setTakeProfitPercent(e.target.value)}
                className="w-full bg-[#12151A] border border-white/10 rounded-lg py-1.5 px-3 font-mono text-xs text-white focus:outline-none focus:border-blue-500"
                required
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Initial target TP percentage assigned to opened positions.</span>
            </div>

            {/* Position Size */}
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1 font-mono">MAX POSITION CAPITAL RISK (%)</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="100"
                value={positionSizePercent}
                onChange={(e) => setPositionSizePercent(e.target.value)}
                className="w-full bg-[#12151A] border border-white/10 rounded-lg py-1.5 px-3 font-mono text-xs text-white focus:outline-none focus:border-blue-500"
                required
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Maximum proportion of total balance allocated to risk margin per trade.</span>
            </div>

            {/* Concurrent Trades */}
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1 font-mono">MAX CONCURRENT ACTIVE POSITIONS</label>
              <input
                type="number"
                step="1"
                min="1"
                max="20"
                value={maxConcurrentTrades}
                onChange={(e) => setMaxConcurrentTrades(e.target.value)}
                className="w-full bg-[#12151A] border border-white/10 rounded-lg py-1.5 px-3 font-mono text-xs text-white focus:outline-none focus:border-blue-500"
                required
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Limit active concurrent open trades to avoid margin call exposure.</span>
            </div>

          </div>

          {/* TRAILING STOP-LOSS BAR */}
          <div className="bg-[#12151A] p-4 border border-white/10 rounded-xl flex items-center justify-between">
            <div>
              <div className="font-semibold text-xs text-slate-200">TRAILING STOP-LOSS PROTOCOL</div>
              <p className="text-[10px] text-slate-500 max-w-lg mt-0.5">
                Automatically adjusts the Stop Loss level upwards (for BUYS) or downwards (for SELLS) once the active trade moves into profitability by over 1.0%, locking in secured yield.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setTrailingStop(!trailingStop)}
              className={`w-11 h-6 rounded-full transition-colors cursor-pointer relative flex items-center shrink-0 ${
                trailingStop ? "bg-blue-600" : "bg-[#12151A] border border-white/10"
              }`}
            >
              <span className={`w-4 h-4 rounded-full bg-white shadow-sm transition-all absolute ${
                trailingStop ? "translate-x-6" : "translate-x-1"
              }`} />
            </button>
          </div>

          {successMessage && (
            <div className="text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-lg flex items-center gap-2 font-mono">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800/40 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-lg shadow-blue-600/10 flex items-center justify-center gap-2"
          >
            {isSubmitting ? "Updating Cloud Gateways..." : "Save Risk Configurations"}
          </button>
        </form>
      </div>

      {/* PROP-FIRM RISK EVALUATOR PANEL */}
      <div className="bg-[#1A1D23] border border-white/5 rounded-xl p-5 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-amber-400 border-b border-white/5 pb-3">
            <Scale className="w-5 h-5 text-amber-500" />
            <h3 className="font-display font-semibold text-sm text-[#E2E8F0]">Prop-Firm Rules Evaluator</h3>
          </div>

          <p className="text-[11px] text-slate-400 leading-5">
            Proprietary evaluation firms like <b>FTMO</b> impose rigid rules to protect asset allocation capital. This automated evaluator scans your current active risk parameters and computes compliance status.
          </p>

          <div className="space-y-3 pt-2">
            {/* Rule 1 */}
            <div className="bg-[#12151A] p-3 rounded-lg border border-white/10 flex items-start gap-3">
              <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${isFtmoDailyBreached ? "bg-rose-500" : "bg-emerald-400"}`} />
              <div>
                <div className="text-[11px] font-bold text-slate-300 font-mono">Daily Drawdown Boundary (FTMO &lt; 5%)</div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Your current Max Drawdown is set to <b className="text-slate-300 font-mono">{maxDrawdownNum}%</b>.
                </div>
                {isFtmoDailyBreached ? (
                  <p className="text-[9px] text-rose-400 mt-1">⚠️ <b>Violation!</b> Setting drawdown at {maxDrawdownNum}% breaches the 5% hard limit in standard challenges, resulting in instant account failure.</p>
                ) : (
                  <p className="text-[9px] text-emerald-400 mt-1">✓ <b>Compliant.</b> Incorporates safe margin protection buffers.</p>
                )}
              </div>
            </div>

            {/* Rule 2 */}
            <div className="bg-[#12151A] p-3 rounded-lg border border-white/10 flex items-start gap-3">
              <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${isOverExposed ? "bg-amber-500" : "bg-emerald-400"}`} />
              <div>
                <div className="text-[11px] font-bold text-slate-300 font-mono">Total Capital Leverage Exposure</div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Total maximum simultaneous portfolio margin is <b className="text-slate-300 font-mono">{maxExposurePct}%</b>.
                </div>
                {isOverExposed ? (
                  <p className="text-[9px] text-amber-400 mt-1">⚠️ <b>Warning: Over-Leveraged.</b> Having {maxExposurePct}% total exposure can lead to instant margin calls under high-volatility silver/gold spreads.</p>
                ) : (
                  <p className="text-[9px] text-emerald-400 mt-1">✓ <b>Safe.</b> Leverage bounds provide stable risk-adjusted growth.</p>
                )}
              </div>
            </div>

            {/* Rule 3 */}
            <div className="bg-[#12151A] p-3 rounded-lg border border-white/10 flex items-start gap-3">
              <span className="w-2 h-2 rounded-full mt-1.5 shrink-0 bg-blue-400" />
              <div>
                <div className="text-[11px] font-bold text-slate-300 font-mono">Consistency & News Protection</div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Trailing Stop-Loss is {trailingStop ? <b className="text-emerald-400 uppercase font-mono">ENABLED</b> : <b className="text-rose-400 uppercase font-mono">DISABLED</b>}.
                </div>
                {trailingStop ? (
                  <p className="text-[9px] text-emerald-400 mt-1">✓ Trailing Stop secures floating profit, preventing slip-down failures during top news announcements.</p>
                ) : (
                  <p className="text-[9px] text-slate-500 mt-1">ℹ Enable Trailing Stops to lock-in trades during high volatility spikes.</p>
                )}
              </div>
            </div>

            {/* Rule 4 */}
            <div className="bg-[#12151A] p-3 rounded-lg border border-white/10 flex items-start gap-3">
              <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${isWeeklyLossLimitBreached ? "bg-rose-500" : "bg-emerald-400"}`} />
              <div>
                <div className="text-[11px] font-bold text-slate-300 font-mono">Weekly Drawdown Boundary (FTMO &lt; 10%)</div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Weekly Max Loss Limit set to <b className="text-slate-300 font-mono">${parseFloat(weeklyLossLimitUSD).toLocaleString()} USD</b>.
                </div>
                {isWeeklyLossLimitBreached ? (
                  <p className="text-[9px] text-rose-400 mt-1">⚠️ <b>Violation Risk!</b> Setting weekly loss bounds above $10,000 for a $100K prop account risks breaches during volatile gold breakouts.</p>
                ) : (
                  <p className="text-[9px] text-emerald-400 mt-1">✓ <b>Compliant.</b> Properly configured within FTMO max weekly limit threshold ($10,000 USD).</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* GUIDELINE BADGE */}
        <div className="mt-4 bg-[#12151A] p-3 border border-white/10 rounded-lg flex items-center gap-3">
          <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
          <div className="text-left text-[9px] text-slate-400 leading-normal">
            <b>Pro Recommendation:</b> Leverage a standard <b>1:3 Risk/Reward Ratio</b> (e.g. SL at 1.2% and TP at 3.6%) to optimize win ratios under EMA crossovers.
          </div>
        </div>

      </div>
    </div>
  );
}
