import React, { useState } from 'react';
import { NewsItem } from '../types/market.ts';
import { 
  Newspaper, 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  Clock, 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink,
  Flame
} from 'lucide-react';

interface NewsViewProps {
  news: NewsItem[];
  onSelectTicker: (ticker: string) => void;
  onAnalyzeTicker: (ticker: string) => void;
}

export const NewsView: React.FC<NewsViewProps> = ({
  news,
  onSelectTicker,
  onAnalyzeTicker,
}) => {
  const [filterSentiment, setFilterSentiment] = useState<'ALL' | 'Bullish' | 'Bearish' | 'Neutral'>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(news[0]?.id || null);

  const filtered = news.filter((n) => {
    if (filterSentiment === 'ALL') return true;
    return n.sentiment === filterSentiment;
  });

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Stream Stats */}
      <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-blue-400" />
          <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
            Institutional Wire & Sentiment Feed
          </h3>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
            Real-time Aggregator
          </span>
        </div>

        {/* Sentiment Filter Tabs */}
        <div className="flex items-center gap-1.5 font-mono text-xs">
          {(['ALL', 'Bullish', 'Bearish', 'Neutral'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterSentiment(s)}
              className={`px-3 py-1.5 rounded-lg transition-all font-semibold ${
                filterSentiment === s
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* News Stream Cards */}
      <div className="space-y-4">
        {filtered.map((item) => {
          const isExpanded = expandedId === item.id;
          const isBull = item.sentiment === 'Bullish';
          const isBear = item.sentiment === 'Bearish';

          return (
            <div
              key={item.id}
              className="bg-[#0b0f19] border border-slate-800 hover:border-slate-700 rounded-xl p-5 shadow-lg transition"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1">
                  {/* Meta Bar */}
                  <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono text-slate-400 mb-2">
                    <span className="text-slate-200 font-bold">{item.source}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-slate-500">
                      <Clock className="w-3 h-3" /> {item.timeAgo}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-amber-400">
                      <Flame className="w-3 h-3" /> Impact: {item.impactScore}/10
                    </span>

                    {/* Sentiment Badge */}
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ml-auto sm:ml-0 ${
                      isBull ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                      isBear ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' :
                      'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    }`}>
                      {isBull ? <TrendingUp className="w-3 h-3" /> : isBear ? <TrendingDown className="w-3 h-3" /> : null}
                      {item.sentiment}
                    </span>
                  </div>

                  {/* Headline */}
                  <h4
                    onClick={() => toggleExpand(item.id)}
                    className="text-base font-bold text-white hover:text-blue-400 transition cursor-pointer leading-snug"
                  >
                    {item.title}
                  </h4>

                  {/* Summary */}
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                    {item.summary}
                  </p>

                  {/* Related Tickers */}
                  <div className="flex flex-wrap items-center gap-2 mt-3 pt-2">
                    <span className="text-[10px] font-mono text-slate-500 uppercase">Impacted Assets:</span>
                    {item.tickers.map((sym) => (
                      <div key={sym} className="flex items-center gap-1">
                        <button
                          onClick={() => onSelectTicker(sym)}
                          className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-800 text-xs font-mono font-bold transition"
                        >
                          {sym}
                        </button>
                        <button
                          onClick={() => onAnalyzeTicker(sym)}
                          title={`Analyze ${sym} with Gemini`}
                          className="p-1 rounded bg-blue-500/10 hover:bg-blue-600 text-blue-400 hover:text-white transition"
                        >
                          <Sparkles className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Expand Toggle */}
                <button
                  onClick={() => toggleExpand(item.id)}
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition shrink-0"
                >
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              {/* Collapsible AI Key Takeaways */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-slate-800/80 bg-slate-950/50 p-4 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5" /> Gemini Key News Takeaways
                  </div>
                  <div className="space-y-1.5 pt-1">
                    {item.keyPoints.map((pt, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                        <span className="text-cyan-500 font-bold mt-0.5">•</span>
                        <span>{pt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
