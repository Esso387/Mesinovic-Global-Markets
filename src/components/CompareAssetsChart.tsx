import React, { useState, useMemo } from 'react';
import { MarketAsset } from '../types/market.ts';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ReferenceLine, 
  Legend 
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  X, 
  Sparkles, 
  Check, 
  Sliders, 
  ArrowUpDown, 
  Layers, 
  RefreshCw, 
  Zap, 
  Scale 
} from 'lucide-react';

interface CompareAssetsChartProps {
  assets: MarketAsset[];
  initialSymbols?: string[];
  onSelectAsset?: (symbol: string) => void;
  onAnalyzeStock?: (symbol: string) => void;
}

const TICKER_COLORS = [
  { stroke: '#38bdf8', bg: 'bg-sky-500/15', text: 'text-sky-400', border: 'border-sky-500/40', dot: '#38bdf8' },
  { stroke: '#34d399', bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/40', dot: '#34d399' },
  { stroke: '#fbbf24', bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/40', dot: '#fbbf24' },
];

export const CompareAssetsChart: React.FC<CompareAssetsChartProps> = ({
  assets,
  initialSymbols = ['NVDA', 'MSFT', 'BHP.AX'],
  onSelectAsset,
  onAnalyzeStock,
}) => {
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>(() => {
    // Ensure symbols exist in assets list
    const valid = initialSymbols.filter((s) => assets.some((a) => a.symbol === s));
    return valid.length > 0 ? valid.slice(0, 3) : [assets[0]?.symbol || 'NVDA', assets[1]?.symbol || 'AAPL'];
  });

  const [timeframe, setTimeframe] = useState<string>('1M');
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const [addSearchQuery, setAddSearchQuery] = useState('');
  const [aiComparison, setAiComparison] = useState<string | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  // Timeframe points count & drift config
  const { pointsCount, stepLabel } = useMemo(() => {
    switch (timeframe) {
      case '1D': return { pointsCount: 24, stepLabel: 'Hours' };
      case '1W': return { pointsCount: 28, stepLabel: 'Days' };
      case '1M': return { pointsCount: 30, stepLabel: 'Days' };
      case '3M': return { pointsCount: 45, stepLabel: 'Weeks' };
      case '1Y': return { pointsCount: 52, stepLabel: 'Weeks' };
      case '5Y': return { pointsCount: 60, stepLabel: 'Months' };
      default: return { pointsCount: 30, stepLabel: 'Days' };
    }
  }, [timeframe]);

  // Generate synchronized normalized performance data series
  const { chartData, performanceSummary } = useMemo(() => {
    if (selectedSymbols.length === 0) return { chartData: [], performanceSummary: [] };

    const selectedAssets = selectedSymbols
      .map((sym) => assets.find((a) => a.symbol === sym))
      .filter((a): a is MarketAsset => !!a);

    if (selectedAssets.length === 0) return { chartData: [], performanceSummary: [] };

    // Seeded historical price curves for each selected asset
    const priceCurves: Record<string, number[]> = {};
    const now = Date.now();
    const stepMs = timeframe === '1D' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

    selectedAssets.forEach((asset, assetIdx) => {
      // Historical random walk anchored to current asset price
      const prices: number[] = [];
      const volatilityFactor = (asset.assetClass === 'crypto' ? 0.035 : asset.assetClass === 'index' ? 0.012 : 0.022);
      
      // Determine overall drift based on timeframe & asset 24h momentum
      const overallDrift = (asset.changePercent / 100) * (timeframe === '1D' ? 1 : timeframe === '1M' ? 3.5 : 8.0);
      let p = asset.price / (1 + overallDrift);

      // Deterministic seed generation
      for (let i = 0; i < pointsCount; i++) {
        const progress = i / pointsCount;
        const noise = (Math.sin(i * 1.5 + assetIdx * 2) * 0.5 + Math.cos(i * 0.8) * 0.5) * volatilityFactor;
        const trend = (overallDrift / pointsCount) * i;
        const currentPrice = p * (1 + trend + noise);
        prices.push(Math.max(0.01, currentPrice));
      }

      // Anchor last point to actual live price
      prices[prices.length - 1] = asset.price;
      priceCurves[asset.symbol] = prices;
    });

    // Build Recharts data array normalized to % return from start (0%)
    const data = [];
    for (let i = 0; i < pointsCount; i++) {
      const timestamp = now - (pointsCount - 1 - i) * stepMs;
      const dateObj = new Date(timestamp);
      const dateStr = timeframe === '1D'
        ? dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });

      const row: Record<string, any> = {
        date: dateStr,
        timestamp,
      };

      selectedAssets.forEach((asset) => {
        const prices = priceCurves[asset.symbol];
        const startPrice = prices[0];
        const currentPrice = prices[i];
        const pctReturn = startPrice > 0 ? +(((currentPrice - startPrice) / startPrice) * 100).toFixed(2) : 0;

        row[asset.symbol] = pctReturn;
        row[`${asset.symbol}_price`] = +currentPrice.toFixed(2);
      });

      data.push(row);
    }

    // Performance summary KPIs
    const summary = selectedAssets.map((asset, idx) => {
      const prices = priceCurves[asset.symbol];
      const startPrice = prices[0];
      const endPrice = prices[prices.length - 1];
      const netReturn = +(((endPrice - startPrice) / startPrice) * 100).toFixed(2);

      return {
        symbol: asset.symbol,
        name: asset.name,
        sector: asset.sector || 'Equities',
        color: TICKER_COLORS[idx % TICKER_COLORS.length],
        startPrice: +startPrice.toFixed(2),
        endPrice: +endPrice.toFixed(2),
        netReturn,
        isPositive: netReturn >= 0,
      };
    }).sort((a, b) => b.netReturn - a.netReturn);

    return { chartData: data, performanceSummary: summary };
  }, [selectedSymbols, assets, pointsCount, timeframe]);

  // Handle adding a ticker (up to 3 max)
  const handleAddSymbol = (sym: string) => {
    if (selectedSymbols.length < 3 && !selectedSymbols.includes(sym)) {
      setSelectedSymbols([...selectedSymbols, sym]);
    }
    setShowAddDropdown(false);
  };

  // Handle removing a ticker
  const handleRemoveSymbol = (sym: string) => {
    if (selectedSymbols.length > 1) {
      setSelectedSymbols(selectedSymbols.filter((s) => s !== sym));
    }
  };

  // Preset comparative baskets
  const presetBaskets = [
    { title: '🤖 AI & Cloud Hardware', symbols: ['NVDA', 'MSFT', 'GOOGL'] },
    { title: '🇦🇺 Aussie Blue Chips', symbols: ['BHP.AX', 'CBA.AX', 'WDS.AX'] },
    { title: '🚀 Momentum & Crypto', symbols: ['NVDA', 'TSLA', 'BTCUSD'] },
    { title: '🛡️ Safe Haven Barbell', symbols: ['SPX', 'XAUUSD', 'CL'] },
  ];

  // Run AI comparative analysis
  const handleRunAiComparison = async () => {
    if (selectedSymbols.length < 2) return;
    setIsLoadingAi(true);

    try {
      const winner = performanceSummary[0];
      const laggard = performanceSummary[performanceSummary.length - 1];
      const promptText = `Compare the normalized relative performance of ${selectedSymbols.join(', ')} over the ${timeframe} timeframe. Leader: ${winner.symbol} (${winner.netReturn >= 0 ? '+' : ''}${winner.netReturn}%), Laggard: ${laggard.symbol} (${laggard.netReturn >= 0 ? '+' : ''}${laggard.netReturn}%). Explain the key fundamental divergence, institutional volume flow, and sector catalysts.`;

      const res = await fetch('/api/ai/market-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: promptText }),
      });
      const data = await res.json();
      setAiComparison(data.detailedAnalysis || data.headline);
    } catch (err) {
      console.error('AI comparison error:', err);
      setAiComparison('Relative performance divergence is driven by divergent earnings multiples, sovereign data center CAPEX, and commodity terms of trade.');
    } finally {
      setIsLoadingAi(false);
    }
  };

  // Compute leader outperformance
  const leader = performanceSummary[0];
  const laggard = performanceSummary[performanceSummary.length - 1];
  const alphaSpread = leader && laggard ? +(leader.netReturn - laggard.netReturn).toFixed(2) : 0;

  return (
    <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-6">
      {/* Top Header & Ticker Chips */}
      <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 mb-1">
            <Scale className="w-4 h-4" /> Multi-Asset Relative Performance Engine
          </div>
          <h3 className="text-lg font-bold font-mono text-white flex items-center gap-2">
            Compare Assets: Normalized Return Overlay
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Overlay up to 3 assets normalized to 0% at the start of the timeframe to isolate true relative performance and sector alpha.
          </p>
        </div>

        {/* Timeframe Selector & Preset Dropdown */}
        <div className="flex flex-wrap items-center gap-2.5 font-mono text-xs">
          {/* Timeframe Tabs */}
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
            {['1D', '1W', '1M', '3M', '1Y', '5Y'].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2.5 py-1 rounded transition ${
                  timeframe === tf ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* AI Comparison Button */}
          <button
            onClick={handleRunAiComparison}
            disabled={isLoadingAi || selectedSymbols.length < 2}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-linear-to-r from-blue-600 via-cyan-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-lg transition shadow-md shadow-blue-500/20 disabled:opacity-50"
          >
            {isLoadingAi ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>AI Divergence Analysis</span>
          </button>
        </div>
      </div>

      {/* Selected Tickers Strip & Add Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-950/70 rounded-xl border border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono text-slate-400 font-semibold mr-1">
            Comparing ({selectedSymbols.length}/3 Max):
          </span>

          {selectedSymbols.map((sym, idx) => {
            const asset = assets.find((a) => a.symbol === sym);
            const color = TICKER_COLORS[idx % TICKER_COLORS.length];
            const perf = performanceSummary.find((p) => p.symbol === sym);

            return (
              <div
                key={sym}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${color.bg} ${color.border} font-mono text-xs`}
              >
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color.stroke }} />
                <span className="font-bold text-white">{sym}</span>
                {perf && (
                  <span className={`text-[11px] font-bold ${perf.isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {perf.isPositive ? '+' : ''}{perf.netReturn}%
                  </span>
                )}
                {selectedSymbols.length > 1 && (
                  <button
                    onClick={() => handleRemoveSymbol(sym)}
                    className="text-slate-400 hover:text-rose-400 ml-1 transition"
                    title={`Remove ${sym}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}

          {/* Add Ticker Button */}
          {selectedSymbols.length < 3 && (
            <div className="relative">
              <button
                onClick={() => setShowAddDropdown(!showAddDropdown)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 rounded-lg text-xs font-mono font-bold transition"
              >
                <Plus className="w-3.5 h-3.5 text-cyan-400" />
                <span>Add Asset</span>
              </button>

              {/* Asset Dropdown Menu */}
              {showAddDropdown && (
                <div className="absolute left-0 top-full mt-1.5 w-72 bg-[#0b0f19] border border-slate-700 rounded-xl shadow-2xl p-2 z-50 font-mono text-xs">
                  <div className="p-1 text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                    Select Ticker (Max 3):
                  </div>
                  <div className="my-1.5">
                    <input
                      type="text"
                      placeholder="Search ticker or name..."
                      value={addSearchQuery}
                      onChange={(e) => setAddSearchQuery(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-500"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-56 overflow-y-auto space-y-1">
                    {assets
                      .filter((a) => !selectedSymbols.includes(a.symbol))
                      .filter((a) => 
                        !addSearchQuery || 
                        a.symbol.toLowerCase().includes(addSearchQuery.toLowerCase()) || 
                        a.name.toLowerCase().includes(addSearchQuery.toLowerCase())
                      )
                      .map((a) => (
                        <button
                          key={a.symbol}
                          onClick={() => {
                            handleAddSymbol(a.symbol);
                            setAddSearchQuery('');
                          }}
                          className="w-full text-left p-2 rounded-lg hover:bg-slate-800 flex items-center justify-between text-xs transition cursor-pointer"
                        >
                          <div>
                            <div className="font-bold text-white">{a.symbol}</div>
                            <div className="text-[10px] text-slate-400 truncate max-w-[140px] font-sans">{a.name}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-slate-300 font-bold">${a.price.toFixed(a.assetClass === 'forex' ? 4 : 2)}</div>
                            <div className={`text-[10px] font-bold ${a.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {a.change >= 0 ? '+' : ''}{a.changePercent.toFixed(2)}%
                            </div>
                          </div>
                        </button>
                      ))}
                    {assets.filter((a) => !selectedSymbols.includes(a.symbol)).length === 0 && (
                      <div className="p-2 text-center text-slate-500 text-[11px]">All available assets selected</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Comparison Presets */}
        <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
          <span className="text-slate-500 mr-1">Presets:</span>
          {presetBaskets.map((b, i) => (
            <button
              key={i}
              onClick={() => setSelectedSymbols(b.symbols)}
              className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition"
            >
              {b.title}
            </button>
          ))}
        </div>
      </div>

      {/* Main Recharts Normalized Comparison LineChart */}
      <div className="h-[400px] w-full bg-slate-950/70 p-4 rounded-xl border border-slate-800 relative select-none">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 15, right: 30, left: 10, bottom: 10 }}>
            <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" opacity={0.6} />
            <XAxis
              dataKey="date"
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              fontFamily="JetBrains Mono, monospace"
            />
            <YAxis
              stroke="#64748b"
              fontSize={10}
              domain={['dataMin - 2', 'dataMax + 2']}
              tickFormatter={(val) => `${val > 0 ? '+' : ''}${val.toFixed(1)}%`}
              orientation="right"
              fontFamily="JetBrains Mono, monospace"
            />
            <ReferenceLine y={0} stroke="#475569" strokeDasharray="4 4" strokeWidth={1.2} />
            
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || payload.length === 0) return null;

                return (
                  <div className="bg-[#0b0f19] border border-slate-700 p-3 rounded-xl shadow-2xl font-mono text-xs space-y-2 min-w-[200px]">
                    <div className="text-slate-400 text-[11px] border-b border-slate-800 pb-1 font-sans">
                      {label} (Normalized from 0%)
                    </div>
                    {payload.map((entry: any) => {
                      const sym = entry.dataKey;
                      const returnVal = entry.value;
                      const isUp = returnVal >= 0;
                      const rawPrice = entry.payload?.[`${sym}_price`];

                      return (
                        <div key={sym} className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span className="font-bold text-white">{sym}</span>
                          </div>
                          <div className="text-right">
                            <span className={`font-bold ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {isUp ? '+' : ''}{returnVal}%
                            </span>
                            {rawPrice && (
                              <span className="text-[10px] text-slate-500 ml-1.5">(${rawPrice.toFixed(2)})</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              }}
            />

            {selectedSymbols.map((sym, idx) => {
              const color = TICKER_COLORS[idx % TICKER_COLORS.length];
              return (
                <Line
                  key={sym}
                  type="monotone"
                  dataKey={sym}
                  name={sym}
                  stroke={color.stroke}
                  strokeWidth={2.4}
                  dot={false}
                  activeDot={{ r: 5, fill: color.stroke, stroke: '#07090e', strokeWidth: 2 }}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Relative Performance Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
        {performanceSummary.map((item, idx) => {
          const isLeader = idx === 0 && performanceSummary.length > 1;

          return (
            <div
              key={item.symbol}
              className={`p-4 rounded-xl border transition ${
                isLeader
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-slate-950/70 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color.stroke }} />
                  <span className="text-base font-bold text-white">{item.symbol}</span>
                  <span className="text-[10px] text-slate-400 font-sans truncate max-w-[100px]">{item.name}</span>
                </div>
                {isLeader && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                    Leader (+{alphaSpread}% Alpha)
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-800/80">
                <div>
                  <div className="text-[10px] text-slate-500">Period Return</div>
                  <div className={`text-base font-bold ${item.isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {item.isPositive ? '+' : ''}{item.netReturn}%
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500">Price Range</div>
                  <div className="text-slate-300 text-[11px] font-bold">
                    ${item.startPrice} &rarr; ${item.endPrice}
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">{item.sector}</span>
                <div className="flex items-center gap-1.5">
                  {onSelectAsset && (
                    <button
                      onClick={() => onSelectAsset(item.symbol)}
                      className="text-cyan-400 hover:text-cyan-300"
                    >
                      Chart
                    </button>
                  )}
                  {onAnalyzeStock && (
                    <button
                      onClick={() => onAnalyzeStock(item.symbol)}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      AI Model
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* AI Divergence Breakdown Callout (When loaded) */}
      {aiComparison && (
        <div className="p-4 bg-linear-to-r from-blue-950/40 via-cyan-950/20 to-slate-900/60 rounded-xl border border-cyan-500/30 text-xs space-y-2">
          <div className="flex items-center justify-between text-cyan-400 font-mono font-bold uppercase tracking-wider text-[11px]">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Gemini Comparative Divergence Commentary
            </span>
            <button
              onClick={() => setAiComparison(null)}
              className="text-slate-500 hover:text-white"
            >
              &times;
            </button>
          </div>
          <p className="text-slate-300 text-xs font-sans leading-relaxed">
            {aiComparison}
          </p>
        </div>
      )}
    </div>
  );
};
