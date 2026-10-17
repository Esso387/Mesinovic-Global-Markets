import React, { useState } from 'react';
import { MarketAsset } from '../types/market.ts';
import { 
  Globe, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Compass, 
  BarChart3, 
  ShieldCheck, 
  Layers, 
  Sparkles, 
  Zap,
  Brain,
  RefreshCw,
  ArrowRight
} from 'lucide-react';

interface GlobalMarketsViewProps {
  assets: MarketAsset[];
  onSelectAsset: (symbol: string) => void;
  onAnalyzeStock: (symbol: string) => void;
}

export const GlobalMarketsView: React.FC<GlobalMarketsViewProps> = ({
  assets,
  onSelectAsset,
  onAnalyzeStock,
}) => {
  const [macroData, setMacroData] = useState<any | null>(null);
  const [isLoadingMacro, setIsLoadingMacro] = useState<boolean>(false);

  const fetchMacroAnalysis = async () => {
    setIsLoadingMacro(true);
    try {
      const res = await fetch('/api/ai/macro-synthesis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      setMacroData(data);
    } catch (err) {
      console.error('Failed to fetch macro intelligence:', err);
    } finally {
      setIsLoadingMacro(false);
    }
  };

  const indices = assets.filter((a) => a.assetClass === 'index');
  const commodities = assets.filter((a) => a.assetClass === 'commodity');
  const cryptoAndForex = assets.filter((a) => a.assetClass === 'crypto' || a.assetClass === 'forex');
  const aussieAssets = assets.filter((a) => a.region === 'AUS');

  // Top gainers and decliners
  const gainers = [...assets].sort((a, b) => b.changePercent - a.changePercent).slice(0, 4);
  const decliners = [...assets].sort((a, b) => a.changePercent - b.changePercent).slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Top Overview: Global Sentiment & Market Hub Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Fear & Greed Index Dial */}
        <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-mono font-bold uppercase text-white flex items-center gap-2">
                <Compass className="w-4 h-4 text-cyan-400" /> Market Sentiment Index
              </h4>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Greed (68/100)
              </span>
            </div>

            <div className="space-y-2 mt-4">
              <div className="h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800 flex">
                <div className="w-1/4 bg-rose-500/80" title="Extreme Fear" />
                <div className="w-1/4 bg-amber-500/80" title="Fear" />
                <div className="w-1/4 bg-blue-500/80" title="Neutral" />
                <div className="w-1/4 bg-emerald-500/80" title="Greed" />
              </div>
              <div className="flex justify-between text-[9px] font-mono text-slate-500">
                <span>0 Extreme Fear</span>
                <span>50 Neutral</span>
                <span>100 Greed</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 mt-4 leading-relaxed">
              Risk appetite remains buoyant driven by enterprise AI capital deployment, resilient corporate earnings, and favorable central bank liquidity.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[10px] font-mono text-slate-500 flex justify-between">
            <span>Historical: 62 (Yesterday)</span>
            <span>Source: Multi-Factor Quant</span>
          </div>
        </div>

        {/* Major Financial Exchange Status */}
        <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-5 shadow-xl md:col-span-2">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
            <h4 className="text-xs font-mono font-bold uppercase text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" /> Global Exchange Trading Hours
            </h4>
            <span className="text-[10px] font-mono text-slate-400">Live UTC Synchronization</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl">
              <div className="text-[10px] text-slate-400">New York (NYSE)</div>
              <div className="text-sm font-bold text-white mt-1">EST (UTC-5)</div>
              <div className="flex items-center gap-1.5 mt-2 text-[11px] text-emerald-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                OPEN
              </div>
            </div>

            <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl">
              <div className="text-[10px] text-slate-400">Sydney (ASX)</div>
              <div className="text-sm font-bold text-white mt-1">AEST (UTC+10)</div>
              <div className="flex items-center gap-1.5 mt-2 text-[11px] text-emerald-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                ACTIVE
              </div>
            </div>

            <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl">
              <div className="text-[10px] text-slate-400">London (LSE)</div>
              <div className="text-sm font-bold text-white mt-1">GMT (UTC+0)</div>
              <div className="flex items-center gap-1.5 mt-2 text-[11px] text-amber-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                CLOSED
              </div>
            </div>

            <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl">
              <div className="text-[10px] text-slate-400">Tokyo (TSE)</div>
              <div className="text-sm font-bold text-white mt-1">JST (UTC+9)</div>
              <div className="flex items-center gap-1.5 mt-2 text-[11px] text-emerald-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                ACTIVE
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Cross-Asset Macro Intelligence Synthesizer */}
      <div className="bg-linear-to-r from-slate-900 via-[#0a1224] to-slate-900 border border-blue-500/30 rounded-2xl p-5 shadow-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-cyan-400" />
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
                Global Cross-Asset Quantitative Model
              </div>
              <h4 className="text-sm font-mono font-bold text-white">
                Gemini Macro Regime & Correlation Synthesizer
              </h4>
            </div>
          </div>

          <button
            onClick={fetchMacroAnalysis}
            disabled={isLoadingMacro}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-linear-to-r from-blue-600 via-cyan-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-mono font-bold text-xs rounded-lg transition shadow-md shadow-blue-500/20 disabled:opacity-50"
          >
            {isLoadingMacro ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>{macroData ? 'Refresh Macro Synthesis' : 'Run Macro Intelligence'}</span>
          </button>
        </div>

        {isLoadingMacro ? (
          <div className="p-8 text-center space-y-2 font-mono">
            <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin mx-auto" />
            <div className="text-xs font-bold text-white">Synthesizing Sovereign Yields, FX, and Commodities Flow...</div>
            <div className="text-[11px] text-slate-400">Gemini is analyzing cross-asset correlations, central bank trajectories, and trade terms.</div>
          </div>
        ) : macroData ? (
          <div className="space-y-4 font-mono text-xs">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Posture: {macroData.marketPosture}
                </span>
                <span className="text-slate-400 text-[11px]">
                  Macro Confidence: <strong className="text-white">{macroData.macroConfidence}%</strong>
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                Fed Easing Probability: <span className="text-cyan-400 font-bold">78% (25bps)</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 font-sans leading-relaxed bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
              {macroData.executiveSummary}
            </p>

            {/* Cross-Asset Correlation Dynamics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {macroData.crossAssetDynamics?.map((item: any, idx: number) => (
                <div key={idx} className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-[11px]">{item.assetPair}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                      item.correlation >= 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
                    }`}>
                      Correlation: {item.correlation > 0 ? '+' : ''}{item.correlation}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans leading-relaxed">{item.impact}</p>
                </div>
              ))}
            </div>

            {/* Bottom 2 Tactical Takeaways: ASX Dynamics & Top Barbell Trade */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 space-y-1">
                <div className="text-[11px] font-bold text-blue-400 uppercase">
                  Australian ASX 200 vs Wall Street Dynamic
                </div>
                <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                  {macroData.asxOutlook}
                </p>
              </div>

              <div className="p-3 bg-slate-950/70 rounded-xl border border-amber-500/30 space-y-1">
                <div className="text-[11px] font-bold text-amber-400 uppercase flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5" /> High-Conviction Macro Tactical Trade
                </div>
                <p className="text-[11px] text-slate-200 font-sans leading-relaxed">
                  {macroData.topMacroTacticalTrade}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-400 flex items-center justify-between font-mono bg-slate-950/50 p-3.5 rounded-xl border border-slate-800">
            <span>Click "Run Macro Intelligence" to synthesize Treasury yield curves, DXY dollar index flows, crude oil pass-through, and Australian terms of trade.</span>
          </div>
        )}
      </div>

      {/* World Benchmark Indices Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-400" /> World Benchmark Indices
          </h3>
          <span className="text-[11px] font-mono text-slate-500">Global Equities</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {indices.map((idx) => {
            const isUp = idx.change >= 0;
            return (
              <div
                key={idx.symbol}
                onClick={() => onSelectAsset(idx.symbol)}
                className="bg-[#0b0f19] hover:bg-slate-900/80 border border-slate-800 hover:border-blue-500/50 rounded-xl p-4 shadow-lg transition cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-white">{idx.symbol}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                    {idx.region}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-sans truncate mt-1">{idx.name}</div>
                <div className="text-base font-bold font-mono text-white mt-2">
                  {idx.price.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
                </div>
                <div className={`flex items-center gap-1 text-xs font-mono font-bold mt-1 ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  {isUp ? '+' : ''}{idx.changePercent.toFixed(2)}%
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Commodities & Crypto Strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Commodities */}
        <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
            <h4 className="text-xs font-mono font-bold uppercase text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" /> Key Global Commodities
            </h4>
            <span className="text-[10px] font-mono text-slate-400">Futures & Spot</span>
          </div>

          <div className="space-y-3">
            {commodities.map((c) => {
              const isUp = c.change >= 0;
              return (
                <div
                  key={c.symbol}
                  onClick={() => onSelectAsset(c.symbol)}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 hover:bg-slate-900 border border-slate-800/80 cursor-pointer transition font-mono"
                >
                  <div>
                    <div className="font-bold text-white text-xs">{c.name}</div>
                    <div className="text-[10px] text-slate-500">{c.symbol} • {c.exchange}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-white">${c.price.toFixed(2)}</div>
                    <div className={`text-[11px] font-bold ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isUp ? '+' : ''}{c.changePercent.toFixed(2)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Crypto & Currencies */}
        <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
            <h4 className="text-xs font-mono font-bold uppercase text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-400" /> Digital Assets & Foreign Exchange
            </h4>
            <span className="text-[10px] font-mono text-slate-400">24/7 Liquidity</span>
          </div>

          <div className="space-y-3">
            {cryptoAndForex.map((item) => {
              const isUp = item.change >= 0;
              return (
                <div
                  key={item.symbol}
                  onClick={() => onSelectAsset(item.symbol)}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 hover:bg-slate-900 border border-slate-800/80 cursor-pointer transition font-mono"
                >
                  <div>
                    <div className="font-bold text-white text-xs">{item.name}</div>
                    <div className="text-[10px] text-slate-500">{item.symbol} • {item.sector}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-white">
                      ${item.price.toFixed(item.assetClass === 'forex' ? 4 : 2)}
                    </div>
                    <div className={`text-[11px] font-bold ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isUp ? '+' : ''}{item.changePercent.toFixed(2)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Gainers & Decliners Strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Gainers */}
        <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4 text-emerald-400">
            <h4 className="text-xs font-mono font-bold uppercase flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" /> Top Session Gainers
            </h4>
            <span className="text-[10px] font-mono text-slate-500">Global Momentum</span>
          </div>
          <div className="space-y-2 font-mono text-xs">
            {gainers.map((g) => (
              <div
                key={g.symbol}
                onClick={() => onSelectAsset(g.symbol)}
                className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/15 hover:bg-emerald-500/10 cursor-pointer transition"
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{g.symbol}</span>
                  <span className="text-[11px] text-slate-400 font-sans truncate max-w-[120px]">{g.name}</span>
                </div>
                <div className="text-right font-bold text-emerald-400">
                  +${g.change.toFixed(2)} (+{g.changePercent.toFixed(2)}%)
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Decliners */}
        <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4 text-rose-400">
            <h4 className="text-xs font-mono font-bold uppercase flex items-center gap-1.5">
              <TrendingDown className="w-4 h-4" /> Top Session Pullbacks
            </h4>
            <span className="text-[10px] font-mono text-slate-500">Oversold Watch</span>
          </div>
          <div className="space-y-2 font-mono text-xs">
            {decliners.map((d) => (
              <div
                key={d.symbol}
                onClick={() => onSelectAsset(d.symbol)}
                className="flex items-center justify-between p-2.5 rounded-lg bg-rose-500/5 border border-rose-500/15 hover:bg-rose-500/10 cursor-pointer transition"
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{d.symbol}</span>
                  <span className="text-[11px] text-slate-400 font-sans truncate max-w-[120px]">{d.name}</span>
                </div>
                <div className="text-right font-bold text-rose-400">
                  {d.change.toFixed(2)} ({d.changePercent.toFixed(2)}%)
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
