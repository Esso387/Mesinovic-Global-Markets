import React, { useState } from 'react';
import { MarketAsset, AIStockAnalysis } from '../types/market.ts';
import { 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  ShieldAlert, 
  Target, 
  Activity, 
  Newspaper, 
  Compass, 
  CheckCircle2, 
  AlertTriangle,
  RefreshCw,
  Search,
  Zap,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

interface AIAnalysisViewProps {
  assets: MarketAsset[];
  selectedSymbol: string;
  onSelectSymbol: (sym: string) => void;
  aiAnalysis: AIStockAnalysis | null;
  isLoading: boolean;
  onRunAnalysis: (sym: string) => void;
}

export const AIAnalysisView: React.FC<AIAnalysisViewProps> = ({
  assets,
  selectedSymbol,
  onSelectSymbol,
  aiAnalysis,
  isLoading,
  onRunAnalysis,
}) => {
  const [customInput, setCustomInput] = useState('');
  const [tradeSetup, setTradeSetup] = useState<any | null>(null);
  const [isLoadingTradeSetup, setIsLoadingTradeSetup] = useState<boolean>(false);
  const activeAsset = assets.find((a) => a.symbol === selectedSymbol) || assets[0];

  const handleGenerateTradeSetup = async () => {
    setIsLoadingTradeSetup(true);
    try {
      const res = await fetch('/api/ai/trade-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: selectedSymbol,
          currentPrice: activeAsset?.price,
          volatility: 36.4,
          trend: aiAnalysis?.trend || 'Bullish',
        }),
      });
      const data = await res.json();
      setTradeSetup(data);
    } catch (err) {
      console.error('Failed to generate trade setup:', err);
    } finally {
      setIsLoadingTradeSetup(false);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customInput.trim()) {
      const sym = customInput.trim().toUpperCase();
      onSelectSymbol(sym);
      onRunAnalysis(sym);
      setCustomInput('');
    }
  };

  const getOpinionColor = (op?: string) => {
    switch (op) {
      case 'BUY':
        return 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30';
      case 'SELL':
        return 'text-rose-400 bg-rose-500/15 border-rose-500/30';
      case 'WATCH':
        return 'text-cyan-400 bg-cyan-500/15 border-cyan-500/30';
      case 'HOLD':
      default:
        return 'text-amber-400 bg-amber-500/15 border-amber-500/30';
    }
  };

  const getTrendIcon = (trend?: string) => {
    if (!trend) return <Activity className="w-5 h-5 text-slate-400" />;
    if (trend.includes('Bullish')) return <TrendingUp className="w-5 h-5 text-emerald-400" />;
    if (trend.includes('Bearish')) return <TrendingDown className="w-5 h-5 text-rose-400" />;
    return <Compass className="w-5 h-5 text-amber-400" />;
  };

  return (
    <div className="space-y-6">
      {/* Ticker Selector Bar */}
      <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-4 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase font-mono tracking-wider text-slate-400 font-semibold mr-1">
            Analyze Symbol:
          </span>
          {['NVDA', 'AAPL', 'TSLA', 'BHP.AX', 'MSFT', 'CBA.AX', 'WDS.AX', 'BTCUSD'].map((sym) => (
            <button
              key={sym}
              onClick={() => {
                onSelectSymbol(sym);
                onRunAnalysis(sym);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                selectedSymbol === sym
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
              }`}
            >
              {sym}
            </button>
          ))}
        </div>

        {/* Custom ticker search input */}
        <form onSubmit={handleCustomSubmit} className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="e.g. AMZN, RIO.AX, SPX..."
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-white placeholder-slate-600 focus:outline-hidden focus:border-blue-500 w-44"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-linear-to-r from-blue-600 to-cyan-600 text-white text-xs font-bold rounded-lg hover:from-blue-500 hover:to-cyan-500 transition shadow disabled:opacity-50"
          >
            {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            Analyze
          </button>
        </form>
      </div>

      {/* Main Analysis Card Grid */}
      {isLoading ? (
        <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-16 text-center space-y-4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 animate-spin">
            <RefreshCw className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-white font-mono">Gemini AI Quantitative Engine Processing</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Extracting chart support/resistance barriers, 14-day RSI momentum, global news sentiment, and risk-reward profile for {selectedSymbol}...
          </p>
        </div>
      ) : aiAnalysis ? (
        <div className="space-y-6">
          {/* Top Banner: Core Opinion & Metrics */}
          <div className="bg-linear-to-r from-slate-900 via-[#0d1424] to-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-wrap items-start justify-between gap-6 relative z-10">
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-3xl font-extrabold text-white tracking-tight">{aiAnalysis.symbol}</span>
                  <span className="text-lg text-slate-300 font-medium">{aiAnalysis.name || activeAsset?.name}</span>
                  <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                    Price: ${activeAsset?.price.toFixed(2) || '---'}
                  </span>
                </div>
                <p className="text-sm text-slate-400 mt-2 max-w-2xl leading-relaxed">
                  {aiAnalysis.trendExplanation}
                </p>
              </div>

              {/* Core Recommendation Callout */}
              <div className="flex items-center gap-4 bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
                <div className="text-right">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">AI Valuation Rating</div>
                  <div className="text-xs font-medium text-slate-500">Confidence: {aiAnalysis.confidenceScore}%</div>
                </div>
                <div className={`px-5 py-2.5 rounded-lg border text-xl font-mono font-extrabold tracking-wider ${getOpinionColor(aiAnalysis.opinion)}`}>
                  {aiAnalysis.opinion}
                </div>
              </div>
            </div>

            {/* Quick KPI Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-slate-800/80 font-mono">
              <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/60">
                <div className="text-[11px] text-slate-400 flex items-center justify-between">
                  <span>12M Target</span>
                  <Target className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="text-lg font-bold text-emerald-400 mt-0.5">
                  ${aiAnalysis.targetPrice.toFixed(2)}
                </div>
                {activeAsset && (
                  <div className="text-[10px] text-slate-500">
                    Upside: +{(((aiAnalysis.targetPrice - activeAsset.price) / activeAsset.price) * 100).toFixed(1)}%
                  </div>
                )}
              </div>

              <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/60">
                <div className="text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Stop-Loss Limit</span>
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                </div>
                <div className="text-lg font-bold text-rose-400 mt-0.5">
                  ${aiAnalysis.stopLoss.toFixed(2)}
                </div>
                <div className="text-[10px] text-slate-500">Technical Invalidation</div>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/60">
                <div className="text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Trend Direction</span>
                  {getTrendIcon(aiAnalysis.trend)}
                </div>
                <div className="text-base font-bold text-white mt-0.5">
                  {aiAnalysis.trend}
                </div>
                <div className="text-[10px] text-slate-500">Multi-timeframe align</div>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/60">
                <div className="text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Risk / Reward</span>
                  <Zap className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <div className="text-lg font-bold text-cyan-400 mt-0.5">
                  {aiAnalysis.riskRewardRatio || '2.8:1'}
                </div>
                <div className="text-[10px] text-slate-500">Asymmetric ratio</div>
              </div>
            </div>
          </div>

          {/* Section: Technical Levels, RSI & Sentiment */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 1. Support & Resistance Levels */}
            <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                    <Target className="w-4 h-4 text-blue-400" /> Key Support & Resistance
                  </h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-800 text-slate-400 rounded">Levels</span>
                </div>

                {/* Resistance Levels */}
                <div className="space-y-2 mb-4">
                  <div className="text-[11px] font-mono uppercase text-rose-400 font-semibold flex items-center gap-1">
                    <ArrowUpRight className="w-3.5 h-3.5" /> Resistance Barriers
                  </div>
                  {aiAnalysis.resistanceLevels?.map((res, i) => (
                    <div key={i} className="flex items-center justify-between bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-lg text-xs font-mono">
                      <span className="text-rose-300 font-medium">R{i + 1} Barrier</span>
                      <span className="text-rose-400 font-bold">${res.toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {/* Support Levels */}
                <div className="space-y-2">
                  <div className="text-[11px] font-mono uppercase text-emerald-400 font-semibold flex items-center gap-1">
                    <ArrowDownRight className="w-3.5 h-3.5" /> Support Floors
                  </div>
                  {aiAnalysis.supportLevels?.map((sup, i) => (
                    <div key={i} className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg text-xs font-mono">
                      <span className="text-emerald-300 font-medium">S{i + 1} Floor</span>
                      <span className="text-emerald-400 font-bold">${sup.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-500">
                Calculated via institutional order book liquidity clusters & historical Fibonacci retracements.
              </div>
            </div>

            {/* 2. RSI Momentum Dial */}
            <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                    <Activity className="w-4 h-4 text-cyan-400" /> Relative Strength (RSI 14)
                  </h4>
                  <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                    {aiAnalysis.currentRsi}
                  </span>
                </div>

                {/* RSI Visual Bar */}
                <div className="space-y-2 mb-4">
                  <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800 flex">
                    <div className="w-[30%] bg-emerald-500/40 h-full rounded-l-full" title="Oversold (<30)" />
                    <div className="w-[40%] bg-blue-500/40 h-full" title="Neutral (30-70)" />
                    <div className="w-[30%] bg-rose-500/40 h-full rounded-r-full" title="Overbought (>70)" />
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-slate-500">
                    <span className="text-emerald-400">0 (Oversold)</span>
                    <span>30</span>
                    <span className="text-cyan-400">50 (Mid)</span>
                    <span>70</span>
                    <span className="text-rose-400">100 (Overbought)</span>
                  </div>

                  {/* Marker Pin */}
                  <div className="relative pt-1">
                    <div
                      className="absolute top-0 -translate-x-1/2 flex flex-col items-center"
                      style={{ left: `${Math.max(2, Math.min(98, aiAnalysis.currentRsi))}%` }}
                    >
                      <div className="w-2.5 h-2.5 bg-cyan-400 rotate-45 border border-slate-900 shadow"></div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 text-xs text-slate-300 leading-relaxed mt-4">
                  {aiAnalysis.rsiInterpretation}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-500">
                Momentum oscillator measuring magnitude of recent price changes to evaluate overbought or oversold conditions.
              </div>
            </div>

            {/* 3. Market Sentiment Gauge */}
            <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                    <Compass className="w-4 h-4 text-purple-400" /> Market Sentiment
                  </h4>
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                    aiAnalysis.marketSentiment?.label === 'Bullish'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : aiAnalysis.marketSentiment?.label === 'Bearish'
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }`}>
                    {aiAnalysis.marketSentiment?.label || 'Neutral'} ({aiAnalysis.marketSentiment?.score || 50}/100)
                  </span>
                </div>

                {/* Sentiment Meter Bar */}
                <div className="space-y-1 mb-4">
                  <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-linear-to-r from-rose-500 via-amber-400 to-emerald-400 transition-all duration-700"
                      style={{ width: `${aiAnalysis.marketSentiment?.score || 50}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-slate-500">
                    <span>Extreme Fear</span>
                    <span>Neutral</span>
                    <span>Extreme Greed</span>
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 text-xs text-slate-300 leading-relaxed">
                  {aiAnalysis.marketSentiment?.summary}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-500">
                Synthesized across options skew, institutional volume, and media sentiment streams.
              </div>
            </div>
          </div>

          {/* Section: Key News Points & Catalysts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Key News & Catalysts */}
            <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-5 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                  <Newspaper className="w-4 h-4 text-amber-400" /> Key News & Fundamental Catalysts
                </h4>
                <span className="text-[10px] font-mono text-slate-400">Gemini Synthesis</span>
              </div>

              <div className="space-y-3">
                {aiAnalysis.keyNewsPoints?.map((bullet, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-slate-950/60 rounded-lg border border-slate-800/60 text-xs text-slate-300 leading-relaxed">
                    <span className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center font-mono text-[10px] font-bold shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{bullet}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Opinion Rationale & Risk Assessment */}
            <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Rationale & Risk Vectors
                  </h4>
                  <span className="text-[10px] font-mono text-slate-400">Tactical Playbook</span>
                </div>

                <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800/80 mb-4 text-xs text-slate-300 leading-relaxed">
                  <div className="font-semibold text-white mb-1">Strategic Rationale:</div>
                  {aiAnalysis.opinionRationale}
                </div>

                {/* Positive vs Risk factors */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
                    <div className="font-mono font-bold text-emerald-400 flex items-center gap-1.5 mb-2 text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Bull Catalysts
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-300">
                      {(aiAnalysis.catalysts?.positive || ['Expanding margins', 'Institutional accumulation']).map((c, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-emerald-500 font-bold">•</span>
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 bg-rose-500/5 border border-rose-500/20 rounded-lg">
                    <div className="font-mono font-bold text-rose-400 flex items-center gap-1.5 mb-2 text-[11px]">
                      <AlertTriangle className="w-3.5 h-3.5" /> Key Risks
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-300">
                      {(aiAnalysis.catalysts?.risks || ['Macro rate volatility', 'Valuation multiple compression']).map((r, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-rose-500 font-bold">•</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>Model: Gemini 3.8 Flash</span>
                <button
                  onClick={() => onRunAnalysis(aiAnalysis.symbol)}
                  className="text-blue-400 hover:text-blue-300 flex items-center gap-1 transition"
                >
                  <RefreshCw className="w-3 h-3" /> Refresh Analysis
                </button>
              </div>
            </div>
          </div>

          {/* AI Trade Execution Plan & Position Sizer Card */}
          <div className="bg-linear-to-r from-slate-900 via-[#0e172a] to-slate-900 border border-cyan-500/30 rounded-xl p-6 shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-cyan-400" />
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
                    Institutional Order Desk Planner
                  </div>
                  <h4 className="text-sm font-mono font-bold text-white">
                    Gemini AI Trade Execution Setup & Kelly Position Sizer ({aiAnalysis.symbol})
                  </h4>
                </div>
              </div>

              <button
                onClick={handleGenerateTradeSetup}
                disabled={isLoadingTradeSetup}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-linear-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono font-bold text-xs rounded-lg transition shadow-md shadow-cyan-500/20 disabled:opacity-50"
              >
                {isLoadingTradeSetup ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>{tradeSetup ? 'Regenerate Trade Plan' : 'Generate AI Trade Setup'}</span>
              </button>
            </div>

            {isLoadingTradeSetup ? (
              <div className="p-8 text-center space-y-2">
                <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin mx-auto" />
                <div className="text-xs font-mono font-bold text-white">Structuring Asymmetric Institutional Trade Plan...</div>
                <div className="text-[11px] text-slate-400">Calibrating entry bands, stop-loss invalidation, and Kelly position sizing.</div>
              </div>
            ) : tradeSetup ? (
              <div className="space-y-4 font-mono text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                    Setup: {tradeSetup.setupType}
                  </span>
                  <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30">
                    {tradeSetup.posture}
                  </span>
                  <span className="text-slate-400 text-[11px] ml-auto">
                    Risk / Reward: <strong className="text-emerald-400">{tradeSetup.riskRewardRatio}</strong>
                  </span>
                </div>

                {/* 4 Execution Target Pillars */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                    <div className="text-[10px] text-slate-400">Accumulation Entry Zone</div>
                    <div className="text-base font-bold text-cyan-400 mt-0.5">
                      ${tradeSetup.entryZone?.min?.toFixed(2)} - ${tradeSetup.entryZone?.max?.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-slate-500">Dynamic limit scale-in</div>
                  </div>

                  <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                    <div className="text-[10px] text-slate-400">Technical Stop-Loss</div>
                    <div className="text-base font-bold text-rose-400 mt-0.5">
                      ${tradeSetup.stopLoss?.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-slate-500">Structural invalidation</div>
                  </div>

                  <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                    <div className="text-[10px] text-slate-400">Take-Profit Target 1</div>
                    <div className="text-base font-bold text-emerald-400 mt-0.5">
                      ${tradeSetup.target1?.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-slate-500">Scale 50% & move stop to BE</div>
                  </div>

                  <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                    <div className="text-[10px] text-slate-400">Target 2 (Runner)</div>
                    <div className="text-base font-bold text-emerald-400 mt-0.5">
                      ${tradeSetup.target2?.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-slate-500">Trailing ATR stop</div>
                  </div>
                </div>

                {/* Strategy Directives */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800 space-y-1">
                    <div className="text-[11px] font-bold text-white uppercase tracking-wider">
                      Desk Execution Strategy
                    </div>
                    <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                      {tradeSetup.executionStrategy}
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800 space-y-1">
                    <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                      Position Sizing & Invalidation
                    </div>
                    <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                      Recommended Risk Size: <strong className="text-cyan-400 font-mono">{tradeSetup.suggestedAllocationPct}% of Portfolio Equity</strong>. {tradeSetup.invalidationCondition}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400 flex items-center justify-between font-mono bg-slate-950/50 p-3.5 rounded-xl border border-slate-800">
                <span>Click "Generate AI Trade Setup" to synthesize exact entry zones, risk-reward ratios, and volatility-calibrated allocation sizes for {aiAnalysis.symbol}.</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-12 text-center space-y-3">
          <Sparkles className="w-8 h-8 text-blue-400 mx-auto" />
          <h3 className="text-base font-bold text-white font-mono">Select a Symbol to Initiate AI Stock Analysis</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Click any ticker above or search to generate deep structured analysis: Trend, Support, Resistance, RSI, Sentiment, News, and Buy/Hold/Watch rating.
          </p>
          <button
            onClick={() => onRunAnalysis(selectedSymbol)}
            className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-mono font-bold transition inline-flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" /> Analyze {selectedSymbol} Now
          </button>
        </div>
      )}
    </div>
  );
};
