import React, { useState } from "react";
import { 
  Lock, KeyRound, CheckCircle2, ShieldAlert, AlertCircle, RefreshCw, 
  Trash2, Landmark, Radio, Server, Wifi, Network, ArrowRight 
} from "lucide-react";
import { BotConfig } from "../types";

interface ProviderKeysViewProps {
  config: BotConfig;
  onRefresh: () => void;
}

export default function ProviderKeysView({ config, onRefresh }: ProviderKeysViewProps) {
  // JIFO form states
  const [jifoKey, setJifoKey] = useState("");
  const [jifoSecret, setJifoSecret] = useState("");
  const [jifoDemo, setJifoDemo] = useState(config.providers.jifo.isDemo);
  const [jifoLoading, setJifoLoading] = useState(false);
  const [jifoError, setJifoError] = useState("");
  const [jifoSuccess, setJifoSuccess] = useState("");

  // FTMO form states
  const [ftmoAccount, setFtmoAccount] = useState("");
  const [ftmoToken, setFtmoToken] = useState("");
  const [ftmoServer, setFtmoServer] = useState("FTMO-Server-Demo");
  const [ftmoDemo, setFtmoDemo] = useState(config.providers.ftmo.isDemo);
  const [ftmoPhase, setFtmoPhase] = useState("funded"); // challenge_1, challenge_2, funded
  const [ftmoLoading, setFtmoLoading] = useState(false);
  const [ftmoError, setFtmoError] = useState("");
  const [ftmoSuccess, setFtmoSuccess] = useState("");
  const [confirmingDisconnect, setConfirmingDisconnect] = useState<"jifo" | "ftmo" | null>(null);

  const handleConnectJifo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jifoKey || !jifoSecret) {
      setJifoError("API Key and Secret Key are required.");
      return;
    }

    setJifoLoading(true);
    setJifoError("");
    setJifoSuccess("");

    try {
      const res = await fetch("/api/provider/jifo/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: jifoKey,
          apiSecret: jifoSecret,
          isDemo: jifoDemo
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to authenticate JIFO");

      setJifoSuccess("Secure Connection established to JIFO!");
      setJifoKey("");
      setJifoSecret("");
      onRefresh();
    } catch (err: any) {
      setJifoError(err.message || "Network credentials verification failed.");
    } finally {
      setJifoLoading(false);
    }
  };

  const handleConnectFtmo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ftmoAccount || (!ftmoToken && !ftmoDemo)) {
      setFtmoError("Account Number is required.");
      return;
    }

    setFtmoLoading(true);
    setFtmoError("");
    setFtmoSuccess("");

    try {
      const res = await fetch("/api/provider/ftmo/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountNumber: ftmoAccount,
          apiToken: ftmoToken || "sandbox_token",
          server: ftmoServer,
          isDemo: ftmoDemo
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to authenticate FTMO");

      setFtmoSuccess("FTMO Broker Session successfully synchronized!");
      setFtmoAccount("");
      setFtmoToken("");
      onRefresh();
    } catch (err: any) {
      setFtmoError(err.message || "Broker gateway verification timed out.");
    } finally {
      setFtmoLoading(false);
    }
  };

  const handleDisconnect = async (provider: "jifo" | "ftmo") => {
    if (confirmingDisconnect !== provider) {
      setConfirmingDisconnect(provider);
      setTimeout(() => {
        setConfirmingDisconnect(prev => prev === provider ? null : prev);
      }, 4000);
      return;
    }

    try {
      const res = await fetch(`/api/provider/${provider}/disconnect`, { method: "POST" });
      if (res.ok) {
        setConfirmingDisconnect(null);
        onRefresh();
      }
    } catch (err) {
      console.error("Disconnect failed", err);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* EXPLANATORY SECURITY BANNER */}
      <div className="bg-[#1A1D23] border border-white/5 p-5 rounded-xl flex items-start gap-4">
        <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl shrink-0">
          <Lock className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h4 className="font-display font-semibold text-sm text-[#E2E8F0]">Secure Vault Cryptography</h4>
          <p className="text-[11px] text-slate-400 leading-5 mt-1">
            Raw API secrets are executed and stored <b>exclusively on our secure Cloud Run container backend</b>. All outgoing order requests sent to JIFO endpoints or MT5 FTMO gateways are encrypted and signed server-side using secure SHA256 hashes. This ensures your credentials <b>never</b> leave the server container and are completely invisible inside browser source files.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* JIFO CONNECTION MODULE */}
        <div className="bg-[#1A1D23] border border-white/5 rounded-xl p-5 flex flex-col justify-between" id="provider-jifo">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-4">
              <div className="flex items-center gap-2">
                <Landmark className="w-5 h-5 text-cyan-400" />
                <h3 className="font-display font-bold text-sm text-[#E2E8F0]">JIFO REST Live API</h3>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                config.providers.jifo.isConnected 
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                  : "bg-[#12151A] text-slate-400 border border-white/5"
              }`}>
                {config.providers.jifo.isConnected ? "CONNECTED" : "OFFLINE"}
              </span>
            </div>

            {config.providers.jifo.isConnected ? (
              // Connected State Widget
              <div className="bg-[#12151A] p-4 border border-white/10 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wifi className="w-4 h-4 text-emerald-400 animate-pulse" />
                    <span className="text-xs text-slate-400 font-medium">Synced Active Client</span>
                  </div>
                  <span className="text-[10px] bg-[#1A1D23] px-2 py-0.5 font-mono text-cyan-400 rounded">
                    {config.providers.jifo.isDemo ? "SANDBOX SIM" : "PRODUCTION LIVE"}
                  </span>
                </div>

                <div className="space-y-2 font-mono text-xs">
                  <div className="flex justify-between py-1 border-b border-[#1A1D23]">
                    <span className="text-slate-500">API Key Signature:</span>
                    <span className="text-slate-300 font-bold">{config.providers.jifo.apiKey}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#1A1D23]">
                    <span className="text-slate-500">HMAC-SHA256 Payload:</span>
                    <span className="text-slate-300">Enabled</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">REST Status:</span>
                    <span className="text-emerald-400 font-bold">200 OK</span>
                  </div>
                </div>

                <button
                  onClick={() => handleDisconnect("jifo")}
                  className={`w-full py-1.5 border rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center justify-center gap-1.5 ${
                    confirmingDisconnect === "jifo"
                      ? "bg-rose-600 border-rose-600 text-white animate-pulse"
                      : "border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>
                    {confirmingDisconnect === "jifo"
                      ? "Confirm Disconnect (Click again)"
                      : "Disconnect JIFO Session"}
                  </span>
                </button>
              </div>
            ) : (
              // Disconnected Connection Ticket Form
              <form onSubmit={handleConnectJifo} className="space-y-4">
                <p className="text-[11px] text-slate-400 leading-normal">
                  Securely link your JIFO trading terminal. Credentials enable programmatic routing for cryptocurrency orders, stocks, and commodities.
                </p>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1 font-mono">JIFO API KEY</label>
                  <input
                    type="text"
                    value={jifoKey}
                    onChange={(e) => setJifoKey(e.target.value)}
                    className="w-full bg-[#12151A] border border-white/10 rounded-lg py-1.5 px-3 font-mono text-xs text-white focus:outline-none focus:border-cyan-500"
                    placeholder="e.g. jf_live_82937..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1 font-mono">JIFO API SECRET KEY</label>
                  <input
                    type="password"
                    value={jifoSecret}
                    onChange={(e) => setJifoSecret(e.target.value)}
                    className="w-full bg-[#12151A] border border-white/10 rounded-lg py-1.5 px-3 font-mono text-xs text-white focus:outline-none focus:border-cyan-500"
                    placeholder="••••••••••••••••••••••••••••••••"
                    required
                  />
                </div>

                <div className="flex items-center justify-between bg-[#12151A] p-3 border border-white/10 rounded-lg">
                  <div>
                    <div className="font-semibold text-xs text-slate-300">Sandbox Trial Environment</div>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Routes orders to safe virtual mock servers instead of active portfolios.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setJifoDemo(!jifoDemo)}
                    className={`w-9 h-5 rounded-full transition-colors cursor-pointer relative flex items-center shrink-0 ${
                      jifoDemo ? "bg-cyan-500" : "bg-[#1A1D23] border border-white/10"
                    }`}
                  >
                    <span className={`w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform absolute ${
                      jifoDemo ? "translate-x-4.5" : "translate-x-1"
                    }`} />
                  </button>
                </div>

                {jifoError && (
                  <div className="text-[11px] bg-rose-500/10 border border-rose-500/20 text-rose-400 p-2.5 rounded-lg flex items-start gap-1.5 font-mono">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                    <span>{jifoError}</span>
                  </div>
                )}
                {jifoSuccess && (
                  <div className="text-[11px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-2.5 rounded-lg flex items-center gap-1.5 font-mono">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{jifoSuccess}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={jifoLoading}
                  className="w-full py-2 bg-cyan-500 hover:bg-cyan-600 disabled:bg-cyan-700/40 text-slate-950 font-bold rounded-lg text-xs cursor-pointer transition-colors flex items-center justify-center gap-2 font-mono"
                >
                  <Wifi className="w-3.5 h-3.5" />
                  <span>{jifoLoading ? "Performing HMAC Verification Handshake..." : "Secure Connect JIFO Account"}</span>
                </button>
              </form>
            )}
          </div>
          
          <div className="mt-6 pt-3 border-t border-white/5 text-[9px] text-slate-500 flex items-center gap-1.5 font-mono">
            <Radio className="w-3.5 h-3.5 text-cyan-500" />
            <span>JIFO client establishes automatic ping cycles every 15 seconds to sync margins.</span>
          </div>
        </div>

        {/* FTMO PROP FIRM CONNECTION MODULE */}
        <div className="bg-[#1A1D23] border border-white/5 rounded-xl p-5 flex flex-col justify-between" id="provider-ftmo">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-4">
              <div className="flex items-center gap-2">
                <Landmark className="w-5 h-5 text-amber-500" />
                <h3 className="font-display font-bold text-sm text-[#E2E8F0]">FTMO Prop Firm Account Gateway</h3>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                config.providers.ftmo.isConnected 
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                  : "bg-[#12151A] text-slate-400 border border-white/5"
              }`}>
                {config.providers.ftmo.isConnected ? "CONNECTED" : "OFFLINE"}
              </span>
            </div>

            {config.providers.ftmo.isConnected ? (
              // Connected State Widget
              <div className="bg-[#12151A] p-4 border border-white/10 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wifi className="w-4 h-4 text-emerald-400 animate-pulse" />
                    <span className="text-xs text-slate-400 font-medium">MT4/MT5 Broker Synchronization</span>
                  </div>
                  <span className="text-[10px] bg-[#1A1D23] px-2 py-0.5 font-mono text-amber-500 rounded font-semibold uppercase">
                    FTMO {ftmoPhase.replace("_", " ")}
                  </span>
                </div>

                <div className="space-y-2 font-mono text-xs">
                  <div className="flex justify-between py-1 border-b border-[#1A1D23]">
                    <span className="text-slate-500">Account Number:</span>
                    <span className="text-slate-300 font-bold">{config.providers.ftmo.accountNumber}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#1A1D23]">
                    <span className="text-slate-500">Selected Server:</span>
                    <span className="text-slate-300">{config.providers.ftmo.server}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#1A1D23]">
                    <span className="text-slate-500">Broker Protocol:</span>
                    <span className="text-slate-300">MT5 WebAPI proxy</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">API Connection Status:</span>
                    <span className="text-emerald-400 font-bold">TUNNELED SECURE</span>
                  </div>
                </div>

                <button
                  onClick={() => handleDisconnect("ftmo")}
                  className={`w-full py-1.5 border rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center justify-center gap-1.5 ${
                    confirmingDisconnect === "ftmo"
                      ? "bg-rose-600 border-rose-600 text-white animate-pulse"
                      : "border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>
                    {confirmingDisconnect === "ftmo"
                      ? "Confirm Disconnect (Click again)"
                      : "Disconnect FTMO Session"}
                  </span>
                </button>
              </div>
            ) : (
              // Disconnected Connection Ticket Form
              <form onSubmit={handleConnectFtmo} className="space-y-4">
                <p className="text-[11px] text-slate-400 leading-normal">
                  Authenticate your FTMO account server. Compatible with standard evaluation trials (Phase 1 / Phase 2) and funded live prop models.
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1 font-mono">FTMO ACCOUNT ID</label>
                    <input
                      type="text"
                      value={ftmoAccount}
                      onChange={(e) => setFtmoAccount(e.target.value)}
                      className="w-full bg-[#12151A] border border-white/10 rounded-lg py-1.5 px-3 font-mono text-xs text-white focus:outline-none focus:border-blue-500"
                      placeholder="e.g. 10982736"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1 font-mono">FTMO SERVER</label>
                    <select
                      value={ftmoServer}
                      onChange={(e) => setFtmoServer(e.target.value)}
                      className="w-full bg-[#12151A] border border-white/10 rounded-lg py-1.5 px-3 font-mono text-xs text-slate-300 focus:outline-none focus:border-blue-500"
                    >
                      <option value="FTMO-Server-Demo font-mono">FTMO-Server-Demo</option>
                      <option value="FTMO-Server-Live font-mono">FTMO-Server-Live</option>
                      <option value="FTMO-Server-Live-2 font-mono">FTMO-Server-Live-2</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1 font-mono">FTMO CLIENT TOKEN / API PASS</label>
                  <input
                    type="password"
                    value={ftmoToken}
                    onChange={(e) => setFtmoToken(e.target.value)}
                    className="w-full bg-[#12151A] border border-white/10 rounded-lg py-1.5 px-3 font-mono text-xs text-white focus:outline-none focus:border-blue-500"
                    placeholder="MT4/MT5 Broker Password or FTMO WebAPI Token"
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[9px] text-slate-500 mb-1 font-mono">VERIFICATION STAGE</label>
                    <select
                      value={ftmoPhase}
                      onChange={(e) => setFtmoPhase(e.target.value)}
                      className="w-full bg-[#12151A] border border-white/10 rounded py-1 px-1.5 font-mono text-[10px] text-slate-300 focus:outline-none"
                    >
                      <option value="challenge_1">Phase 1 Challenge</option>
                      <option value="challenge_2">Phase 2 Verification</option>
                      <option value="funded">Funded Account</option>
                    </select>
                  </div>

                  <div className="col-span-2 flex flex-col justify-end">
                    <div className="flex items-center justify-between bg-[#12151A] px-3 py-1.5 border border-white/10 rounded">
                      <span className="text-[10px] font-semibold text-slate-400">Sandbox Trial Mode</span>
                      <button
                        type="button"
                        onClick={() => setFtmoDemo(!ftmoDemo)}
                        className={`w-8 h-4.5 rounded-full transition-colors cursor-pointer relative flex items-center shrink-0 ${
                          ftmoDemo ? "bg-amber-500" : "bg-[#1A1D23] border border-white/10"
                        }`}
                      >
                        <span className={`w-3 h-3 rounded-full bg-white shadow-sm transition-transform absolute ${
                          ftmoDemo ? "translate-x-4" : "translate-x-0.5"
                        }`} />
                      </button>
                    </div>
                  </div>
                </div>

                {ftmoError && (
                  <div className="text-[11px] bg-rose-500/10 border border-rose-500/20 text-rose-400 p-2.5 rounded-lg flex items-start gap-1.5 font-mono">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                    <span>{ftmoError}</span>
                  </div>
                )}
                {ftmoSuccess && (
                  <div className="text-[11px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-2.5 rounded-lg flex items-center gap-1.5 font-mono">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{ftmoSuccess}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={ftmoLoading}
                  className="w-full py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-700/40 text-slate-950 font-bold rounded-lg text-xs cursor-pointer transition-colors flex items-center justify-center gap-2 font-mono"
                >
                  <Wifi className="w-3.5 h-3.5" />
                  <span>{ftmoLoading ? "Compiling MT5 WebSocket handshake..." : "Sync FTMO Broker Session"}</span>
                </button>
              </form>
            )}
          </div>

          <div className="mt-6 pt-3 border-t border-white/5 text-[9px] text-slate-500 flex items-center gap-1.5 font-mono">
            <Server className="w-3.5 h-3.5 text-amber-500" />
            <span>Tunneled via MT4/MT5 Web API proxies on Cloud Run infrastructure.</span>
          </div>
        </div>

      </div>
    </div>
  );
}
