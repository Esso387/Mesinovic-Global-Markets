import React, { useState } from 'react';
import { AIAssistantResponse } from '../types/market.ts';
import { 
  Bot, 
  Send, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  HelpCircle, 
  CheckCircle2, 
  Globe, 
  Zap, 
  History,
  RefreshCw,
  Lightbulb
} from 'lucide-react';

interface AIAssistantViewProps {
  onAnalyzeStock: (symbol: string) => void;
}

interface QueryHistoryItem {
  id: string;
  question: string;
  timestamp: string;
  response: AIAssistantResponse;
}

export const AIAssistantView: React.FC<AIAssistantViewProps> = ({ onAnalyzeStock }) => {
  const [question, setQuestion] = useState('Why did NVIDIA rise today?');
  const [isLoading, setIsLoading] = useState(false);
  const [activeResponse, setActiveResponse] = useState<AIAssistantResponse | null>({
    headline: 'NVIDIA gained 3.63% on surging data center accelerator orders and hyperscaler CAPEX expansions.',
    reasons: [
      'Hyperscalers (Microsoft, Alphabet, Meta, AWS) raised forward AI CAPEX spending projections above $250B.',
      'Tier-1 Wall Street analysts lifted 12-month consensus price targets to $165 citing Blackwell rack deliveries.',
      'Institutional order volume registered 1.4x the 30-day moving average, signaling heavy mutual fund accumulation.',
      'Sovereign AI infrastructure initiatives in Europe and Asia announced direct procurement agreements.',
    ],
    sentiment: 'Bullish',
    confidence: 89,
    detailedAnalysis: `NVIDIA (NVDA) experienced heavy institutional bid flow throughout today's session, reclaiming critical technical resistance above the 20-day moving average. Supply chain channel checks confirm that advanced CoWoS packaging yields have normalized, unlocking accelerated shipments. 

Concurrently, broad semiconductor sentiment was buoyed by positive revisions in memory and optical networking suppliers. Options market skew indicated aggressive demand for out-of-the-money call strikes expiring over the next 60 days.`,
    macroFactors: [
      'Benchmark 10-Year Treasury yield stabilized near 4.02%, preventing multiple compression.',
      'Semiconductor sector ETF (SOXX) outperformed broad S&P 500 by 180 basis points.',
      'Liquidity conditions in institutional money markets remain highly accommodative.',
    ],
    recommendation: 'Maintain core long positions; trail stop-losses upward to $128.50 support floor.',
  });

  const [history, setHistory] = useState<QueryHistoryItem[]>([
    {
      id: 'h1',
      question: 'Why did NVIDIA rise today?',
      timestamp: 'Today, 2:15 PM',
      response: {
        headline: 'NVIDIA gained 3.63% on surging data center accelerator orders and hyperscaler CAPEX expansions.',
        reasons: [
          'Hyperscalers raised forward AI CAPEX spending projections above $250B.',
          'Tier-1 Wall Street analysts lifted 12-month targets to $165.',
          'Institutional order volume registered 1.4x 30-day average.',
        ],
        sentiment: 'Bullish',
        confidence: 89,
        detailedAnalysis: 'NVIDIA saw broad institutional accumulation following positive data center updates.',
        macroFactors: ['Stable Treasury yields', 'Strong semiconductor breadth'],
        recommendation: 'Maintain core long positions with stop at $128.50.',
      },
    },
  ]);

  const presetQueries = [
    'Why did NVIDIA rise today?',
    'Why did BHP and the Australian ASX 200 rally today?',
    'What is driving Gold (XAUUSD) to record highs?',
    'Why did Tesla drop below $225?',
    'How will upcoming Fed interest rate cuts impact tech stocks?',
    'What is the outlook for Australian high-dividend stocks?',
  ];

  const handleAsk = async (queryText: string) => {
    if (!queryText.trim()) return;
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/market-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: queryText }),
      });
      const data: AIAssistantResponse = await res.json();
      setActiveResponse(data);

      const newItem: QueryHistoryItem = {
        id: Date.now().toString(),
        question: queryText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        response: data,
      };
      setHistory((prev) => [newItem, ...prev.slice(0, 8)]);
    } catch (err) {
      console.error('Failed to ask assistant:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAsk(question);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left 2 Cols: Main Query & AI Response Display */}
      <div className="lg:col-span-2 space-y-6">
        {/* Search & Query Bar */}
        <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-5 shadow-xl">
          <div className="flex items-center gap-2 mb-3">
            <Bot className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold font-mono text-white tracking-wide uppercase">
              AI Market Intelligence Query Terminal
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 ml-auto">
              Gemini 3.8 Flash
            </span>
          </div>

          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask any market movement question (e.g. Why did NVIDIA rise today?)..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-500 font-sans"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !question.trim()}
              className="px-5 py-3 bg-linear-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/10 transition flex items-center gap-2 disabled:opacity-50 shrink-0"
            >
              {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Ask AI
            </button>
          </form>

          {/* Quick preset chips */}
          <div className="mt-4 pt-3 border-t border-slate-800/80">
            <div className="text-[11px] font-mono text-slate-400 mb-2 flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" /> Fast Institutional Prompts:
            </div>
            <div className="flex flex-wrap gap-2">
              {presetQueries.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuestion(q);
                    handleAsk(q);
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs font-mono bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* AI Answer Display */}
        {isLoading ? (
          <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-12 text-center space-y-3">
            <div className="inline-flex p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 animate-spin">
              <RefreshCw className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold font-mono text-white">Synthesizing Real-time Market Order Flow & Catalysts</h4>
            <p className="text-xs text-slate-400">Gemini is parsing earnings transcripts, analyst models, and volume spreads...</p>
          </div>
        ) : activeResponse ? (
          <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-6 shadow-2xl space-y-6">
            {/* Headline and Sentiment Header */}
            <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-slate-800">
              <div className="flex-1">
                <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-wider mb-1">
                  <Sparkles className="w-3.5 h-3.5" /> Market Intelligence Brief
                </div>
                <h3 className="text-lg font-bold text-white leading-snug">
                  {activeResponse.headline}
                </h3>
              </div>

              {/* Sentiment & Confidence Badges */}
              <div className="flex items-center gap-3">
                <div className="text-right font-mono">
                  <div className="text-[10px] text-slate-500 uppercase">Confidence</div>
                  <div className="text-sm font-bold text-white">{activeResponse.confidence}%</div>
                </div>
                <div className={`px-4 py-2 rounded-xl border font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 ${
                  activeResponse.sentiment === 'Bullish'
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : activeResponse.sentiment === 'Bearish'
                    ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                    : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                }`}>
                  {activeResponse.sentiment === 'Bullish' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {activeResponse.sentiment}
                </div>
              </div>
            </div>

            {/* Structured Reasons Bullets (As explicitly requested by user) */}
            <div>
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Primary Drivers & Catalysts:
              </h4>
              <div className="grid grid-cols-1 gap-2.5">
                {activeResponse.reasons?.map((reason, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl text-xs text-slate-200 flex items-start gap-3"
                  >
                    <span className="w-5 h-5 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-mono text-[11px] font-bold shrink-0 mt-0.5">
                      •
                    </span>
                    <span className="leading-relaxed">{reason}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Detailed Analytical Breakdown */}
            <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/70 text-xs text-slate-300 space-y-2 leading-relaxed">
              <div className="font-mono font-bold text-white text-[11px] uppercase tracking-wider text-slate-400 mb-1">
                Technical & Fundamental Commentary
              </div>
              <p className="whitespace-pre-line">{activeResponse.detailedAnalysis}</p>
            </div>

            {/* Macro Factors & Strategy */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 text-xs space-y-2">
                <div className="font-mono font-bold text-blue-400 flex items-center gap-1.5 text-[11px]">
                  <Globe className="w-3.5 h-3.5" /> Macroeconomic Environment
                </div>
                <ul className="space-y-1.5 text-slate-300 text-[11px]">
                  {activeResponse.macroFactors?.map((mf, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-blue-500 font-bold">•</span>
                      <span>{mf}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 text-xs space-y-2">
                <div className="font-mono font-bold text-amber-400 flex items-center gap-1.5 text-[11px]">
                  <Zap className="w-3.5 h-3.5" /> Actionable Trader Takeaway
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  {activeResponse.recommendation}
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => onAnalyzeStock('NVDA')}
                    className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 underline"
                  >
                    Open Deep Quantitative Model & Chart →
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Right Col: Query History & Quick Guides */}
      <div className="space-y-6">
        {/* Past Inquiries Log */}
        <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-800 text-slate-300">
            <History className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider">Session Inquiries</h4>
            <span className="text-[10px] font-mono text-slate-500 ml-auto">{history.length} Saved</span>
          </div>

          <div className="space-y-2.5">
            {history.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setQuestion(item.question);
                  setActiveResponse(item.response);
                }}
                className="w-full text-left p-3 rounded-lg bg-slate-950 hover:bg-slate-900 border border-slate-800/80 transition group"
              >
                <div className="text-xs font-medium text-slate-200 group-hover:text-cyan-300 line-clamp-2">
                  {item.question}
                </div>
                <div className="flex items-center justify-between mt-2 text-[10px] font-mono text-slate-500">
                  <span>{item.timestamp}</span>
                  <span className={`px-1.5 py-0.5 rounded ${
                    item.response.sentiment === 'Bullish' ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'
                  }`}>
                    {item.response.sentiment}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Bloomberg Terminal Architecture Info */}
        <div className="bg-linear-to-b from-slate-900 to-[#070b13] border border-slate-800 rounded-xl p-5 shadow-lg text-xs space-y-3">
          <div className="font-mono font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-400" /> AI Terminal Capabilities
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            The market assistant queries Gemini 3.8 Flash with structured financial schemas, extracting causal drivers, order book dynamics, and forward macroeconomic sentiment for any asset.
          </p>
          <div className="pt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-500 space-y-1">
            <div>• Real-time stock movement explanations</div>
            <div>• Earnings report instant deconstruction</div>
            <div>• Cross-asset correlation insights</div>
          </div>
        </div>
      </div>
    </div>
  );
};
