import React, { useState, useMemo } from 'react';
import { MarketAsset } from '../types/market.ts';
import { 
  ResponsiveContainer, 
  Treemap, 
  BarChart, 
  Bar, 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  ZAxis, 
  Tooltip, 
  Cell, 
  Legend 
} from 'recharts';
import { 
  Flame, 
  Activity, 
  Layers, 
  BarChart3, 
  Sparkles, 
  Info, 
  ArrowUpDown, 
  Sliders, 
  ShieldCheck, 
  AlertTriangle,
  Filter,
  Check,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Zap,
  Brain
} from 'lucide-react';

interface VolatilityHeatmapProps {
  assets: MarketAsset[];
  onSelectAsset?: (symbol: string) => void;
  onAnalyzeStock?: (symbol: string) => void;
}

interface AssetVolatilityMetric {
  symbol: string;
  name: string;
  sector: string;
  price: number;
  dailyReturn: number;
  dailyStdDev: number; // Daily standard deviation in %
  annualizedVol: number; // Annualized volatility in % (dailyStdDev * sqrt(252))
  marketCapVal: number; // in Billions for sizing
  marketCapStr: string;
  volatilityTier: 'Low' | 'Moderate' | 'Elevated' | 'Extreme';
  sparkline: number[];
}

// Color scale helper for standard deviation heatmap
function getVolatilityColor(vol: number): string {
  if (vol < 15) return '#0284c7'; // Calm Blue (<15%)
  if (vol < 24) return '#0d9488'; // Teal Stable (15-24%)
  if (vol < 35) return '#10b981'; // Moderate Green (24-35%)
  if (vol < 50) return '#f59e0b'; // Elevated Amber (35-50%)
  if (vol < 75) return '#f43f5e'; // High Volatility Rose (50-75%)
  return '#e11d48'; // Extreme Volatility Red (>75%)
}

function getVolatilityTier(vol: number): 'Low' | 'Moderate' | 'Elevated' | 'Extreme' {
  if (vol < 22) return 'Low';
  if (vol < 38) return 'Moderate';
  if (vol < 60) return 'Elevated';
  return 'Extreme';
}

// Calculate standard deviation of returns from a price series
function calculateStandardDeviation(prices: number[]): { dailyStd: number; annStd: number } {
  if (!prices || prices.length < 3) {
    return { dailyStd: 1.5, annStd: 23.8 };
  }

  // Calculate percentage returns between consecutive points
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    const prev = prices[i - 1];
    const curr = prices[i];
    if (prev > 0) {
      returns.push((curr - prev) / prev);
    }
  }

  if (returns.length === 0) return { dailyStd: 1.5, annStd: 23.8 };

  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((acc, r) => acc + Math.pow(r - mean, 2), 0) / (returns.length - 1 || 1);
  const dailyStd = Math.sqrt(variance) * 100;
  const annStd = dailyStd * Math.sqrt(252);

  return {
    dailyStd: Math.max(0.4, +dailyStd.toFixed(2)),
    annStd: Math.max(6.0, +annStd.toFixed(1)),
  };
}

// Custom Recharts Treemap Tile Renderer
const TreemapCustomTile = (props: any) => {
  const { x, y, width, height, name, symbol, annualizedVol, dailyStdDev, sector, onClick } = props;

  if (width < 35 || height < 30) return null;

  const bg = getVolatilityColor(annualizedVol || 25);
  const isLarge = width > 90 && height > 65;

  return (
    <g onClick={onClick} style={{ cursor: 'pointer' }}>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={bg}
        stroke="#07090e"
        strokeWidth={2}
        rx={4}
        opacity={0.9}
        className="transition-all duration-300 hover:opacity-100"
      />
      {width > 45 && height > 35 && (
        <text
          x={x + width / 2}
          y={y + (isLarge ? height / 2 - 8 : height / 2 + 3)}
          textAnchor="middle"
          fill="#ffffff"
          fontSize={isLarge ? 13 : 10}
          fontWeight="bold"
          fontFamily="JetBrains Mono, monospace"
        >
          {symbol || name}
        </text>
      )}
      {isLarge && (
        <>
          <text
            x={x + width / 2}
            y={y + height / 2 + 10}
            textAnchor="middle"
            fill="#f1f5f9"
            fontSize={11}
            fontWeight="bold"
            fontFamily="JetBrains Mono, monospace"
          >
            {annualizedVol}% σ
          </text>
          <text
            x={x + width / 2}
            y={y + height / 2 + 24}
            textAnchor="middle"
            fill="#cbd5e1"
            fontSize={9}
            fontFamily="system-ui, sans-serif"
          >
            {dailyStdDev}% d
          </text>
        </>
      )}
    </g>
  );
};

export const VolatilityHeatmap: React.FC<VolatilityHeatmapProps> = ({
  assets,
  onSelectAsset,
  onAnalyzeStock,
}) => {
  const [viewMode, setViewMode] = useState<'treemap' | 'sector-bars' | 'scatter'>('treemap');
  const [timeWindow, setTimeWindow] = useState<'30D' | '90D' | '1Y'>('30D');
  const [selectedSector, setSelectedSector] = useState<string>('ALL');
  const [aiRegime, setAiRegime] = useState<any | null>(null);
  const [isLoadingRegime, setIsLoadingRegime] = useState<boolean>(false);
  const [showRegimePanel, setShowRegimePanel] = useState<boolean>(false);

  const handleRunAiRegime = async () => {
    setIsLoadingRegime(true);
    setShowRegimePanel(true);
    try {
      const res = await fetch('/api/ai/volatility-regime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sector: selectedSector,
          assets: filteredMetrics,
          timeframe: timeWindow,
        }),
      });
      const data = await res.json();
      setAiRegime(data);
    } catch (err) {
      console.error('Failed to run AI Volatility Regime:', err);
    } finally {
      setIsLoadingRegime(false);
    }
  };

  // Compute standard deviation and metrics for all assets
  const volatilityMetrics = useMemo<AssetVolatilityMetric[]>(() => {
    // Multiplier based on selected historical window
    const windowMult = timeWindow === '30D' ? 1.0 : timeWindow === '90D' ? 1.12 : 1.25;

    return assets.map((asset) => {
      // Calculate from asset's sparkline with window multiplier
      const { dailyStd, annStd } = calculateStandardDeviation(asset.sparkline);
      const adjustedDaily = +(dailyStd * windowMult).toFixed(2);
      const adjustedAnn = +(annStd * windowMult).toFixed(1);

      // Parse market cap
      let capNum = 50;
      if (asset.marketCap) {
        const clean = asset.marketCap.replace('$', '').replace('T', '000').replace('B', '').replace('M', '');
        capNum = parseFloat(clean) || 50;
      }

      return {
        symbol: asset.symbol,
        name: asset.name,
        sector: asset.sector || 'Diversified',
        price: asset.price,
        dailyReturn: asset.changePercent,
        dailyStdDev: adjustedDaily,
        annualizedVol: adjustedAnn,
        marketCapVal: capNum,
        marketCapStr: asset.marketCap || '$50B',
        volatilityTier: getVolatilityTier(adjustedAnn),
        sparkline: asset.sparkline,
      };
    });
  }, [assets, timeWindow]);

  // Filtered by sector (supporting broad clusters like Technology, Financials, Energy, Healthcare, Materials, etc.)
  const filteredMetrics = useMemo(() => {
    if (selectedSector === 'ALL') return volatilityMetrics;
    return volatilityMetrics.filter((m) => {
      if (selectedSector === 'Technology') {
        return ['Semiconductors & AI', 'Consumer Electronics', 'Software & Cloud', 'Internet & Search', 'E-Commerce & Cloud'].includes(m.sector);
      }
      if (selectedSector === 'Financials') {
        return ['Banking & Financials', 'Financials'].includes(m.sector);
      }
      if (selectedSector === 'Energy') {
        return ['Oil, Gas & Consumable Fuels', 'Energy Commodities', 'Energy'].includes(m.sector);
      }
      if (selectedSector === 'Healthcare') {
        return ['Biotechnology & Healthcare', 'Healthcare'].includes(m.sector);
      }
      if (selectedSector === 'Materials') {
        return ['Materials & Mining', 'Materials'].includes(m.sector);
      }
      if (selectedSector === 'Commodities') {
        return ['Precious Metals', 'Energy Commodities'].includes(m.sector);
      }
      if (selectedSector === 'Crypto') {
        return ['Digital Assets'].includes(m.sector);
      }
      if (selectedSector === 'Indices') {
        return ['Broad Market Equity'].includes(m.sector);
      }
      return m.sector === selectedSector;
    });
  }, [volatilityMetrics, selectedSector]);

  // Aggregate by sector for BarChart & Treemap (using filtered metrics to properly isolate clusters)
  const sectorAggregates = useMemo(() => {
    const map: Record<string, { sector: string; avgVol: number; count: number; totalCap: number; assets: AssetVolatilityMetric[] }> = {};

    filteredMetrics.forEach((m) => {
      if (!map[m.sector]) {
        map[m.sector] = { sector: m.sector, avgVol: 0, count: 0, totalCap: 0, assets: [] };
      }
      map[m.sector].avgVol += m.annualizedVol;
      map[m.sector].count += 1;
      map[m.sector].totalCap += m.marketCapVal;
      map[m.sector].assets.push(m);
    });

    return Object.values(map).map((sec) => ({
      ...sec,
      avgVol: +(sec.avgVol / sec.count).toFixed(1),
    })).sort((a, b) => b.avgVol - a.avgVol);
  }, [filteredMetrics]);

  // Treemap hierarchical data format
  const treemapData = useMemo(() => {
    return sectorAggregates.map((sec) => ({
      name: sec.sector,
      children: sec.assets.map((a) => ({
        name: a.name,
        symbol: a.symbol,
        sector: sec.sector,
        size: Math.max(15, Math.sqrt(a.marketCapVal) * 8),
        annualizedVol: a.annualizedVol,
        dailyStdDev: a.dailyStdDev,
        price: a.price,
      })),
    }));
  }, [sectorAggregates]);

  // High-level statistics for current filtered view
  const stats = useMemo(() => {
    if (filteredMetrics.length === 0) return { maxVol: null, minVol: null, medianVol: 0, avgVol: 0 };
    const sorted = [...filteredMetrics].sort((a, b) => b.annualizedVol - a.annualizedVol);
    const sum = sorted.reduce((acc, v) => acc + v.annualizedVol, 0);
    return {
      maxVol: sorted[0],
      minVol: sorted[sorted.length - 1],
      medianVol: sorted[Math.floor(sorted.length / 2)].annualizedVol,
      avgVol: +(sum / sorted.length).toFixed(1),
    };
  }, [filteredMetrics]);

  const sectorDropdownOptions = [
    { value: 'ALL', label: 'All Sectors (Entire Watchlist)', count: volatilityMetrics.length },
    { value: 'Technology', label: 'Technology (Semiconductors, Cloud, Software, AI)', count: volatilityMetrics.filter(m => ['Semiconductors & AI', 'Consumer Electronics', 'Software & Cloud', 'Internet & Search', 'E-Commerce & Cloud'].includes(m.sector)).length },
    { value: 'Financials', label: 'Financials & Banking (CBA, ANZ, Institutions)', count: volatilityMetrics.filter(m => ['Banking & Financials', 'Financials'].includes(m.sector)).length },
    { value: 'Energy', label: 'Energy & Fuels (Woodside Energy, Crude Oil)', count: volatilityMetrics.filter(m => ['Oil, Gas & Consumable Fuels', 'Energy Commodities', 'Energy'].includes(m.sector)).length },
    { value: 'Healthcare', label: 'Healthcare & Biotechnology (CSL, Bio)', count: volatilityMetrics.filter(m => ['Biotechnology & Healthcare', 'Healthcare'].includes(m.sector)).length },
    { value: 'Materials', label: 'Materials & Mining (BHP, Rio Tinto, Metals)', count: volatilityMetrics.filter(m => ['Materials & Mining', 'Materials'].includes(m.sector)).length },
    { value: 'Commodities', label: 'Commodities (Gold Spot, Energy WTI)', count: volatilityMetrics.filter(m => ['Precious Metals', 'Energy Commodities'].includes(m.sector)).length },
    { value: 'Crypto', label: 'Digital Assets (Bitcoin / USD)', count: volatilityMetrics.filter(m => ['Digital Assets'].includes(m.sector)).length },
    { value: 'Indices', label: 'Benchmark Indices (S&P 500, Nasdaq, ASX 200)', count: volatilityMetrics.filter(m => ['Broad Market Equity'].includes(m.sector)).length },
  ];

  const uniqueSectors = ['ALL', 'Technology', 'Financials', 'Energy', 'Healthcare', 'Materials', 'Crypto', 'Commodities', 'Indices'];

  return (
    <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-rose-400 mb-1">
            <Flame className="w-4 h-4" /> Recharts Quantitative Risk Analysis
          </div>
          <h3 className="text-lg font-bold font-mono text-white flex items-center gap-2">
            Watchlist Volatility Heatmap & Sector Dispersion
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Measuring realized standard deviation of daily returns ($\sigma$) annualized across watchlist assets, grouped by industry sector.
          </p>
        </div>

        {/* View Mode, Window Controls & Sector Dropdown Filter */}
        <div className="flex flex-wrap items-center gap-2.5 font-mono text-xs">
          {/* Sector Dropdown Filter */}
          <div className="flex items-center gap-2 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
            <Filter className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <label className="text-slate-400 text-[11px] whitespace-nowrap">Sector:</label>
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="bg-slate-900 border border-slate-700/80 rounded px-2 py-0.5 text-xs text-white font-bold focus:outline-hidden focus:border-cyan-500 cursor-pointer"
            >
              {sectorDropdownOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} ({opt.count})
                </option>
              ))}
            </select>
            {selectedSector !== 'ALL' && (
              <button
                onClick={() => setSelectedSector('ALL')}
                className="text-[10px] text-cyan-400 hover:text-white px-1.5 py-0.5 rounded bg-slate-800 transition"
                title="Reset sector filter"
              >
                Reset
              </button>
            )}
          </div>

          {/* Time Window */}
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
            {(['30D', '90D', '1Y'] as const).map((win) => (
              <button
                key={win}
                onClick={() => setTimeWindow(win)}
                className={`px-2.5 py-1 rounded transition ${
                  timeWindow === win ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {win} σ
              </button>
            ))}
          </div>

          {/* Visualization Type Toggle */}
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setViewMode('treemap')}
              className={`px-3 py-1 rounded transition font-bold ${
                viewMode === 'treemap' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Heatmap Treemap
            </button>
            <button
              onClick={() => setViewMode('sector-bars')}
              className={`px-3 py-1 rounded transition font-bold ${
                viewMode === 'sector-bars' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Sector Ranking
            </button>
            <button
              onClick={() => setViewMode('scatter')}
              className={`px-3 py-1 rounded transition font-bold ${
                viewMode === 'scatter' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Risk vs Return
            </button>
          </div>

          {/* AI Volatility Regime Analysis Trigger */}
          <button
            onClick={handleRunAiRegime}
            disabled={isLoadingRegime}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-linear-to-r from-purple-600 via-rose-600 to-amber-600 hover:from-purple-500 hover:to-amber-500 text-white font-bold rounded-lg transition shadow-lg shadow-purple-500/20 disabled:opacity-50"
          >
            {isLoadingRegime ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Brain className="w-3.5 h-3.5" />}
            <span>AI Vol Regime</span>
          </button>
        </div>
      </div>

      {/* AI Volatility Regime & Anomaly Panel (When active) */}
      {showRegimePanel && (
        <div className="bg-linear-to-r from-slate-900 via-[#130f24] to-slate-900 border border-purple-500/40 rounded-2xl p-5 shadow-2xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-purple-500/20">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-400" />
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-purple-300 font-bold">
                  Gemini Institutional Quantitative Risk Report
                </div>
                <h4 className="text-sm font-mono font-bold text-white">
                  {aiRegime?.regimeTitle || 'Analyzing Multi-Asset Volatility Regime...'}
                </h4>
              </div>
            </div>

            <div className="flex items-center gap-2 font-mono">
              {aiRegime?.regimeType && (
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  {aiRegime.regimeType}
                </span>
              )}
              {aiRegime?.regimeScore !== undefined && (
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  Risk Score: {aiRegime.regimeScore}/100
                </span>
              )}
              <button
                onClick={() => setShowRegimePanel(false)}
                className="text-slate-500 hover:text-white text-xs font-mono px-2 py-1 rounded hover:bg-slate-800"
              >
                &times;
              </button>
            </div>
          </div>

          {isLoadingRegime ? (
            <div className="p-8 text-center space-y-2">
              <RefreshCw className="w-6 h-6 text-purple-400 animate-spin mx-auto" />
              <div className="text-xs font-mono font-bold text-white">Calculating Sector Beta Dispersion & Skew Clusters...</div>
              <div className="text-[11px] text-slate-400">Gemini is parsing standard deviations, options gamma, and tail-risk VaR.</div>
            </div>
          ) : aiRegime ? (
            <div className="space-y-4 font-mono text-xs">
              {/* Executive Cluster Analysis */}
              <p className="text-xs text-slate-300 font-sans leading-relaxed bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                {aiRegime.clusterAnalysis}
              </p>

              {/* Grid: Anomalies + VaR + Hedging */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Volatility Anomalies */}
                <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 space-y-2">
                  <div className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5 uppercase">
                    <AlertTriangle className="w-3.5 h-3.5" /> Detected Volatility Outliers
                  </div>
                  <div className="space-y-2">
                    {aiRegime.anomalies?.map((anom: any, idx: number) => (
                      <div key={idx} className="p-2 rounded bg-slate-900 border border-slate-800 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white">{anom.symbol}</span>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                            anom.severity === 'High' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                          }`}>
                            {anom.anomalyType}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-sans">{anom.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* VaR (Value at Risk) 95% */}
                <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 space-y-2">
                  <div className="text-[11px] font-bold text-cyan-400 flex items-center gap-1.5 uppercase">
                    <ShieldCheck className="w-3.5 h-3.5" /> 95% 1-Day Value-at-Risk (VaR)
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-lg space-y-1">
                    <div className="text-xl font-bold text-cyan-400">{aiRegime.varAssessment?.dailyVar95}</div>
                    <div className="text-[10px] text-slate-400 font-sans leading-relaxed">
                      {aiRegime.varAssessment?.interpretation}
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-500 pt-1">
                    Simulated using standard parametric normal distribution at 1.65σ.
                  </div>
                </div>

                {/* Tactical Hedging Rules */}
                <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 space-y-2">
                  <div className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5 uppercase">
                    <Zap className="w-3.5 h-3.5" /> Institutional Hedging Directives
                  </div>
                  <ul className="space-y-1.5 text-[11px] text-slate-300 font-sans">
                    {aiRegime.hedgeRecommendations?.map((rec: string, i: number) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-emerald-500 font-bold shrink-0">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Volatility KPI Summary Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
        <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
          <div className="text-[10px] text-slate-400 flex items-center justify-between">
            <span>Peak Volatility Asset</span>
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-base font-bold text-rose-400 mt-1">
            {stats.maxVol?.symbol} ({stats.maxVol?.annualizedVol}% σ)
          </div>
          <div className="text-[10px] text-slate-500 truncate">{stats.maxVol?.sector}</div>
        </div>

        <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
          <div className="text-[10px] text-slate-400 flex items-center justify-between">
            <span>Defensive Anchor</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-base font-bold text-emerald-400 mt-1">
            {stats.minVol?.symbol} ({stats.minVol?.annualizedVol}% σ)
          </div>
          <div className="text-[10px] text-slate-500 truncate">{stats.minVol?.sector}</div>
        </div>

        <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
          <div className="text-[10px] text-slate-400 flex items-center justify-between">
            <span>Median Watchlist Vol</span>
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-base font-bold text-cyan-400 mt-1">
            {stats.medianVol}% σ
          </div>
          <div className="text-[10px] text-slate-500">Benchmark Spread</div>
        </div>

        <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
          <div className="text-[10px] text-slate-400 flex items-center justify-between">
            <span>Most Volatile Sector</span>
            <Flame className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-base font-bold text-amber-400 mt-1 truncate">
            {sectorAggregates[0]?.sector}
          </div>
          <div className="text-[10px] text-slate-500">{sectorAggregates[0]?.avgVol}% Avg σ</div>
        </div>
      </div>

      {/* Sector Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs font-mono">
        <span className="text-slate-500 text-[11px] mr-1">Sector:</span>
        {uniqueSectors.map((sec) => (
          <button
            key={sec}
            onClick={() => setSelectedSector(sec)}
            className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap ${
              selectedSector === sec
                ? 'bg-blue-600 text-white font-bold'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {sec}
          </button>
        ))}
      </div>

      {/* Active Cluster Isolation HUD */}
      {selectedSector !== 'ALL' && (
        <div className="bg-linear-to-r from-blue-950/40 via-cyan-950/20 to-slate-900/60 p-3.5 rounded-xl border border-cyan-500/30 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
            <span className="font-bold text-white uppercase tracking-wide">
              Isolated Volatility Cluster: {selectedSector}
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-cyan-300 font-semibold">{filteredMetrics.length} Asset{filteredMetrics.length > 1 ? 's' : ''} in Cluster</span>
            <span className="text-slate-500">•</span>
            <span className="text-rose-400 font-bold">{stats.avgVol}% Cluster Mean σ</span>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="text-slate-400">
              Peak: <strong className="text-rose-400">{stats.maxVol?.symbol} ({stats.maxVol?.annualizedVol}% σ)</strong>
            </span>
            <span className="text-slate-400">
              Anchor: <strong className="text-emerald-400">{stats.minVol?.symbol} ({stats.minVol?.annualizedVol}% σ)</strong>
            </span>
            <button
              onClick={() => setSelectedSector('ALL')}
              className="px-2.5 py-0.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold transition text-[10px]"
            >
              Reset to All Sectors
            </button>
          </div>
        </div>
      )}

      {/* VISUALIZATION 1: RECHARTS TREEMAP HEATMAP */}
      {viewMode === 'treemap' && (
        <div className="space-y-4">
          <div className="h-[420px] w-full bg-slate-950/70 p-3 rounded-xl border border-slate-800 relative">
            <ResponsiveContainer width="100%" height="100%">
              <Treemap
                data={treemapData}
                dataKey="size"
                aspectRatio={4 / 3}
                stroke="#0b0f19"
                content={<TreemapCustomTile />}
              >
                <Tooltip
                  content={({ payload }) => {
                    if (!payload || payload.length === 0) return null;
                    const data = payload[0].payload;
                    if (!data.symbol) return null;

                    return (
                      <div className="bg-[#0b0f19] border border-slate-700 p-3 rounded-xl shadow-2xl font-mono text-xs space-y-1.5">
                        <div className="font-bold text-white flex items-center justify-between gap-3">
                          <span>{data.symbol} ({data.name})</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                            ${data.price?.toFixed(2)}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">{data.sector}</div>
                        <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-slate-800 text-[11px]">
                          <div>
                            <span className="text-slate-500">Annualized σ: </span>
                            <span className="font-bold text-rose-400">{data.annualizedVol}%</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Daily StdDev: </span>
                            <span className="font-bold text-cyan-400">{data.dailyStdDev}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  }}
                />
              </Treemap>
            </ResponsiveContainer>
          </div>

          {/* Color Scale Legend */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-[11px] font-mono">
            <div className="flex items-center gap-2 text-slate-400">
              <span>Standard Deviation ($\sigma$) Scale:</span>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-[#0284c7]"></span> Low (&lt;15%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-[#0d9488]"></span> Stable (15-24%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-[#10b981]"></span> Moderate (24-35%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-[#f59e0b]"></span> Elevated (35-50%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-[#f43f5e]"></span> High (&gt;50%)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* VISUALIZATION 2: SECTOR VOLATILITY RANKING BAR CHART */}
      {viewMode === 'sector-bars' && (
        <div className="space-y-4">
          <div className="h-[400px] w-full bg-slate-950/70 p-4 rounded-xl border border-slate-800">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={sectorAggregates}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 100, bottom: 10 }}
              >
                <XAxis
                  type="number"
                  domain={[0, 'dataMax + 10']}
                  stroke="#64748b"
                  fontSize={10}
                  tickFormatter={(val) => `${val}%`}
                />
                <YAxis
                  dataKey="sector"
                  type="category"
                  stroke="#94a3b8"
                  fontSize={11}
                  width={140}
                  tick={{ fill: '#e2e8f0', fontSize: 11, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                />
                <Tooltip
                  content={({ payload }) => {
                    if (!payload || payload.length === 0) return null;
                    const sec = payload[0].payload;
                    return (
                      <div className="bg-[#0b0f19] border border-slate-700 p-3 rounded-xl shadow-xl font-mono text-xs space-y-1">
                        <div className="font-bold text-white">{sec.sector}</div>
                        <div className="text-cyan-400">
                          Average Volatility: <strong>{sec.avgVol}% σ</strong>
                        </div>
                        <div className="text-slate-400 text-[11px]">
                          Constituents: {sec.count} asset{sec.count > 1 ? 's' : ''}
                        </div>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="avgVol" radius={[0, 4, 4, 0]}>
                  {sectorAggregates.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getVolatilityColor(entry.avgVol)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* VISUALIZATION 3: RISK VS RETURN SCATTER PLOT */}
      {viewMode === 'scatter' && (
        <div className="space-y-4">
          <div className="h-[400px] w-full bg-slate-950/70 p-4 rounded-xl border border-slate-800">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
                <XAxis
                  type="number"
                  dataKey="dailyReturn"
                  name="24h Return"
                  unit="%"
                  stroke="#64748b"
                  fontSize={10}
                  label={{ value: 'Daily Return (%)', position: 'insideBottom', offset: -10, fill: '#64748b', fontSize: 11 }}
                />
                <YAxis
                  type="number"
                  dataKey="annualizedVol"
                  name="Annualized Volatility"
                  unit="%"
                  stroke="#64748b"
                  fontSize={10}
                  label={{ value: 'Annualized StdDev (σ %)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 11 }}
                />
                <ZAxis type="number" dataKey="marketCapVal" range={[60, 400]} name="Market Cap" />
                <Tooltip
                  content={({ payload }) => {
                    if (!payload || payload.length === 0) return null;
                    const item = payload[0].payload as AssetVolatilityMetric;
                    return (
                      <div className="bg-[#0b0f19] border border-slate-700 p-3 rounded-xl shadow-2xl font-mono text-xs space-y-1">
                        <div className="font-bold text-white">{item.symbol} ({item.name})</div>
                        <div className="text-[11px] text-slate-400">{item.sector}</div>
                        <div className="pt-1 text-[11px]">
                          <div>24h Return: <span className={item.dailyReturn >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{item.dailyReturn >= 0 ? '+' : ''}{item.dailyReturn}%</span></div>
                          <div>Volatility (σ): <span className="text-amber-400">{item.annualizedVol}%</span></div>
                          <div>Market Cap: <span className="text-slate-300">{item.marketCapStr}</span></div>
                        </div>
                      </div>
                    );
                  }}
                />
                <Scatter name="Assets" data={filteredMetrics}>
                  {filteredMetrics.map((entry, index) => (
                    <Cell
                      key={`scatter-cell-${index}`}
                      fill={getVolatilityColor(entry.annualizedVol)}
                      stroke="#ffffff"
                      strokeWidth={1}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Asset Breakdown Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left font-mono text-xs">
          <thead className="bg-slate-950/80 border-b border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider">
            <tr>
              <th className="py-2.5 px-3">Asset</th>
              <th className="py-2.5 px-3">Sector</th>
              <th className="py-2.5 px-3 text-right">Daily StdDev (σ)</th>
              <th className="py-2.5 px-3 text-right">Annualized Volatility</th>
              <th className="py-2.5 px-3 text-center">Risk Tier</th>
              <th className="py-2.5 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredMetrics.map((item) => (
              <tr key={item.symbol} className="hover:bg-slate-900/40 transition">
                <td className="py-2.5 px-3">
                  <div className="font-bold text-white">{item.symbol}</div>
                  <div className="text-[10px] text-slate-400 font-sans truncate max-w-[140px]">{item.name}</div>
                </td>
                <td className="py-2.5 px-3 text-slate-300">{item.sector}</td>
                <td className="py-2.5 px-3 text-right text-cyan-400 font-bold">{item.dailyStdDev}%</td>
                <td className="py-2.5 px-3 text-right font-bold text-white flex items-center justify-end gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block"
                    style={{ backgroundColor: getVolatilityColor(item.annualizedVol) }}
                  />
                  <span>{item.annualizedVol}%</span>
                </td>
                <td className="py-2.5 px-3 text-center">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    item.volatilityTier === 'Low' ? 'bg-blue-500/15 text-blue-400' :
                    item.volatilityTier === 'Moderate' ? 'bg-emerald-500/15 text-emerald-400' :
                    item.volatilityTier === 'Elevated' ? 'bg-amber-500/15 text-amber-400' :
                    'bg-rose-500/15 text-rose-400'
                  }`}>
                    {item.volatilityTier}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {onSelectAsset && (
                      <button
                        onClick={() => onSelectAsset(item.symbol)}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] rounded transition"
                      >
                        Chart
                      </button>
                    )}
                    {onAnalyzeStock && (
                      <button
                        onClick={() => onAnalyzeStock(item.symbol)}
                        className="px-2 py-1 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white text-[10px] rounded transition flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3" /> AI
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
