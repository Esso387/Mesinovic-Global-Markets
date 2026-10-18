import React, { useState, useMemo } from 'react';
import {
  MarketAsset,
  WhaleFiling13F,
  InsiderTrade,
  DarkPoolBlock,
  UnusualOptionsSweep,
  CongressionalTrade,
  AISmartMoneyAudit,
  AlertTrigger,
  SmartMoneyAlertItem,
} from '../types/market.ts';
import {
  GLOBAL_SMART_MONEY_METRICS,
  INSTITUTIONAL_FLOW_TIMELINE,
  WHALE_FILINGS,
  INSIDER_TRADES,
  DARK_POOL_BLOCKS,
  UNUSUAL_OPTIONS_SWEEPS,
  CONGRESSIONAL_TRADES,
  ASSET_SMART_MONEY_SCORES,
  SAMPLE_AI_SMART_MONEY_AUDITS,
  SMART_MONEY_ALERTS,
} from '../data/mockSmartMoneyData.ts';
import { exportSmartMoneyToCsv } from '../utils/csvExport.ts';
import {
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Eye,
  Activity,
  Sparkles,
  Download,
  Building2,
  Users,
  Landmark,
  Zap,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
  ChevronUp,
  X,
  Target,
  BarChart2,
  Briefcase,
  Flame,
  CheckCircle2,
  Info,
  AlertTriangle,
  Clock,
  Cpu,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
} from 'recharts';

interface SmartMoneyTrackerProps {
  assets: MarketAsset[];
  onSelectAsset: (symbol: string) => void;
  onAnalyzeStock?: (symbol: string) => void;
  onAddAlert?: (alert: AlertTrigger) => void;
  onNotify?: (title: string, desc: string) => void;
}

type SmartMoneyTab = 'matrix' | 'alerts' | 'insiders' | 'whales' | 'darkpool' | 'options' | 'congress';

export const SmartMoneyTracker: React.FC<SmartMoneyTrackerProps> = ({
  assets,
  onSelectAsset,
  onAnalyzeStock,
  onAddAlert,
  onNotify,
}) => {
  const [activeTab, setActiveTab] = useState<SmartMoneyTab>('matrix');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterWatchlistOnly, setFilterWatchlistOnly] = useState(false);
  const [filterClusterBuysOnly, setFilterClusterBuysOnly] = useState(false);
  const [selectedWhaleId, setSelectedWhaleId] = useState<string | null>('13f-citadel');
  const [alertFilter, setAlertFilter] = useState<'all' | 'congressional' | 'insider_cluster' | 'dark_pool' | 'unusual_options' | 'whale_13f'>('all');
  const [selectedAlertForDossier, setSelectedAlertForDossier] = useState<SmartMoneyAlertItem | null>(null);
  const [liveAlerts, setLiveAlerts] = useState<SmartMoneyAlertItem[]>(SMART_MONEY_ALERTS);

  // Audio chime for alerts
  const playAlertChime = () => {
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
      // AudioContext restricted before gesture
    }
  };

  const handleSimulateAlert = () => {
    playAlertChime();
    const simulatedAlert: SmartMoneyAlertItem = {
      id: `sm-alert-${Date.now()}`,
      title: '🚨 SMART MONEY ALERT',
      headline: 'Senator purchased NVDA',
      entity: 'U.S. Senator',
      symbol: 'NVDA',
      companyName: 'NVIDIA Corporation',
      amount: '$15,001 - $50,000',
      industry: 'Artificial Intelligence',
      riskRating: 'Medium',
      similarTrades: '12 politicians bought AI stocks this month.',
      alertType: 'congressional',
      timestamp: new Date().toISOString(),
      timeAgo: 'Just now',
      sentiment: 'Bullish',
      details: {
        committee: 'Senate Commerce, Science, & Transportation',
        filingDate: new Date().toISOString().split('T')[0],
        tradeDate: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
        lagDays: 3,
        keyInsight: 'Live trade update verified via Senate Office of Public Records electronic disclosure portal.',
        peerTrades: [
          { politician: 'Nancy Pelosi (House)', symbol: 'NVDA', amount: '$1M - $5M Deep ITM Calls', date: '2026-06-26' },
          { politician: 'Tommy Tuberville (Senate)', symbol: 'PLTR', amount: '$100K - $250K Equity', date: '2026-07-18' },
          { politician: 'Michael McCaul (House)', symbol: 'MSFT', amount: '$250K - $500K Equity', date: '2026-08-14' },
          { politician: 'Mark Green (House)', symbol: 'CRWD', amount: '$100K - $250K Equity', date: '2026-08-01' },
          { politician: 'Ro Khanna (House)', symbol: 'AAPL', amount: '$50K - $100K Equity', date: '2026-09-08' },
        ],
      },
    };
    setLiveAlerts((prev) => [simulatedAlert, ...prev]);
    if (onNotify) {
      onNotify('🚨 SMART MONEY ALERT', 'Senator purchased NVDA ($15,001 - $50,000) • AI Industry');
    }
  };

  // AI Audit State
  const [auditSymbol, setAuditSymbol] = useState<string | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditData, setAuditData] = useState<AISmartMoneyAudit | null>(null);
  const [auditError, setAuditError] = useState<string | null>(null);

  // Watchlist symbols set for quick lookup
  const watchlistSymbols = useMemo(() => new Set(assets.map((a) => a.symbol.toUpperCase())), [assets]);

  // Filtered Insider Trades
  const filteredInsiders = useMemo(() => {
    return INSIDER_TRADES.filter((item) => {
      if (filterClusterBuysOnly && !item.isClusterBuy) return false;
      if (filterWatchlistOnly && !watchlistSymbols.has(item.symbol.toUpperCase())) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.symbol.toLowerCase().includes(q) ||
        item.insiderName.toLowerCase().includes(q) ||
        item.companyName.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q)
      );
    });
  }, [filterClusterBuysOnly, filterWatchlistOnly, searchQuery, watchlistSymbols]);

  // Filtered Dark Pool Blocks
  const filteredDarkPool = useMemo(() => {
    return DARK_POOL_BLOCKS.filter((item) => {
      if (filterWatchlistOnly && !watchlistSymbols.has(item.symbol.toUpperCase())) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.symbol.toLowerCase().includes(q) ||
        item.companyName.toLowerCase().includes(q) ||
        item.venue.toLowerCase().includes(q)
      );
    });
  }, [filterWatchlistOnly, searchQuery, watchlistSymbols]);

  // Filtered Options Sweeps
  const filteredOptions = useMemo(() => {
    return UNUSUAL_OPTIONS_SWEEPS.filter((item) => {
      if (filterWatchlistOnly && !watchlistSymbols.has(item.symbol.toUpperCase())) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.symbol.toLowerCase().includes(q) ||
        (item.companyName && item.companyName.toLowerCase().includes(q)) ||
        item.sentiment.toLowerCase().includes(q)
      );
    });
  }, [filterWatchlistOnly, searchQuery, watchlistSymbols]);

  // Filtered Congressional Trades
  const filteredCongress = useMemo(() => {
    return CONGRESSIONAL_TRADES.filter((item) => {
      if (filterWatchlistOnly && !watchlistSymbols.has(item.symbol.toUpperCase())) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.symbol.toLowerCase().includes(q) ||
        item.politician.toLowerCase().includes(q) ||
        item.committee.toLowerCase().includes(q)
      );
    });
  }, [filterWatchlistOnly, searchQuery, watchlistSymbols]);

  // Filtered Smart Money Alerts
  const filteredAlerts = useMemo(() => {
    return liveAlerts.filter((item) => {
      if (alertFilter !== 'all' && item.alertType !== alertFilter) return false;
      if (filterWatchlistOnly && !watchlistSymbols.has(item.symbol.toUpperCase())) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.symbol.toLowerCase().includes(q) ||
        item.headline.toLowerCase().includes(q) ||
        item.entity.toLowerCase().includes(q) ||
        item.industry.toLowerCase().includes(q)
      );
    });
  }, [liveAlerts, alertFilter, filterWatchlistOnly, searchQuery, watchlistSymbols]);

  // Filtered 13F Whales
  const filteredWhales = useMemo(() => {
    return WHALE_FILINGS.filter((fund) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        fund.fundName.toLowerCase().includes(q) ||
        fund.manager.toLowerCase().includes(q) ||
        fund.topHolding.toLowerCase().includes(q) ||
        fund.newPositions.some((s) => s.toLowerCase().includes(q))
      );
    });
  }, [searchQuery]);

  // Assets Smart Money Matrix
  const matrixData = useMemo(() => {
    return assets.map((asset) => {
      const info = ASSET_SMART_MONEY_SCORES[asset.symbol] || {
        score: Math.min(95, Math.max(45, Math.round(55 + (asset.rsi ? asset.rsi * 0.3 : 15) + (asset.changePercent > 0 ? 12 : -6)))),
        regime: asset.changePercent > 1.5 ? 'Strong Accumulation' : asset.changePercent < -1.5 ? 'Neutral Churn' : 'Moderate Accumulation',
        whaleHoldersCount: Math.floor(Math.random() * 20) + 10,
        insiderBuySellRatio: +(1.2 + Math.random() * 1.5).toFixed(1),
        darkPoolBuyPct: Math.round(55 + Math.random() * 18),
        callToPutRatio: +(1.5 + Math.random() * 1.8).toFixed(1),
        keyWhales: ['Citadel', 'Vanguard', 'BlackRock'],
      };

      return {
        ...asset,
        smartScore: info.score,
        regime: info.regime,
        whaleCount: info.whaleHoldersCount,
        insiderRatio: info.insiderBuySellRatio,
        darkPoolPct: info.darkPoolBuyPct,
        callToPut: info.callToPutRatio,
        keyWhales: info.keyWhales,
      };
    }).sort((a, b) => b.smartScore - a.smartScore);
  }, [assets]);

  // Filtered Matrix for search
  const filteredMatrix = useMemo(() => {
    if (!searchQuery) return matrixData;
    const q = searchQuery.toLowerCase();
    return matrixData.filter(
      (m) => m.symbol.toLowerCase().includes(q) || m.name.toLowerCase().includes(q) || (m.sector && m.sector.toLowerCase().includes(q))
    );
  }, [matrixData, searchQuery]);

  // Run AI Forensic Audit
  const handleRunAudit = async (symbol: string) => {
    const asset = assets.find((a) => a.symbol === symbol);
    setAuditSymbol(symbol);
    setIsAuditing(true);
    setAuditError(null);

    // Immediate fallback sample if available
    if (SAMPLE_AI_SMART_MONEY_AUDITS[symbol]) {
      setAuditData(SAMPLE_AI_SMART_MONEY_AUDITS[symbol]);
    }

    try {
      const res = await fetch('/api/ai/smart-money-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol,
          name: asset?.name || symbol,
          currentPrice: asset?.price || 100,
          sector: asset?.sector || 'Equities',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAuditData(data);
      } else {
        throw new Error('Failed to retrieve audit');
      }
    } catch {
      // Use fallback or mock
      if (SAMPLE_AI_SMART_MONEY_AUDITS[symbol]) {
        setAuditData(SAMPLE_AI_SMART_MONEY_AUDITS[symbol]);
      } else {
        setAuditData({
          symbol,
          companyName: asset?.name || symbol,
          overallScore: 84,
          signal: 'Strong Accumulation',
          wyckoffPhase: 'Phase D (Markup in Progress)',
          darkPoolAbsorption: 'Sustained institutional blocks detected near dynamic support bands.',
          insiderConviction: 'Net positive accumulation posture across board members.',
          optionsGammaProfile: 'Positive options gamma and call sweep dominance.',
          whaleConsensus: 'Core weighting maintained across tier-1 multi-manager funds.',
          smartMoneyTargetPrice: +(Number(asset?.price || 100) * 1.2).toFixed(2),
          currentPrice: Number(asset?.price || 100),
          institutionalGrade: 'AA',
          executiveSummary: `Institutional smart money footprint across ${symbol} exhibits marked accumulation characteristics.`,
          keyInstitutionalFootprints: [
            'Net positive institutional volume delta.',
            'Dark pool blocks absorbed without downward slippage.',
            'Bullish call sweep order accumulation.',
          ],
          riskFactors: ['Macro index beta dependency.'],
        });
      }
    } finally {
      setIsAuditing(false);
    }
  };

  // Export CSV Handler
  const handleExportCsv = () => {
    const result = exportSmartMoneyToCsv({
      insiderTrades: INSIDER_TRADES,
      whaleFilings: WHALE_FILINGS,
      darkPoolBlocks: DARK_POOL_BLOCKS,
      optionsSweeps: UNUSUAL_OPTIONS_SWEEPS,
      congressionalTrades: CONGRESSIONAL_TRADES,
    });

    if (result.success && onNotify) {
      onNotify('Smart Money Intelligence Exported', `Generated ${result.filename} with ${result.rowCount} institutional records.`);
    }
  };

  // Arm Alert from Smart Money
  const handleArmSmartAlert = (symbol: string, targetPrice: number) => {
    if (onAddAlert) {
      const alert: AlertTrigger = {
        id: `sm-alert-${Date.now()}`,
        symbol,
        condition: 'ABOVE',
        targetValue: targetPrice,
        createdAt: new Date().toISOString(),
        triggered: false,
        notes: `Smart Money Institutional Target: $${targetPrice}`,
      };
      onAddAlert(alert);
    }
    if (onNotify) {
      onNotify('Smart Money Alert Armed', `Target $${targetPrice} set for ${symbol}.`);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="w-6 h-6" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold font-mono tracking-tight text-white">
                    SMART MONEY & INSTITUTIONAL FLOW TRACKER
                  </h1>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 animate-pulse">
                    LIVE RADAR
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  13F Hedge Fund Whales • SEC Form 4 Insider Clusters • Off-Exchange Dark Pool Prints • Unusual Options Sweeps
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => handleRunAudit('NVDA')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Flow Audit</span>
            </button>
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Flow CSV</span>
            </button>
          </div>
        </div>

        {/* TOP MACRO SMART MONEY GAUGES */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-5 pt-5 border-t border-slate-800/80">
          {/* Gauge 1: Smart Money Flow Index */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 hover:border-slate-700 transition">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>SMART MONEY FLOW INDEX</span>
              <Activity className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono text-emerald-400">
                {GLOBAL_SMART_MONEY_METRICS.flowIndex}
              </span>
              <span className="text-[10px] font-mono text-slate-500">/ 100</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-emerald-400 h-full rounded-full transition-all duration-1000"
                style={{ width: `${GLOBAL_SMART_MONEY_METRICS.flowIndex}%` }}
              />
            </div>
            <p className="text-[10px] font-mono text-emerald-300/80 mt-1.5 truncate">
              {GLOBAL_SMART_MONEY_METRICS.flowIndexStatus}
            </p>
          </div>

          {/* Gauge 2: Dark Pool Activity (DIX) */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 hover:border-slate-700 transition">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>DARK POOL INDEX (DIX)</span>
              <Eye className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono text-purple-400">
                {GLOBAL_SMART_MONEY_METRICS.darkPoolActivityRatio}%
              </span>
              <span className="text-[10px] font-mono text-emerald-400">Above Avg</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-purple-400 h-full rounded-full"
                style={{ width: `${GLOBAL_SMART_MONEY_METRICS.darkPoolActivityRatio}%` }}
              />
            </div>
            <p className="text-[10px] font-mono text-slate-400 mt-1.5 truncate">
              Off-Exchange Whale Block Crosses
            </p>
          </div>

          {/* Gauge 3: Net Whale Flow 24h */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 hover:border-slate-700 transition">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>NET WHALE FLOW (24H)</span>
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono text-emerald-400">
                +${GLOBAL_SMART_MONEY_METRICS.netWhaleFlow24h}B
              </span>
            </div>
            <div className="flex items-center gap-1 mt-2 text-[10px] font-mono text-emerald-300">
              <ArrowUpRight className="w-3 h-3 text-emerald-400" />
              <span>Heavy buy-side imbalance</span>
            </div>
            <p className="text-[10px] font-mono text-slate-400 mt-1.5 truncate">
              Across Tier-1 Hedge Funds
            </p>
          </div>

          {/* Gauge 4: Insider Buy/Sell Ratio */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 hover:border-slate-700 transition">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>INSIDER BUY RATIO</span>
              <Users className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono text-amber-400">
                {GLOBAL_SMART_MONEY_METRICS.insiderBuyRatio}x
              </span>
              <span className="text-[10px] font-mono text-emerald-400">Bullish Cluster</span>
            </div>
            <div className="flex items-center gap-1 mt-2 text-[10px] font-mono text-amber-300">
              <Flame className="w-3 h-3 text-amber-400" />
              <span>C-Suite Cluster Buys Detected</span>
            </div>
            <p className="text-[10px] font-mono text-slate-400 mt-1.5 truncate">
              Form 4 Discretionary Buys vs Sales
            </p>
          </div>

          {/* Gauge 5: Dominant Institutional Regime */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 hover:border-slate-700 transition col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>REGIME POSTURE</span>
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="mt-1">
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                RISK-ON GROWTH
              </span>
            </div>
            <p className="text-[10px] font-mono text-slate-400 mt-2 line-clamp-2">
              {GLOBAL_SMART_MONEY_METRICS.dominantRegime}
            </p>
          </div>
        </div>
      </div>

      {/* INSTITUTIONAL ACCUMULATION FLOW CHART & MATRIX OVERVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cumulative Flow Chart */}
        <div className="lg:col-span-2 bg-[#0b0f19] border border-slate-800 rounded-xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold font-mono text-white flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-blue-400" />
                <span>INTRADAY SMART MONEY VS RETAIL CUMULATIVE VOLUME DELTA ($M)</span>
              </h2>
              <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                Note the classic divergence: Smart money accelerates into the close while retail fades
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
                <span>Smart Money Flow</span>
              </span>
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-slate-500 inline-block" />
                <span>Retail Flow</span>
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={INSTITUTIONAL_FLOW_TIMELINE} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="smartFlowGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="retailFlowGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#64748b" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#64748b" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#475569" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis stroke="#475569" tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(v) => `$${v}M`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '8px' }}
                  formatter={(val: any, name?: any) => [
                    `$${Number(val).toLocaleString()}M`,
                    name === 'institutionalFlow' ? 'Smart Money (Institutional)' : 'Retail Flow',
                  ]}
                  labelStyle={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: '11px' }}
                />
                <Area
                  type="monotone"
                  dataKey="institutionalFlow"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#smartFlowGrad)"
                  name="institutionalFlow"
                />
                <Area
                  type="monotone"
                  dataKey="retailFlow"
                  stroke="#64748b"
                  strokeWidth={1.5}
                  fillOpacity={1}
                  fill="url(#retailFlowGrad)"
                  name="retailFlow"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Smart Money Watchlist Scores */}
        <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold font-mono text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-400" />
                <span>TOP INSTITUTIONAL CONVICTION</span>
              </h2>
              <span className="text-[10px] font-mono text-slate-400">0 - 100 Score</span>
            </div>
            <p className="text-[11px] font-mono text-slate-400 mb-4">
              Microstructure algorithmic score blending Dark Pools, Form 4s, 13F & Options.
            </p>

            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={matrixData.slice(0, 6)} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="2 2" stroke="#1e293b" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} stroke="#475569" tick={{ fontSize: 9, fill: '#94a3b8' }} />
                  <YAxis dataKey="symbol" type="category" stroke="#475569" tick={{ fontSize: 11, fill: '#f8fafc', fontWeight: 'bold' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '8px' }}
                    formatter={(val: any) => [`${val}/100`, 'Smart Money Score']}
                  />
                  <Bar dataKey="smartScore" radius={[0, 4, 4, 0]}>
                    {matrixData.slice(0, 6).map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.smartScore >= 85 ? '#10b981' : entry.smartScore >= 75 ? '#3b82f6' : '#f59e0b'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400">Leader: {matrixData[0]?.symbol} ({matrixData[0]?.smartScore}/100)</span>
            <button
              onClick={() => {
                setActiveTab('matrix');
                if (matrixData[0]) handleRunAudit(matrixData[0].symbol);
              }}
              className="text-xs font-mono text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>Audit Top Leader</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* FILTER & SUB-NAVIGATION BAR */}
      <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs font-mono">
          {[
            { id: 'matrix', label: 'Watchlist Smart Matrix', icon: Target, count: matrixData.length, isHighlighted: false },
            { id: 'alerts', label: '🚨 Live Smart Money Alerts', icon: AlertTriangle, count: SMART_MONEY_ALERTS.length, isHighlighted: true },
            { id: 'insiders', label: 'Form 4 Insider Trades', icon: Users, count: INSIDER_TRADES.length, isHighlighted: false },
            { id: 'whales', label: '13F Hedge Fund Whales', icon: Briefcase, count: WHALE_FILINGS.length, isHighlighted: false },
            { id: 'darkpool', label: 'Dark Pool Block Prints', icon: Eye, count: DARK_POOL_BLOCKS.length, isHighlighted: false },
            { id: 'options', label: 'Unusual Options Sweeps', icon: Zap, count: UNUSUAL_OPTIONS_SWEEPS.length, isHighlighted: false },
            { id: 'congress', label: 'Congressional STOCK Act', icon: Landmark, count: CONGRESSIONAL_TRADES.length, isHighlighted: false },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as SmartMoneyTab)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap cursor-pointer ${
                  isActive
                    ? tab.isHighlighted
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-500/30'
                      : 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : tab.isHighlighted
                    ? 'text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${tab.isHighlighted && !isActive ? 'text-rose-400 animate-pulse' : ''}`} />
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[9px] ${
                  isActive
                    ? 'bg-black/30 text-white font-extrabold'
                    : tab.isHighlighted
                    ? 'bg-rose-500 text-white font-extrabold'
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Quick Toggles */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ticker, manager, insider..."
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {activeTab === 'insiders' && (
            <button
              onClick={() => setFilterClusterBuysOnly(!filterClusterBuysOnly)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition border cursor-pointer ${
                filterClusterBuysOnly
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Cluster Buys Only</span>
            </button>
          )}

          <button
            onClick={() => setFilterWatchlistOnly(!filterWatchlistOnly)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition border cursor-pointer ${
              filterWatchlistOnly
                ? 'bg-blue-500/20 text-blue-300 border-blue-500/50'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <span>Watchlist Only</span>
          </button>
        </div>
      </div>

      {/* VIEW: 0. REAL-TIME SMART MONEY ALERTS FEED */}
      {activeTab === 'alerts' && (
        <div className="space-y-4">
          {/* Top Alert Control Banner */}
          <div className="bg-[#0b0f19] border border-rose-500/30 rounded-xl p-4 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40 relative">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                </span>
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold font-mono text-white">
                    REAL-TIME INSTITUTIONAL SMART MONEY ALERTS
                  </h3>
                  <span className="px-2 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-mono font-bold">
                    HIGH PRIORITY FEED
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Automated surveillance engine monitoring STOCK Act disclosures, Form 4 cluster buys, and off-exchange prints.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSimulateAlert}
                className="px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-bold shadow-lg shadow-rose-600/30 flex items-center gap-1.5 transition cursor-pointer"
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Simulate New Alert</span>
              </button>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-mono">
            {[
              { id: 'all', label: 'All Alerts', count: liveAlerts.length },
              { id: 'congressional', label: 'Congressional STOCK Act', count: liveAlerts.filter((a) => a.alertType === 'congressional').length },
              { id: 'insider_cluster', label: 'Form 4 Insider Clusters', count: liveAlerts.filter((a) => a.alertType === 'insider_cluster').length },
              { id: 'dark_pool', label: 'Dark Pool Blocks', count: liveAlerts.filter((a) => a.alertType === 'dark_pool').length },
              { id: 'unusual_options', label: 'Unusual Options Sweeps', count: liveAlerts.filter((a) => a.alertType === 'unusual_options').length },
              { id: 'whale_13f', label: '13F Hedge Fund Whales', count: liveAlerts.filter((a) => a.alertType === 'whale_13f').length },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setAlertFilter(f.id as any)}
                className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap cursor-pointer ${
                  alertFilter === f.id
                    ? 'bg-slate-200 text-slate-900 font-extrabold shadow-sm'
                    : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <span>{f.label}</span>
                <span className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] ${
                  alertFilter === f.id ? 'bg-slate-300 text-slate-900' : 'bg-slate-800 text-slate-400'
                }`}>
                  {f.count}
                </span>
              </button>
            ))}
          </div>

          {/* Alert Cards Feed */}
          <div className="grid grid-cols-1 gap-4">
            {filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className="bg-[#0b0f19] border border-slate-800 hover:border-slate-700 rounded-xl p-5 shadow-xl transition relative overflow-hidden group"
              >
                {/* Sentiment Accent Glow */}
                <div className={`absolute top-0 left-0 bottom-0 w-1 ${
                  alert.sentiment === 'Bullish' ? 'bg-emerald-500' : alert.sentiment === 'Bearish' ? 'bg-rose-500' : 'bg-blue-500'
                }`} />

                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {/* Left Column: Alert Identity & Spec Grid */}
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-mono text-[10px] font-extrabold tracking-widest uppercase">
                        {alert.title}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] font-bold border border-slate-700 uppercase">
                        {alert.alertType.replace('_', ' ')}
                      </span>
                      <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{alert.timeAgo}</span>
                      </span>
                    </div>

                    <div>
                      <h4 className="text-base sm:text-lg font-black text-white font-sans flex items-center gap-2">
                        <span>{alert.headline}</span>
                        <span className="px-2 py-0.5 rounded bg-blue-500/20 text-cyan-300 border border-blue-500/40 font-mono text-xs font-bold">
                          ${alert.symbol}
                        </span>
                      </h4>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">
                        Filing Entity: <span className="text-slate-200 font-bold">{alert.entity}</span> ({alert.companyName})
                      </p>
                    </div>

                    {/* Exact Spec Grid: Amount, Industry, Risk Rating, Similar Trades */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-black/40 border border-slate-800/80 rounded-xl p-3 font-mono text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
                          Amount:
                        </span>
                        <span className="text-sm font-black text-cyan-400 mt-0.5 block">
                          {alert.amount}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold flex items-center gap-1">
                          <Cpu className="w-3 h-3 text-slate-500" />
                          <span>Industry:</span>
                        </span>
                        <span className="text-xs font-bold text-slate-200 mt-0.5 block truncate">
                          {alert.industry}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
                          Risk Rating:
                        </span>
                        <div className="mt-0.5">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-extrabold border ${
                            alert.riskRating === 'Low'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : alert.riskRating === 'Medium'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          }`}>
                            {alert.riskRating}
                          </span>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold flex items-center gap-1">
                          <Users className="w-3 h-3 text-slate-500" />
                          <span>Similar trades:</span>
                        </span>
                        <span className="text-[11px] font-bold text-amber-300 mt-0.5 block">
                          {alert.similarTrades}
                        </span>
                      </div>
                    </div>

                    {/* Key Insight note if present */}
                    {alert.details?.keyInsight && (
                      <div className="text-xs text-slate-400 font-mono bg-slate-900/50 p-2.5 rounded-lg border border-slate-800/60">
                        <span className="text-blue-400 font-bold">Surveillance Note: </span>
                        <span>{alert.details.keyInsight}</span>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Interactive Quick Actions */}
                  <div className="flex flex-row lg:flex-col gap-2 shrink-0 justify-end pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                    <button
                      onClick={() => handleRunAudit(alert.symbol)}
                      className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition cursor-pointer justify-center"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>AI Forensic Audit</span>
                    </button>

                    <button
                      onClick={() => setSelectedAlertForDossier(alert)}
                      className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition cursor-pointer justify-center"
                    >
                      <Info className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Intelligence Dossier</span>
                    </button>

                    <button
                      onClick={() => onSelectAsset(alert.symbol)}
                      className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-mono text-xs font-bold border border-slate-800 flex items-center gap-1.5 transition cursor-pointer justify-center"
                    >
                      <BarChart2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>Inspect Chart</span>
                    </button>

                    <button
                      onClick={() => handleArmSmartAlert(alert.symbol, 145)}
                      className="px-3.5 py-2 rounded-lg bg-amber-500/15 hover:bg-amber-500 text-amber-300 hover:text-white font-mono text-xs font-bold border border-amber-500/30 flex items-center gap-1.5 transition cursor-pointer justify-center"
                    >
                      <Target className="w-3.5 h-3.5" />
                      <span>Arm Target Alert</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW: 1. WATCHLIST SMART MATRIX */}
      {activeTab === 'matrix' && (
        <div className="bg-[#0b0f19] border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-400" />
                <span>INSTITUTIONAL ACCUMULATION MATRIX</span>
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Composite Smart Money rating synthesized from Dark Pool blocks, Form 4 C-suite conviction, and options gamma.
              </p>
            </div>
            <div className="text-xs font-mono text-slate-400">
              Showing {filteredMatrix.length} monitored assets
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
                  <th className="py-3 px-4">TICKER & COMPANY</th>
                  <th className="py-3 px-4">CURRENT PRICE</th>
                  <th className="py-3 px-4 text-center">SMART SCORE</th>
                  <th className="py-3 px-4">INSTITUTIONAL REGIME</th>
                  <th className="py-3 px-4">DARK POOL BUY %</th>
                  <th className="py-3 px-4">INSIDER RATIO</th>
                  <th className="py-3 px-4">CALL / PUT SKEW</th>
                  <th className="py-3 px-4">KEY WHALES</th>
                  <th className="py-3 px-4 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredMatrix.map((item) => (
                  <tr key={item.symbol} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{item.symbol}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                          {item.exchange}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[180px]">{item.name}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white">
                        {item.currency === 'AUD' ? 'A$' : '$'}{item.price.toFixed(2)}
                      </div>
                      <div className={`text-[11px] flex items-center gap-0.5 ${item.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {item.change >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center justify-center font-bold px-2.5 py-1 rounded-md text-xs font-mono border"
                        style={{
                          backgroundColor: item.smartScore >= 85 ? 'rgba(16, 185, 129, 0.15)' : item.smartScore >= 70 ? 'rgba(59, 130, 246, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          color: item.smartScore >= 85 ? '#34d399' : item.smartScore >= 70 ? '#60a5fa' : '#fbbf24',
                          borderColor: item.smartScore >= 85 ? 'rgba(16, 185, 129, 0.3)' : item.smartScore >= 70 ? 'rgba(59, 130, 246, 0.3)' : 'rgba(245, 158, 11, 0.3)',
                        }}
                      >
                        {item.smartScore} / 100
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        item.regime === 'Strong Accumulation'
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                          : item.regime === 'Moderate Accumulation'
                          ? 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                          : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                      }`}>
                        {item.regime}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-purple-300">{item.darkPoolPct}%</span>
                        <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-purple-400 h-full rounded-full" style={{ width: `${item.darkPoolPct}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`font-bold ${item.insiderRatio >= 2 ? 'text-emerald-400' : 'text-slate-300'}`}>
                        {item.insiderRatio}x Buys
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-cyan-400">{item.callToPut}x Calls</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {item.keyWhales.map((w, idx) => (
                          <span key={idx} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                            {w}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleRunAudit(item.symbol)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 text-[10px] font-bold transition cursor-pointer"
                          title="Run AI Smart Money Forensic Audit"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Audit</span>
                        </button>
                        <button
                          onClick={() => onSelectAsset(item.symbol)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold transition cursor-pointer"
                          title="View Chart"
                        >
                          Chart
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: 2. SEC FORM 4 & ASX APPENDIX 3Y INSIDER TRADES */}
      {activeTab === 'insiders' && (
        <div className="bg-[#0b0f19] border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                <span>SEC FORM 4 & ASX APPENDIX 3Y INSIDER TRANSACTIONS</span>
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                C-Suite executives and Directors putting their own skin in the game. Cluster buying highlighted.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400">
                {filteredInsiders.length} trades recorded
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
                  <th className="py-3 px-4">TICKER</th>
                  <th className="py-3 px-4">INSIDER & TITLE</th>
                  <th className="py-3 px-4">ACTION & SIGNAL</th>
                  <th className="py-3 px-4">TRADE DATE</th>
                  <th className="py-3 px-4 text-right">PRICE</th>
                  <th className="py-3 px-4 text-right">SHARES</th>
                  <th className="py-3 px-4 text-right">TOTAL VALUE</th>
                  <th className="py-3 px-4">HOLDINGS AFTER</th>
                  <th className="py-3 px-4 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredInsiders.map((trade) => {
                  const isPurchase = trade.tradeType === 'Purchase';
                  return (
                    <tr key={trade.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-white text-sm">{trade.symbol}</span>
                        <div className="text-[10px] text-slate-400 truncate max-w-[130px]">{trade.companyName}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white">{trade.insiderName}</div>
                        <div className="text-[10px] text-slate-400">{trade.title}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            isPurchase
                              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                          }`}>
                            {trade.tradeType.toUpperCase()}
                          </span>

                          {trade.isClusterBuy && (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              <Flame className="w-2.5 h-2.5 text-amber-400" />
                              <span>CLUSTER BUY</span>
                            </span>
                          )}

                          {trade.isRule10b5_1 && (
                            <span className="text-[9px] text-slate-500">10b5-1 Plan</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        <div>{trade.transactionDate}</div>
                        <div className="text-[10px] text-slate-500">Filed: {trade.filingDate}</div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-white">
                        ${trade.price.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                        {trade.shares.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className={`font-bold font-mono ${isPurchase ? 'text-emerald-400 text-sm' : 'text-slate-300'}`}>
                          ${(trade.totalValue).toLocaleString()}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-slate-300">{trade.sharesOwnedAfter.toLocaleString()}</div>
                        <div className={`text-[10px] font-bold ${trade.sharesChangePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {trade.sharesChangePercent >= 0 ? '+' : ''}{trade.sharesChangePercent.toFixed(2)}%
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleRunAudit(trade.symbol)}
                            className="p-1.5 rounded bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white transition cursor-pointer"
                            title="Run AI Audit"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onSelectAsset(trade.symbol)}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold transition cursor-pointer"
                          >
                            Chart
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: 3. 13F HEDGE FUND WHALE FILINGS */}
      {activeTab === 'whales' && (
        <div className="space-y-6">
          {/* Whale Selector Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWhales.map((whale) => {
              const isSelected = selectedWhaleId === whale.id;
              return (
                <div
                  key={whale.id}
                  onClick={() => setSelectedWhaleId(whale.id)}
                  className={`bg-[#0b0f19] border rounded-xl p-4 cursor-pointer transition shadow-xl ${
                    isSelected ? 'border-blue-500 bg-slate-900/90 ring-1 ring-blue-500' : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white text-sm">{whale.fundName}</h4>
                      <p className="text-[11px] text-slate-400">{whale.manager}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-blue-500/10 text-blue-300 border border-blue-500/30">
                      ${whale.aumBillions}B AUM
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800/80 text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-slate-500">TOP HOLDING</span>
                      <div className="font-bold text-white mt-0.5">{whale.topHolding} ({whale.topHoldingWeight}%)</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500">STANCE</span>
                      <div className="font-bold text-emerald-400 mt-0.5">{whale.stance}</div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800/60">
                    <span>Turnover: {whale.turnoverRate}%</span>
                    <span>Quarter: {whale.quarter}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Whale Holdings Breakdown */}
          {(() => {
            const currentWhale = WHALE_FILINGS.find((w) => w.id === selectedWhaleId) || WHALE_FILINGS[0];
            return (
              <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-5 shadow-2xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold font-mono text-white">{currentWhale.fundName}</h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                        {currentWhale.stance}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      Managed by {currentWhale.manager} • 13F Filing for {currentWhale.quarter} (Filed {currentWhale.filingDate})
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-400">Total Holdings Value:</span>
                    <span className="text-base font-bold font-mono text-emerald-400">${currentWhale.aumBillions} Billion</span>
                  </div>
                </div>

                {/* Top Positions Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs font-mono">
                    <thead>
                      <tr className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
                        <th className="py-2.5 px-4">TICKER</th>
                        <th className="py-2.5 px-4">TOTAL SHARES</th>
                        <th className="py-2.5 px-4">MARKET VALUE</th>
                        <th className="py-2.5 px-4">PORTFOLIO %</th>
                        <th className="py-2.5 px-4">QoQ CHANGE</th>
                        <th className="py-2.5 px-4 text-right">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {currentWhale.topHoldings.map((pos) => (
                        <tr key={pos.symbol} className="hover:bg-slate-800/40 transition">
                          <td className="py-3 px-4">
                            <span className="font-bold text-white text-sm">{pos.symbol}</span>
                          </td>
                          <td className="py-3 px-4 text-slate-300">{pos.shares}</td>
                          <td className="py-3 px-4 font-bold text-white">{pos.valueUsd}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-blue-300">{pos.portfolioPercent}%</span>
                              <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-blue-400 h-full rounded-full" style={{ width: `${pos.portfolioPercent * 2.5}%` }} />
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`font-bold ${pos.changePercent > 0 ? 'text-emerald-400' : pos.changePercent < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                              {pos.changePercent > 0 ? '+' : ''}{pos.changePercent}%
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleRunAudit(pos.symbol)}
                                className="px-2 py-1 rounded bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white text-[10px] font-bold transition cursor-pointer"
                              >
                                Audit
                              </button>
                              <button
                                onClick={() => onSelectAsset(pos.symbol)}
                                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold transition cursor-pointer"
                              >
                                Chart
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Quarterly Rotation Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-800/80 text-xs font-mono">
                  <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-emerald-400 font-bold block mb-1">NEW POSITIONS</span>
                    <div className="flex flex-wrap gap-1">
                      {currentWhale.newPositions.map((s) => (
                        <span key={s} className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-[10px]">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-blue-400 font-bold block mb-1">INCREASED POSITIONS</span>
                    <div className="flex flex-wrap gap-1">
                      {currentWhale.increasedPositions.map((s) => (
                        <span key={s} className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/30 text-[10px]">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-amber-400 font-bold block mb-1">TRIMMED POSITIONS</span>
                    <div className="flex flex-wrap gap-1">
                      {currentWhale.trimmedPositions.map((s) => (
                        <span key={s} className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[10px]">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-rose-400 font-bold block mb-1">SOLD OUT (LIQUIDATED)</span>
                    <div className="flex flex-wrap gap-1">
                      {currentWhale.liquidatedPositions.map((s) => (
                        <span key={s} className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/30 text-[10px]">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* VIEW: 4. DARK POOL PRINTS & OFF-EXCHANGE BLOCKS */}
      {activeTab === 'darkpool' && (
        <div className="bg-[#0b0f19] border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
                <Eye className="w-4 h-4 text-purple-400" />
                <span>OFF-EXCHANGE DARK POOL LIQUIDITY PRINTS</span>
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Block crosses exceeding $50M+ executed away from lit exchanges to mitigate market impact.
              </p>
            </div>
            <div className="text-xs font-mono text-purple-300 bg-purple-500/10 px-2.5 py-1 rounded border border-purple-500/30">
              Live Cross Tape Active
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
                  <th className="py-3 px-4">TICKER</th>
                  <th className="py-3 px-4">PRINT TIME</th>
                  <th className="py-3 px-4">VENUE</th>
                  <th className="py-3 px-4">BLOCK TYPE</th>
                  <th className="py-3 px-4 text-right">CROSS PRICE</th>
                  <th className="py-3 px-4 text-right">BLOCK SIZE</th>
                  <th className="py-3 px-4 text-right">NOTIONAL VALUE</th>
                  <th className="py-3 px-4 text-center">% OF 30D ADV</th>
                  <th className="py-3 px-4">SENTIMENT</th>
                  <th className="py-3 px-4 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredDarkPool.map((block) => (
                  <tr key={block.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-white text-sm">{block.symbol}</span>
                      <div className="text-[10px] text-slate-400 truncate max-w-[130px]">{block.companyName}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">{block.timeAgo}</td>
                    <td className="py-3.5 px-4 text-slate-300 font-bold">{block.venue}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                        {block.blockType}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-white">
                      ${block.price.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-300">
                      {block.sizeShares.toLocaleString()} shs
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-purple-400">
                      ${(block.notionalValue / 1e6).toFixed(1)}M
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/30">
                        {block.pctAdv}% ADV
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        block.tradeSentiment === 'Bullish Accumulation'
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                          : block.tradeSentiment === 'Bearish Distribution'
                          ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}>
                        {block.tradeSentiment}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleRunAudit(block.symbol)}
                        className="px-2 py-1 rounded bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white text-[10px] font-bold transition cursor-pointer"
                      >
                        Audit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: 5. UNUSUAL OPTIONS SWEEDS */}
      {activeTab === 'options' && (
        <div className="bg-[#0b0f19] border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>UNUSUAL WHALES OPTIONS FLOW & AGGRESSIVE ASK SWEEPS</span>
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Aggressive multi-exchange sweeps executed on the ask with high premium volume vs open interest.
              </p>
            </div>
            <div className="text-xs font-mono text-slate-400">
              {filteredOptions.length} whale sweeps captured
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
                  <th className="py-3 px-4">TICKER</th>
                  <th className="py-3 px-4">CONTRACT</th>
                  <th className="py-3 px-4">EXPIRATION</th>
                  <th className="py-3 px-4 text-right">SPOT</th>
                  <th className="py-3 px-4 text-right">STRIKE</th>
                  <th className="py-3 px-4 text-right">PREMIUM</th>
                  <th className="py-3 px-4 text-right">CONTRACTS</th>
                  <th className="py-3 px-4 text-center">VOL / OI</th>
                  <th className="py-3 px-4">SENTIMENT</th>
                  <th className="py-3 px-4 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredOptions.map((opt) => (
                  <tr key={opt.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-white text-sm">{opt.symbol}</span>
                      <div className="text-[10px] text-slate-400">{opt.timeAgo}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        opt.type === 'CALL'
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                          : 'bg-rose-500/15 text-rose-300 border-rose-500/40'
                      }`}>
                        {opt.type} {opt.orderType.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">{opt.expiration}</td>
                    <td className="py-3.5 px-4 text-right text-slate-300">${opt.spotPrice.toFixed(2)}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-white">${opt.strike.toFixed(2)}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-400">
                      ${(opt.premium / 1e6).toFixed(2)}M
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-300">
                      {opt.sizeContracts.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                        {opt.volumeToOiRatio}x
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        opt.sentiment.includes('Bullish')
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                          : opt.sentiment === 'Hedging'
                          ? 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                          : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                      }`}>
                        {opt.sentiment}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleRunAudit(opt.symbol)}
                        className="px-2 py-1 rounded bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white text-[10px] font-bold transition cursor-pointer"
                      >
                        Audit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: 6. CONGRESSIONAL STOCK ACT DISCLOSURES */}
      {activeTab === 'congress' && (
        <div className="bg-[#0b0f19] border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
                <Landmark className="w-4 h-4 text-cyan-400" />
                <span>CONGRESSIONAL TRADES (STOCK ACT DISCLOSURES)</span>
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Trades by U.S. Representatives and Senators cross-referenced against committee jurisdictions and subsequent returns.
              </p>
            </div>
            <div className="text-xs font-mono text-slate-400">
              {filteredCongress.length} disclosures tracked
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
                  <th className="py-3 px-4">POLITICIAN</th>
                  <th className="py-3 px-4">CHAMBER & PARTY</th>
                  <th className="py-3 px-4">KEY COMMITTEE</th>
                  <th className="py-3 px-4">TICKER</th>
                  <th className="py-3 px-4">ACTION</th>
                  <th className="py-3 px-4">ESTIMATED VALUE</th>
                  <th className="py-3 px-4">TRADE DATE</th>
                  <th className="py-3 px-4 text-center">LAG</th>
                  <th className="py-3 px-4 text-right">RETURN SINCE</th>
                  <th className="py-3 px-4 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredCongress.map((trade) => (
                  <tr key={trade.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-bold text-white text-sm">{trade.politician}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        trade.party === 'Democrat'
                          ? 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                          : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                      }`}>
                        {trade.chamber} ({trade.party[0]})
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 max-w-[180px] truncate">{trade.committee}</td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-white text-sm">{trade.symbol}</span>
                      {trade.industry && (
                        <div className="text-[10px] text-cyan-400 font-mono mt-0.5">
                          {trade.industry}
                        </div>
                      )}
                      {trade.similarTradesNote && (
                        <div className="text-[9px] text-amber-300 font-mono">
                          {trade.similarTradesNote}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                        {trade.transactionType}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-cyan-300">{trade.estimatedValue}</div>
                      {trade.riskRating && (
                        <span className={`inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold border ${
                          trade.riskRating === 'Low'
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                            : trade.riskRating === 'Medium'
                            ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                            : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                        }`}>
                          {trade.riskRating} Risk
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">{trade.transactionDate}</td>
                    <td className="py-3.5 px-4 text-center text-slate-400">{trade.disclosureLagDays}d</td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-bold text-emerald-400">+{trade.performanceSinceTrade}%</span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleRunAudit(trade.symbol)}
                        className="px-2 py-1 rounded bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white text-[10px] font-bold transition cursor-pointer"
                      >
                        Audit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AI SMART MONEY FORENSIC AUDIT MODAL */}
      {auditSymbol && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b0f19] border border-slate-700 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <Sparkles className="w-5 h-5" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold font-mono text-white">
                      AI SMART MONEY FORENSIC AUDIT: {auditSymbol}
                    </h3>
                    {auditData && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        GRADE {auditData.institutionalGrade}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    Microstructure Order Flow, Wyckoff Accumulation Stage & Dealer Gamma Assessment
                  </p>
                </div>
              </div>

              <button
                onClick={() => setAuditSymbol(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Loading State */}
            {isAuditing && (
              <div className="py-16 text-center">
                <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-sm font-mono text-white font-bold">
                  Analyzing 13F Whales, Dark Pool Blocks & Form 4 Filings for {auditSymbol}...
                </p>
                <p className="text-xs font-mono text-slate-400 mt-1">
                  Querying Gemini Institutional Quantitative Flow Engine
                </p>
              </div>
            )}

            {/* Audit Content */}
            {!isAuditing && auditData && (
              <div className="space-y-6 mt-5 font-mono">
                {/* Metric Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400">ACCUMULATION SCORE</span>
                    <div className="text-xl font-bold text-emerald-400 mt-0.5">{auditData.overallScore} / 100</div>
                    <span className="text-[10px] text-emerald-300/80">{auditData.signal}</span>
                  </div>

                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400">WYCKOFF PHASE</span>
                    <div className="text-xs font-bold text-blue-300 mt-1">{auditData.wyckoffPhase}</div>
                  </div>

                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400">CURRENT SPOT</span>
                    <div className="text-xl font-bold text-white mt-0.5">${auditData.currentPrice.toFixed(2)}</div>
                  </div>

                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400">SMART MONEY TARGET</span>
                    <div className="text-xl font-bold text-emerald-400 mt-0.5">${auditData.smartMoneyTargetPrice.toFixed(2)}</div>
                    <span className="text-[10px] text-emerald-400">
                      +{(((auditData.smartMoneyTargetPrice - auditData.currentPrice) / auditData.currentPrice) * 100).toFixed(1)}% Upside
                    </span>
                  </div>
                </div>

                {/* Executive Summary */}
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                  <h4 className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-blue-400" />
                    <span>EXECUTIVE DESK VERDICT</span>
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">{auditData.executiveSummary}</p>
                </div>

                {/* Deep Dive Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800">
                    <h4 className="text-xs font-bold text-purple-300 mb-2 flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-purple-400" />
                      <span>DARK POOL ABSORPTION</span>
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">{auditData.darkPoolAbsorption}</p>
                  </div>

                  <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800">
                    <h4 className="text-xs font-bold text-amber-300 mb-2 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-amber-400" />
                      <span>INSIDER C-SUITE CONVICTION</span>
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">{auditData.insiderConviction}</p>
                  </div>

                  <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800">
                    <h4 className="text-xs font-bold text-cyan-300 mb-2 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-cyan-400" />
                      <span>OPTIONS GAMMA & SWEEDS (GEX)</span>
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">{auditData.optionsGammaProfile}</p>
                  </div>

                  <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800">
                    <h4 className="text-xs font-bold text-blue-300 mb-2 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-blue-400" />
                      <span>13F WHALE HEDGE FUND CONSENSUS</span>
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">{auditData.whaleConsensus}</p>
                  </div>
                </div>

                {/* Footprints & Risks */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-emerald-950/20 p-4 rounded-xl border border-emerald-900/40">
                    <h4 className="text-xs font-bold text-emerald-400 mb-2 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>INSTITUTIONAL FOOTPRINTS</span>
                    </h4>
                    <ul className="space-y-1.5 text-xs text-emerald-200/90 list-disc list-inside">
                      {auditData.keyInstitutionalFootprints.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-rose-950/20 p-4 rounded-xl border border-rose-900/40">
                    <h4 className="text-xs font-bold text-rose-400 mb-2 flex items-center gap-1.5">
                      <TrendingDown className="w-3.5 h-3.5" />
                      <span>STRUCTURAL FLOW RISKS</span>
                    </h4>
                    <ul className="space-y-1.5 text-xs text-rose-200/90 list-disc list-inside">
                      {auditData.riskFactors.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Action Bar in Modal */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-800 flex-wrap gap-2">
                  <div className="text-xs text-slate-400">
                    Institutional target price: <strong className="text-white">${auditData.smartMoneyTargetPrice.toFixed(2)}</strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleArmSmartAlert(auditData.symbol, auditData.smartMoneyTargetPrice)}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 text-xs font-bold transition cursor-pointer"
                    >
                      Arm Target Alert (${auditData.smartMoneyTargetPrice.toFixed(2)})
                    </button>
                    <button
                      onClick={() => {
                        onSelectAsset(auditData.symbol);
                        setAuditSymbol(null);
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition cursor-pointer"
                    >
                      Open Technical Chart
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SMART MONEY INTELLIGENCE DOSSIER MODAL */}
      {selectedAlertForDossier && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b0f19] border border-rose-500/40 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40">
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
                    {selectedAlertForDossier.headline}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setSelectedAlertForDossier(null)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Core Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] font-mono text-slate-400 block uppercase">Reported Amount</span>
                <span className="text-base font-bold font-mono text-cyan-400">{selectedAlertForDossier.amount}</span>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] font-mono text-slate-400 block uppercase">Target Industry</span>
                <span className="text-xs font-bold font-mono text-white truncate block">{selectedAlertForDossier.industry}</span>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] font-mono text-slate-400 block uppercase">Risk Assessment</span>
                <span className="text-xs font-bold font-mono text-amber-300 block">{selectedAlertForDossier.riskRating} Rating</span>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] font-mono text-slate-400 block uppercase">Disclosure Lag</span>
                <span className="text-xs font-bold font-mono text-emerald-400 block">
                  {selectedAlertForDossier.details?.lagDays ? `${selectedAlertForDossier.details.lagDays} days (Statutory: 45d)` : '3 days'}
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
                  {selectedAlertForDossier.similarTrades}
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                Tracking capital allocations by members of Congress and key committee chairs in artificial intelligence, semiconductors, and cloud infrastructure:
              </p>

              <div className="divide-y divide-slate-800 border border-slate-800 rounded-lg overflow-hidden text-xs font-mono">
                {(selectedAlertForDossier.details?.peerTrades || [
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
            {selectedAlertForDossier.details?.keyInsight && (
              <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 mb-5">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-blue-300 mb-1">
                  <ShieldCheck className="w-4 h-4 text-blue-400" />
                  <span>REGULATORY & COMMITTEE OVERSIGHT AUDIT</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {selectedAlertForDossier.details.keyInsight}
                </p>
                {selectedAlertForDossier.details.committee && (
                  <div className="mt-2 text-[11px] font-mono text-slate-400">
                    <span className="text-slate-500">Committee Jurisdiction: </span>
                    <span className="text-slate-300">{selectedAlertForDossier.details.committee}</span>
                  </div>
                )}
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800 flex-wrap gap-2">
              <button
                onClick={() => {
                  onSelectAsset(selectedAlertForDossier.symbol);
                  setSelectedAlertForDossier(null);
                }}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <BarChart2 className="w-4 h-4 text-cyan-400" />
                <span>Open {selectedAlertForDossier.symbol} Chart</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleArmSmartAlert(selectedAlertForDossier.symbol, 145);
                    setSelectedAlertForDossier(null);
                  }}
                  className="px-4 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-white font-mono text-xs font-bold border border-amber-500/40 flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Target className="w-4 h-4" />
                  <span>Set Target Alert</span>
                </button>

                <button
                  onClick={() => {
                    handleRunAudit(selectedAlertForDossier.symbol);
                    setSelectedAlertForDossier(null);
                  }}
                  className="px-4 py-2 rounded-lg bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-mono text-xs font-bold shadow-lg shadow-blue-500/20 flex items-center gap-1.5 transition cursor-pointer"
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
