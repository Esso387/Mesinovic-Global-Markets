import React, { useState } from 'react';
import { SmartMoneyAlertItem, MarketAsset } from '../types/market.ts';
import { SMART_MONEY_ALERTS } from '../data/mockSmartMoneyData.ts';
import {
  AlertTriangle,
  Landmark,
  Cpu,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  X,
  Volume2,
  VolumeX,
  BarChart2,
  Target,
  Users,
  Info,
  Clock,
  Flame,
} from 'lucide-react';

interface SmartMoneyAlertBannerProps {
  onSelectAsset?: (symbol: string) => void;
  onOpenAudit?: (symbol: string) => void;
  onNavigateToSmartMoney?: () => void;
  onOpenAlertModal?: (symbol: string, price: number) => void;
  assets?: MarketAsset[];
}

export const SmartMoneyAlertBanner: React.FC<SmartMoneyAlertBannerProps> = ({
  onSelectAsset,
  onOpenAudit,
  onNavigateToSmartMoney,
  onOpenAlertModal,
  assets = [],
}) => {
  const [alerts] = useState<SmartMoneyAlertItem[]>(SMART_MONEY_ALERTS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const activeAlert = alerts[currentIndex] || alerts[0];
  const nvdaAsset = assets.find((a) => a.symbol === activeAlert.symbol);
  const currentPrice = nvdaAsset ? nvdaAsset.price : 135.2;

  const playChime = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1320, audioCtx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.25);
    } catch {
      // AudioContext may be restricted before user gesture
    }
  };

  if (isDismissed) {
    return (
      <div className="bg-[#0b0f19]/90 border-b border-rose-900/40 px-4 py-1.5 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
          </span>
          <span className="text-rose-400 font-bold">1 ACTIVE SMART MONEY ALERT:</span>
          <span className="text-slate-300 font-bold truncate">
            {activeAlert.headline} ({activeAlert.amount})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setIsDismissed(false);
              playChime();
            }}
            className="px-2 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white transition cursor-pointer text-[11px] font-bold"
          >
            Show Alert
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-slate-950 via-[#130d1f] to-[#090d19] border-b border-rose-500/30 shadow-2xl relative z-20">
      {/* Glow accent line */}
      <div className="h-0.5 w-full bg-gradient-to-r from-rose-500 via-amber-500 to-cyan-500 animate-pulse" />

      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Main Alert Identity */}
          <div className="flex items-start gap-3.5">
            {/* Flashing Icon Badge */}
            <div className="relative shrink-0 mt-0.5">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/50 flex items-center justify-center text-rose-400 shadow-lg shadow-rose-950/60 animate-pulse">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
              </span>
            </div>

            <div>
              {/* Top Banner Tagline */}
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-mono text-[10px] font-extrabold tracking-widest uppercase shadow-sm">
                  {activeAlert.title}
                </span>
                <span className="flex items-center gap-1 text-[11px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                  <Landmark className="w-3 h-3 text-amber-400" />
                  <span>STOCK ACT DISCLOSURE</span>
                </span>
                <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{activeAlert.timeAgo}</span>
                </span>
              </div>

              {/* Bold Alert Headline */}
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black font-sans tracking-tight text-white flex items-center gap-2">
                  <span>{activeAlert.headline}</span>
                </h2>
                <span className="px-2 py-0.5 rounded font-mono text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1">
                  <span>${activeAlert.symbol}</span>
                  <span className="text-[10px] text-emerald-400 font-normal">
                    ${currentPrice.toFixed(2)}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Key Alert Data Spec Grid (User's Exact Specification) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 bg-black/40 border border-slate-800/80 rounded-xl p-2.5 sm:p-3 font-mono text-xs shadow-inner">
            {/* Amount */}
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                Amount:
              </span>
              <span className="text-sm font-black text-cyan-400 mt-0.5">
                {activeAlert.amount}
              </span>
            </div>

            {/* Industry */}
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1">
                <Cpu className="w-3 h-3 text-slate-400" />
                <span>Industry:</span>
              </span>
              <span className="text-xs font-bold text-slate-200 mt-0.5 truncate">
                {activeAlert.industry}
              </span>
            </div>

            {/* Risk Rating */}
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                Risk Rating:
              </span>
              <div className="mt-0.5">
                <span className={`px-2 py-0.5 rounded text-[11px] font-extrabold border ${
                  activeAlert.riskRating === 'Low'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : activeAlert.riskRating === 'Medium'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                }`}>
                  {activeAlert.riskRating}
                </span>
              </div>
            </div>

            {/* Similar trades */}
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1">
                <Users className="w-3 h-3 text-slate-400" />
                <span>Similar trades:</span>
              </span>
              <span className="text-[11px] font-bold text-amber-300 mt-0.5 line-clamp-2">
                {activeAlert.similarTrades}
              </span>
            </div>
          </div>

          {/* Action CTAs & Controls */}
          <div className="flex items-center gap-2 flex-wrap lg:flex-nowrap justify-end shrink-0">
            {/* AI Forensic Audit button */}
            <button
              onClick={() => {
                if (onOpenAudit) onOpenAudit(activeAlert.symbol);
                else if (onNavigateToSmartMoney) onNavigateToSmartMoney();
              }}
              className="px-3 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-mono text-xs font-bold shadow-lg shadow-blue-500/20 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Forensic Audit</span>
            </button>

            {/* Inspect Detail Drawer */}
            <button
              onClick={() => setIsExpanded(true)}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Info className="w-3.5 h-3.5 text-cyan-400" />
              <span>Dossier</span>
            </button>

            {/* Flip / Controls */}
            <div className="flex items-center gap-1 border-l border-slate-800 pl-2 ml-1">
              {alerts.length > 1 && (
                <button
                  onClick={() => {
                    setCurrentIndex((prev) => (prev + 1) % alerts.length);
                    playChime();
                  }}
                  title="Next Smart Money Alert"
                  className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer text-[10px] font-mono px-2"
                >
                  {currentIndex + 1}/{alerts.length} &rarr;
                </button>
              )}

              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                title={soundEnabled ? 'Mute alert sounds' : 'Enable alert sounds'}
                className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-slate-300" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
              </button>

              <button
                onClick={() => setIsDismissed(true)}
                title="Dismiss banner (collapses to top ticker)"
                className="p-2 rounded-lg bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* EXPANDED DOSSIER MODAL / DRAWER */}
      {isExpanded && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b0f19] border border-rose-500/40 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40">
                  <AlertTriangle className="w-6 h-6" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-extrabold uppercase tracking-wider text-rose-400">
                      🚨 SMART MONEY INTELLIGENCE DOSSIER
                    </span>
                    <span className="px-2 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-mono">
                      STOCK ACT
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white font-sans">
                    {activeAlert.headline}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setIsExpanded(false)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Core Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] font-mono text-slate-400 block uppercase">Reported Amount</span>
                <span className="text-base font-bold font-mono text-cyan-400">{activeAlert.amount}</span>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] font-mono text-slate-400 block uppercase">Target Industry</span>
                <span className="text-xs font-bold font-mono text-white truncate block">{activeAlert.industry}</span>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] font-mono text-slate-400 block uppercase">Risk Assessment</span>
                <span className="text-xs font-bold font-mono text-amber-300 block">{activeAlert.riskRating} Rating</span>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] font-mono text-slate-400 block uppercase">Disclosure Lag</span>
                <span className="text-xs font-bold font-mono text-emerald-400 block">
                  {activeAlert.details?.lagDays ? `${activeAlert.details.lagDays} days (Statutory max: 45d)` : '3 days'}
                </span>
              </div>
            </div>

            {/* Macro Context: Similar Trades by 12 Politicians */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 mb-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span>SIMILAR CONGRESSIONAL TRADES IN AI STOCKS (THIS MONTH)</span>
                </span>
                <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                  {activeAlert.similarTrades}
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                Tracking capital allocations by members of Congress and key committee chairs in artificial intelligence, semiconductors, and cloud infrastructure:
              </p>

              <div className="divide-y divide-slate-800 border border-slate-800 rounded-lg overflow-hidden text-xs font-mono">
                {(activeAlert.details?.peerTrades || [
                  { politician: 'Nancy Pelosi (House)', symbol: 'NVDA', amount: '$1M - $5M Deep ITM Calls', date: '2026-06-26' },
                  { politician: 'Tommy Tuberville (Senate)', symbol: 'PLTR', amount: '$100K - $250K Equity', date: '2026-07-18' },
                  { politician: 'Michael McCaul (House)', symbol: 'MSFT', amount: '$250K - $500K Equity', date: '2026-08-14' },
                  { politician: 'Mark Green (House)', symbol: 'CRWD', amount: '$100K - $250K Equity', date: '2026-08-01' },
                  { politician: 'Ro Khanna (House)', symbol: 'AAPL', amount: '$50K - $100K Equity', date: '2026-09-08' },
                ]).map((peer, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-950/40 hover:bg-slate-800/40 transition">
                    <div>
                      <span className="text-white font-bold">{peer.politician}</span>
                      <span className="text-slate-500 ml-2 text-[11px]">{peer.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-cyan-300 font-bold border border-blue-500/30">
                        {peer.symbol}
                      </span>
                      <span className="text-emerald-400 font-bold">{peer.amount}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Institutional Footprint & Key Insight */}
            {activeAlert.details?.keyInsight && (
              <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 mb-5">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-blue-300 mb-1">
                  <ShieldCheck className="w-4 h-4 text-blue-400" />
                  <span>REGULATORY & COMMITTEE OVERSIGHT AUDIT</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {activeAlert.details.keyInsight}
                </p>
                {activeAlert.details.committee && (
                  <div className="mt-2 text-[11px] font-mono text-slate-400">
                    <span className="text-slate-500">Committee Jurisdiction: </span>
                    <span className="text-slate-300">{activeAlert.details.committee}</span>
                  </div>
                )}
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800 flex-wrap gap-2">
              <button
                onClick={() => {
                  setIsExpanded(false);
                  if (onSelectAsset) onSelectAsset(activeAlert.symbol);
                }}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <BarChart2 className="w-4 h-4 text-cyan-400" />
                <span>Open {activeAlert.symbol} Chart</span>
              </button>

              <div className="flex items-center gap-2">
                {onOpenAlertModal && (
                  <button
                    onClick={() => {
                      setIsExpanded(false);
                      onOpenAlertModal(activeAlert.symbol, currentPrice);
                    }}
                    className="px-4 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-white font-mono text-xs font-bold border border-amber-500/40 flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Target className="w-4 h-4" />
                    <span>Set Target Alert</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setIsExpanded(false);
                    if (onOpenAudit) onOpenAudit(activeAlert.symbol);
                    else if (onNavigateToSmartMoney) onNavigateToSmartMoney();
                  }}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-mono text-xs font-bold shadow-lg shadow-blue-500/20 flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Execute Forensic Audit</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
