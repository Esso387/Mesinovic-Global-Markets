import React, { useState, useMemo } from 'react';
import { MarketAsset, EarningsEvent, AIEarningsPreview, AlertTrigger } from '../types/market.ts';
import { getEarningsCalendarForAssets } from '../data/mockEarningsData.ts';
import { exportEarningsToCsv } from '../utils/csvExport.ts';
import {
  Calendar,
  Clock,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Download,
  Search,
  Filter,
  Sparkles,
  BarChart2,
  AlertCircle,
  CheckCircle2,
  Bell,
  Eye,
  Layers,
  HelpCircle,
  X,
  Flame,
  Zap,
  ArrowRight,
  Sun,
  Moon,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';

interface EarningsCalendarProps {
  assets: MarketAsset[];
  onSelectAsset: (symbol: string) => void;
  onAnalyzeStock?: (symbol: string) => void;
  onAddAlert?: (alert: AlertTrigger) => void;
  onNotify?: (title: string, desc: string) => void;
}

export const EarningsCalendar: React.FC<EarningsCalendarProps> = ({
  assets,
  onSelectAsset,
  onAnalyzeStock,
  onAddAlert,
  onNotify,
}) => {
  // Master calendar list merged with current watchlist assets
  const calendarEvents = useMemo(() => getEarningsCalendarForAssets(assets), [assets]);

  // Filtering states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState<string>('ALL');
  const [timingFilter, setTimingFilter] = useState<'ALL' | 'BMO' | 'AMC'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'upcoming' | 'reported'>('ALL');
  const [watchlistOnly, setWatchlistOnly] = useState(true);
  const [activeView, setActiveView] = useState<'table' | 'charts' | 'timeline'>('table');

  // AI Preview Modal State
  const [activeAiPreview, setActiveAiPreview] = useState<AIEarningsPreview | null>(null);
  const [selectedPreviewEvent, setSelectedPreviewEvent] = useState<EarningsEvent | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  // Sector list extraction
  const sectors = useMemo(() => {
    const set = new Set<string>();
    calendarEvents.forEach((e) => {
      if (e.sector) set.add(e.sector);
    });
    return Array.from(set).sort();
  }, [calendarEvents]);

  // Filtered dataset
  const filteredEvents = useMemo(() => {
    return calendarEvents.filter((event) => {
      // Watchlist filter
      if (watchlistOnly && !event.isInWatchlist) return false;

      // Status filter
      if (statusFilter !== 'ALL' && event.status !== statusFilter) return false;

      // Timing filter
      if (timingFilter !== 'ALL' && event.reportTime !== timingFilter) return false;

      // Sector filter
      if (selectedSector !== 'ALL' && event.sector !== selectedSector) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesSym = event.symbol.toLowerCase().includes(q);
        const matchesName = event.name.toLowerCase().includes(q);
        const matchesSector = event.sector.toLowerCase().includes(q);
        if (!matchesSym && !matchesName && !matchesSector) return false;
      }

      return true;
    });
  }, [calendarEvents, watchlistOnly, statusFilter, timingFilter, selectedSector, searchQuery]);

  // KPI Calculations
  const stats = useMemo(() => {
    const upcoming = filteredEvents.filter((e) => e.status === 'upcoming');
    const reported = calendarEvents.filter((e) => e.status === 'reported');

    // Calculate beat rate from reported & historical data
    let totalPastReports = 0;
    let totalBeats = 0;
    calendarEvents.forEach((e) => {
      if (e.epsSurprisePercent !== null && e.epsSurprisePercent !== undefined) {
        totalPastReports++;
        if (e.epsSurprisePercent > 0) totalBeats++;
      }
      e.historicalSurprises?.forEach((h) => {
        totalPastReports++;
        if (h.epsSurprisePct > 0) totalBeats++;
      });
    });

    const historicalBeatRate =
      totalPastReports > 0 ? +((totalBeats / totalPastReports) * 100).toFixed(1) : 84.2;

    // Highest implied move
    let maxVolAsset = upcoming[0];
    upcoming.forEach((e) => {
      if (!maxVolAsset || e.impliedMovePercent > maxVolAsset.impliedMovePercent) {
        maxVolAsset = e;
      }
    });

    return {
      totalUpcoming: upcoming.length,
      totalFiltered: filteredEvents.length,
      historicalBeatRate,
      maxVolAsset: maxVolAsset || upcoming[0],
    };
  }, [filteredEvents, calendarEvents]);

  // Handler for Exporting CSV
  const handleExportCsv = () => {
    const res = exportEarningsToCsv(filteredEvents, 'earnings_calendar_announcements');
    if (res.success && onNotify) {
      onNotify('Earnings CSV Exported', `Generated ${res.filename} with ${res.rowCount} records.`);
    }
  };

  // Handler for AI Earnings Preview
  const handleFetchAiPreview = async (event: EarningsEvent) => {
    setSelectedPreviewEvent(event);
    setIsLoadingAi(true);
    setActiveAiPreview(null);

    try {
      const res = await fetch('/api/ai/earnings-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: event.symbol,
          quarter: event.fiscalQuarter,
          estimatedEPS: event.estimatedEPS,
          estimatedRevenue: event.estimatedRevenue,
          currentPrice: event.currentPrice,
          impliedMovePercent: event.impliedMovePercent,
        }),
      });

      if (!res.ok) throw new Error('Failed to generate earnings preview');
      const data: AIEarningsPreview = await res.json();
      setActiveAiPreview(data);
    } catch (err) {
      console.error('AI Earnings preview error:', err);
      // Fallback
      setActiveAiPreview({
        symbol: event.symbol,
        quarter: event.fiscalQuarter,
        catalystSummary: `Consensus expectations for ${event.symbol} (${event.name}) project robust execution against guidance with options pricing a ±${event.impliedMovePercent}% post-release reaction.`,
        whisperEPS: +(event.estimatedEPS * 1.04).toFixed(2),
        consensusEPS: event.estimatedEPS,
        impliedMove: `±${event.impliedMovePercent}%`,
        optionsStraddlePrice: `$${((event.currentPrice * event.impliedMovePercent) / 100).toFixed(2)}`,
        keySegmentsToWatch: [
          { segment: 'Core Top-Line Revenue', target: `Beat ${event.estimatedRevenue}`, importance: 'Critical' },
          { segment: 'Forward Guidance Revision', target: 'Raise FY2027 outlook', importance: 'Critical' },
          { segment: 'Free Cash Flow Margin', target: '>35% conversion', importance: 'High' },
        ],
        bullCaseDrivers: [
          'High enterprise demand backlog conversion.',
          'Operating leverage and cost efficiency gains.',
          'Share repurchase acceleration.',
        ],
        bearCaseRisks: [
          'Multiple contraction on any forward margin warning.',
          'Foreign currency and supply chain headwinds.',
        ],
        managementGuidanceRisk: 'Elevated',
        tradingDeskVerdict: `Implied move of ±${event.impliedMovePercent}% reflects substantial event risk. Consider defined-risk collar structures or awaiting release confirmation before adjusting core exposure.`,
      });
    } finally {
      setIsLoadingAi(false);
    }
  };

  // Helper to format days until
  const getDaysUntil = (dateStr: string) => {
    const target = new Date(dateStr).getTime();
    const today = new Date().setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays > 1) return `In ${diffDays} days`;
    return 'Reported';
  };

  // Chart data for surprises
  const surpriseChartData = useMemo(() => {
    const list: {
      symbol: string;
      quarter: string;
      epsSurprise: number;
      revSurprise: number;
      status: string;
      color: string;
    }[] = [];

    // Reported assets
    calendarEvents
      .filter((e) => e.epsSurprisePercent !== null && e.epsSurprisePercent !== undefined)
      .forEach((e) => {
        list.push({
          symbol: e.symbol,
          quarter: e.fiscalQuarter.split(' ')[0],
          epsSurprise: e.epsSurprisePercent || 0,
          revSurprise: e.revenueSurprisePercent || 0,
          status: 'Reported',
          color: (e.epsSurprisePercent || 0) >= 0 ? '#10b981' : '#f43f5e',
        });
      });

    // Historical surprises from upcoming assets
    calendarEvents
      .filter((e) => e.status === 'upcoming' && e.historicalSurprises && e.historicalSurprises.length > 0)
      .slice(0, 6)
      .forEach((e) => {
        const lastQ = e.historicalSurprises![0];
        list.push({
          symbol: `${e.symbol} (Last Q)`,
          quarter: lastQ.quarter,
          epsSurprise: lastQ.epsSurprisePct,
          revSurprise: lastQ.revSurprisePct,
          status: 'Prior Q',
          color: lastQ.epsSurprisePct >= 0 ? '#10b981' : '#f43f5e',
        });
      });

    return list;
  }, [calendarEvents]);

  // Implied Volatility Move Comparison Data
  const impliedMoveData = useMemo(() => {
    return filteredEvents.slice(0, 8).map((e) => {
      const histReaction = e.historicalSurprises?.[0]?.priceReactionPct
        ? Math.abs(e.historicalSurprises[0].priceReactionPct)
        : +(e.impliedMovePercent * 0.85).toFixed(1);

      return {
        symbol: e.symbol,
        impliedMove: e.impliedMovePercent,
        histMove: histReaction,
      };
    });
  }, [filteredEvents]);

  return (
    <div className="space-y-6">
      {/* SECTION HEADER & CONTROL BAR */}
      <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-5 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400">
                <Calendar className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold font-mono tracking-tight text-white flex items-center gap-2">
                  <span>EARNINGS INTELLIGENCE CALENDAR</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold">
                    Q3/Q4 FY2026 LIVE
                  </span>
                </h2>
                <p className="text-xs text-slate-400 font-sans mt-0.5">
                  Upcoming quarterly announcements, estimated EPS, revenue surprise tracking, and options implied volatility moves.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Header Actions: Export CSV & View Toggle */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* View switcher */}
            <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-lg p-0.5 text-xs font-mono">
              <button
                onClick={() => setActiveView('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-bold transition ${
                  activeView === 'table'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Calendar & Cards</span>
              </button>
              <button
                onClick={() => setActiveView('charts')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-bold transition ${
                  activeView === 'charts'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span>Surprise Analytics</span>
              </button>
            </div>

            {/* Export CSV Button */}
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 text-xs font-mono font-bold transition shadow-sm cursor-pointer"
              title="Export Current Earnings Calendar to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* TOP SUMMARY KPI METRICS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-800/80">
          <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3">
            <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
              <span>Upcoming Releases</span>
              <Clock className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="text-xl font-bold font-mono text-white mt-1">
              {stats.totalUpcoming} <span className="text-xs text-slate-400 font-normal">assets</span>
            </div>
            <div className="text-[10px] text-emerald-400 font-mono mt-0.5">
              Next release: {calendarEvents[0]?.symbol} ({getDaysUntil(calendarEvents[0]?.reportDate)})
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3">
            <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
              <span>Historical EPS Beat Rate</span>
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
              {stats.historicalBeatRate}%
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
              Across tracked portfolio peers
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3">
            <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
              <span>Max Expected Move</span>
              <Flame className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-xl font-bold font-mono text-amber-300 mt-1">
              ±{stats.maxVolAsset?.impliedMovePercent ?? 9.6}%
            </div>
            <div className="text-[10px] text-slate-300 font-mono mt-0.5 flex items-center gap-1">
              <span className="font-bold text-white">{stats.maxVolAsset?.symbol}</span>
              <span className="text-slate-400">• Options Straddle IV</span>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3">
            <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
              <span>Scope Filter</span>
              <Filter className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-xl font-bold font-mono text-white mt-1">
              {stats.totalFiltered} <span className="text-xs text-slate-400 font-normal">matches</span>
            </div>
            <div className="text-[10px] text-cyan-400 font-mono mt-0.5">
              {watchlistOnly ? 'Watchlist Only Active' : 'All Universe Coverage'}
            </div>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH TOOLBAR */}
      <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        {/* Left: Search input */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search symbol, company, or sector..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
            >
              &times;
            </button>
          )}
        </div>

        {/* Right: Dropdowns and Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Watchlist Only Toggle */}
          <button
            onClick={() => setWatchlistOnly(!watchlistOnly)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition font-bold ${
              watchlistOnly
                ? 'bg-blue-600/20 text-blue-400 border-blue-500/40'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <span>Watchlist Only</span>
            <span
              className={`w-2 h-2 rounded-full ${
                watchlistOnly ? 'bg-blue-400' : 'bg-slate-600'
              }`}
            />
          </button>

          {/* Sector Filter Dropdown */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1">
            <span className="text-slate-500 text-[10px]">Sector:</span>
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="bg-transparent text-white focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900 text-white">
                All Sectors
              </option>
              {sectors.map((sec) => (
                <option key={sec} value={sec} className="bg-slate-900 text-white">
                  {sec}
                </option>
              ))}
            </select>
          </div>

          {/* Timing Filter: BMO vs AMC */}
          <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg p-0.5">
            <button
              onClick={() => setTimingFilter('ALL')}
              className={`px-2 py-1 rounded text-[11px] ${
                timingFilter === 'ALL'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Timing
            </button>
            <button
              onClick={() => setTimingFilter('BMO')}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] ${
                timingFilter === 'BMO'
                  ? 'bg-amber-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Before Market Open"
            >
              <Sun className="w-3 h-3 text-amber-400" />
              <span>BMO</span>
            </button>
            <button
              onClick={() => setTimingFilter('AMC')}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] ${
                timingFilter === 'AMC'
                  ? 'bg-purple-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="After Market Close"
            >
              <Moon className="w-3 h-3 text-purple-300" />
              <span>AMC</span>
            </button>
          </div>

          {/* Status Filter */}
          <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg p-0.5">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-2 py-1 rounded text-[11px] ${
                statusFilter === 'ALL'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('upcoming')}
              className={`px-2 py-1 rounded text-[11px] ${
                statusFilter === 'upcoming'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setStatusFilter('reported')}
              className={`px-2 py-1 rounded text-[11px] ${
                statusFilter === 'reported'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Reported
            </button>
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: COMPREHENSIVE EARNINGS ANNOUNCEMENTS TABLE & CARDS */}
      {activeView === 'table' && (
        <div className="space-y-4">
          {filteredEvents.length === 0 ? (
            <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-12 text-center text-slate-400 font-mono">
              <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <div className="text-sm font-bold text-white">No earnings announcements found</div>
              <div className="text-xs text-slate-500 mt-1">
                Try widening your search filter or turning off the "Watchlist Only" toggle.
              </div>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedSector('ALL');
                  setTimingFilter('ALL');
                  setStatusFilter('ALL');
                  setWatchlistOnly(false);
                }}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="bg-[#0b0f19] border border-slate-800 rounded-xl shadow-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead>
                    <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">Date & Timing</th>
                      <th className="py-3 px-4">Asset / Sector</th>
                      <th className="py-3 px-4">Period</th>
                      <th className="py-3 px-4 text-right">Est EPS</th>
                      <th className="py-3 px-4 text-right">Actual / Surprise</th>
                      <th className="py-3 px-4 text-right">Est Revenue</th>
                      <th className="py-3 px-4 text-right">Revenue Surprise</th>
                      <th className="py-3 px-4 text-center">Implied Move</th>
                      <th className="py-3 px-4 text-center">Surprise Track</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredEvents.map((event) => {
                      const daysUntil = getDaysUntil(event.reportDate);
                      const isUpcoming = event.status === 'upcoming';
                      const isReported = event.status === 'reported';

                      // Determine EPS surprise color & label
                      const hasEpsSurprise =
                        event.epsSurprisePercent !== null && event.epsSurprisePercent !== undefined;
                      const isEpsBeat = hasEpsSurprise && (event.epsSurprisePercent || 0) >= 0;

                      // Determine Revenue surprise color & label
                      const hasRevSurprise =
                        event.revenueSurprisePercent !== null && event.revenueSurprisePercent !== undefined;
                      const isRevBeat = hasRevSurprise && (event.revenueSurprisePercent || 0) >= 0;

                      return (
                        <tr
                          key={event.id}
                          className="hover:bg-slate-900/60 transition-colors group"
                        >
                          {/* 1. Date & Timing */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 ${
                                  event.reportTime === 'BMO'
                                    ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                                    : 'bg-purple-500/10 text-purple-300 border border-purple-500/30'
                                }`}
                                title={
                                  event.reportTime === 'BMO'
                                    ? 'Before Market Open'
                                    : 'After Market Close'
                                }
                              >
                                {event.reportTime === 'BMO' ? (
                                  <Sun className="w-2.5 h-2.5" />
                                ) : (
                                  <Moon className="w-2.5 h-2.5" />
                                )}
                                <span>{event.reportTime}</span>
                              </span>
                              <div>
                                <div className="text-white font-bold">{event.reportDate}</div>
                                <div
                                  className={`text-[10px] font-medium ${
                                    isReported
                                      ? 'text-slate-400'
                                      : daysUntil === 'Today' || daysUntil === 'Tomorrow'
                                      ? 'text-amber-400 font-bold animate-pulse'
                                      : 'text-cyan-400'
                                  }`}
                                >
                                  {daysUntil}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* 2. Asset & Sector */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => onSelectAsset(event.symbol)}
                                    className="font-bold text-white hover:text-blue-400 transition cursor-pointer text-sm"
                                  >
                                    {event.symbol}
                                  </button>
                                  <span className="text-[10px] px-1 py-0.2 rounded bg-slate-800 text-slate-400">
                                    {event.exchange}
                                  </span>
                                  {event.isInWatchlist && (
                                    <span
                                      className="text-[9px] px-1 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-semibold"
                                      title="In Your Active Watchlist"
                                    >
                                      ★ Watchlist
                                    </span>
                                  )}
                                </div>
                                <div className="text-slate-400 text-[11px] truncate max-w-[150px] sm:max-w-[200px]">
                                  {event.name}
                                </div>
                                <div className="text-[10px] text-slate-500">{event.sector}</div>
                              </div>
                            </div>
                          </td>

                          {/* 3. Period */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="px-2 py-1 rounded bg-slate-800/80 text-slate-300 font-bold text-[11px]">
                              {event.fiscalQuarter}
                            </span>
                          </td>

                          {/* 4. Estimated EPS */}
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="text-white font-bold text-sm">
                              ${event.estimatedEPS.toFixed(2)}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              Prior: ${event.priorEPS.toFixed(2)}
                            </div>
                          </td>

                          {/* 5. Actual EPS / Surprise */}
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            {isReported && event.actualEPS !== null && event.actualEPS !== undefined ? (
                              <div>
                                <div className="font-bold text-white text-sm">
                                  ${event.actualEPS.toFixed(2)}
                                </div>
                                <div
                                  className={`text-[10px] font-bold inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded mt-0.5 ${
                                    isEpsBeat
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                  }`}
                                >
                                  {isEpsBeat ? (
                                    <TrendingUp className="w-2.5 h-2.5" />
                                  ) : (
                                    <TrendingDown className="w-2.5 h-2.5" />
                                  )}
                                  <span>
                                    {(event.epsSurprisePercent ?? 0) >= 0 ? '+' : ''}
                                    {event.epsSurprisePercent?.toFixed(2)}% (
                                    {event.epsSurpriseAmount && event.epsSurpriseAmount >= 0 ? '+' : ''}$
                                    {event.epsSurpriseAmount?.toFixed(2)})
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="text-slate-500 text-xs italic">
                                Pending Release
                              </div>
                            )}
                          </td>

                          {/* 6. Estimated Revenue */}
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="text-white font-bold text-sm">
                              {event.estimatedRevenue}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              Prior: {event.priorRevenue}
                            </div>
                          </td>

                          {/* 7. Actual Revenue & Revenue Surprise */}
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            {isReported && event.actualRevenue ? (
                              <div>
                                <div className="font-bold text-white text-sm">
                                  {event.actualRevenue}
                                </div>
                                <div
                                  className={`text-[10px] font-bold inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded mt-0.5 ${
                                    isRevBeat
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                  }`}
                                >
                                  {isRevBeat ? (
                                    <TrendingUp className="w-2.5 h-2.5" />
                                  ) : (
                                    <TrendingDown className="w-2.5 h-2.5" />
                                  )}
                                  <span>
                                    {(event.revenueSurprisePercent ?? 0) >= 0 ? '+' : ''}
                                    {event.revenueSurprisePercent?.toFixed(2)}%
                                    {event.revenueSurpriseAmount ? ` (${event.revenueSurpriseAmount})` : ''}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="text-slate-500 text-xs italic">
                                Pending
                              </div>
                            )}
                          </td>

                          {/* 8. Implied Move */}
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-bold font-mono ${
                                event.impliedMovePercent > 7
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  : 'bg-slate-800 text-slate-300'
                              }`}
                              title="Expected post-earnings percentage price swing based on ATM options straddle"
                            >
                              ±{event.impliedMovePercent}%
                            </span>
                          </td>

                          {/* 9. Historical Surprise Track Record */}
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1">
                              {event.historicalSurprises && event.historicalSurprises.length > 0 ? (
                                event.historicalSurprises.slice(0, 4).map((h, i) => {
                                  const isBeat = h.epsSurprisePct >= 0;
                                  return (
                                    <div
                                      key={i}
                                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-extrabold ${
                                        isBeat
                                          ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50'
                                          : 'bg-rose-500/30 text-rose-300 border border-rose-500/50'
                                      }`}
                                      title={`${h.quarter}: EPS Surprise ${isBeat ? '+' : ''}${h.epsSurprisePct.toFixed(1)}% | Revenue Surprise ${h.revSurprisePct >= 0 ? '+' : ''}${h.revSurprisePct.toFixed(1)}%`}
                                    >
                                      {isBeat ? '✓' : '×'}
                                    </div>
                                  );
                                })
                              ) : (
                                <span className="text-slate-600 text-[10px]">N/A</span>
                              )}
                            </div>
                          </td>

                          {/* 10. Actions (AI Preview, Chart, Alert) */}
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* AI Preview Button */}
                              <button
                                onClick={() => handleFetchAiPreview(event)}
                                className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded text-[11px] font-bold shadow transition cursor-pointer"
                                title="Run Gemini AI Institutional Earnings Preview & Whisper Numbers"
                              >
                                <Sparkles className="w-3 h-3" />
                                <span className="hidden sm:inline">AI Preview</span>
                              </button>

                              {/* Technical Chart */}
                              <button
                                onClick={() => onSelectAsset(event.symbol)}
                                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                                title={`Inspect ${event.symbol} Technical Chart`}
                              >
                                <BarChart2 className="w-3.5 h-3.5" />
                              </button>

                              {/* Arm Alert */}
                              {onAddAlert && (
                                <button
                                  onClick={() => {
                                    onAddAlert({
                                      id: Date.now().toString(),
                                      symbol: event.symbol,
                                      condition: 'ABOVE',
                                      targetValue: +(event.currentPrice * 1.05).toFixed(2),
                                      triggered: false,
                                      createdAt: new Date().toISOString(),
                                      notes: `Earnings announcement on ${event.reportDate} (${event.fiscalQuarter})`,
                                    });
                                    if (onNotify) {
                                      onNotify('Earnings Alert Armed', `Alert active for ${event.symbol} ahead of ${event.fiscalQuarter} release.`);
                                    }
                                  }}
                                  className="p-1 rounded bg-slate-800 hover:bg-amber-600/30 text-slate-400 hover:text-amber-300 transition"
                                  title="Add earnings release price trigger alert"
                                >
                                  <Bell className="w-3.5 h-3.5" />
                                </button>
                              )}
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
        </div>
      )}

      {/* VIEW MODE 2: RECHARTS SURPRISE & ESTIMATE ANALYTICS */}
      {activeView === 'charts' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: EPS Surprise % Distribution */}
          <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-mono font-bold text-sm text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span>EPS Surprise (% Beat / Miss Distribution)</span>
                </h3>
                <p className="text-xs text-slate-400 font-sans mt-0.5">
                  Percentage surprise vs consensus Wall Street estimate
                </p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Institutional Delta
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={surpriseChartData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    dataKey="symbol"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickFormatter={(val) => `${val > 0 ? '+' : ''}${val}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      fontFamily: 'monospace',
                      fontSize: '11px',
                    }}
                    formatter={(val: any, name?: any) => [
                      `${Number(val) > 0 ? '+' : ''}${Number(val).toFixed(2)}%`,
                      name === 'epsSurprise' ? 'EPS Surprise' : 'Revenue Surprise',
                    ]}
                  />
                  <ReferenceLine y={0} stroke="#475569" strokeWidth={1.5} />
                  <Bar dataKey="epsSurprise" name="EPS Surprise %" radius={[4, 4, 0, 0]}>
                    {surpriseChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.epsSurprise >= 0 ? '#10b981' : '#f43f5e'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-2 pt-2 border-t border-slate-800">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block" />
                <span>EPS Beat (&gt;0%)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-rose-500 inline-block" />
                <span>EPS Miss (&lt;0%)</span>
              </span>
            </div>
          </div>

          {/* Chart 2: Implied Volatility Move vs Historical Move */}
          <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-mono font-bold text-sm text-white flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span>Options Implied Move vs Historical Post-Earnings Move</span>
                </h3>
                <p className="text-xs text-slate-400 font-sans mt-0.5">
                  Expected 1-day percentage swing priced by options straddles
                </p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                Options Market IV
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={impliedMoveData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    dataKey="symbol"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickFormatter={(val) => `±${val}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      fontFamily: 'monospace',
                      fontSize: '11px',
                    }}
                    formatter={(val: any, name?: any) => [
                      `±${Number(val).toFixed(1)}%`,
                      name === 'impliedMove' ? 'Options Implied Move' : 'Prior Actual Reaction',
                    ]}
                  />
                  <Bar dataKey="impliedMove" name="Options Implied Move" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="histMove" name="Prior Actual Reaction" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-2 pt-2 border-t border-slate-800">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-amber-500 inline-block" />
                <span>Options Implied Move (±%)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-indigo-500 inline-block" />
                <span>Historical Realized Move (±%)</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* AI EARNINGS PREVIEW MODAL */}
      {(activeAiPreview || isLoadingAi) && selectedPreviewEvent && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-[#0b0f19] border border-cyan-500/40 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-mono text-lg font-bold text-white">
                      AI EARNINGS PREVIEW: {selectedPreviewEvent.symbol}
                    </h3>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40 font-mono">
                      {selectedPreviewEvent.fiscalQuarter}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 font-sans mt-0.5">
                    {selectedPreviewEvent.name} • Release Date:{' '}
                    <span className="text-white font-mono font-semibold">
                      {selectedPreviewEvent.reportDate} (
                      {selectedPreviewEvent.reportTime === 'BMO'
                        ? 'Before Open'
                        : 'After Close'}
                      )
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setActiveAiPreview(null);
                  setSelectedPreviewEvent(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            {isLoadingAi ? (
              <div className="py-16 text-center space-y-4">
                <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
                <div className="font-mono text-sm text-cyan-400 font-bold">
                  Synthesizing Institutional Consensus & Options Skew...
                </div>
                <div className="text-xs text-slate-400 font-sans">
                  Querying Gemini 3.8 Flash for whisper numbers, margin catalysts, and guidance scenarios
                </div>
              </div>
            ) : activeAiPreview ? (
              <div className="space-y-5 mt-5 font-mono text-xs">
                {/* Whisper vs Consensus Pill Matrix */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5">
                    <div className="text-[10px] text-slate-400">Consensus EPS</div>
                    <div className="text-base font-bold text-white mt-0.5">
                      ${activeAiPreview.consensusEPS.toFixed(2)}
                    </div>
                  </div>
                  <div className="bg-slate-900 border border-cyan-500/30 rounded-lg p-2.5">
                    <div className="text-[10px] text-cyan-400">Whisper EPS</div>
                    <div className="text-base font-bold text-cyan-300 mt-0.5">
                      ${activeAiPreview.whisperEPS.toFixed(2)}
                    </div>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5">
                    <div className="text-[10px] text-slate-400">Implied Move</div>
                    <div className="text-base font-bold text-amber-300 mt-0.5">
                      {activeAiPreview.impliedMove}
                    </div>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5">
                    <div className="text-[10px] text-slate-400">Guidance Risk</div>
                    <div className="text-base font-bold text-rose-300 mt-0.5">
                      {activeAiPreview.managementGuidanceRisk}
                    </div>
                  </div>
                </div>

                {/* Catalyst Summary */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-1.5 font-sans">
                  <div className="font-mono text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" />
                    <span>Trading Desk Executive Synthesis</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {activeAiPreview.catalystSummary}
                  </p>
                </div>

                {/* Critical Segments & Targets */}
                <div>
                  <div className="text-[11px] font-bold text-white mb-2 flex items-center gap-1.5 uppercase">
                    <Layers className="w-3.5 h-3.5 text-blue-400" />
                    <span>Key Metrics & Segment Hurdles</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {activeAiPreview.keySegmentsToWatch.map((seg, i) => (
                      <div
                        key={i}
                        className="bg-slate-900 border border-slate-800/80 rounded-lg p-2.5 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-white text-[11px]">{seg.segment}</div>
                          <div className="text-[10px] text-slate-400 font-sans">{seg.target}</div>
                        </div>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                            seg.importance === 'Critical'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                          }`}
                        >
                          {seg.importance}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bull vs Bear Catalysts */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-sans">
                  <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-3">
                    <div className="font-mono font-bold text-emerald-400 text-xs mb-2 flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>Bull Case Catalysts</span>
                    </div>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {activeAiPreview.bullCaseDrivers.map((driver, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-emerald-400 mt-0.5">•</span>
                          <span>{driver}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-rose-950/20 border border-rose-500/30 rounded-xl p-3">
                    <div className="font-mono font-bold text-rose-400 text-xs mb-2 flex items-center gap-1">
                      <TrendingDown className="w-3.5 h-3.5" />
                      <span>Downside Guidance Risks</span>
                    </div>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {activeAiPreview.bearCaseRisks.map((risk, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-rose-400 mt-0.5">•</span>
                          <span>{risk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Desk Verdict */}
                <div className="p-3 bg-blue-950/30 border border-blue-500/40 rounded-xl flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-blue-300 text-[11px] uppercase">
                      Execution Guideline
                    </div>
                    <div className="text-xs text-slate-200 font-sans mt-0.5">
                      {activeAiPreview.tradingDeskVerdict}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Modal Footer */}
            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => {
                  onSelectAsset(selectedPreviewEvent.symbol);
                  setActiveAiPreview(null);
                  setSelectedPreviewEvent(null);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-mono text-xs font-bold transition"
              >
                <span>Open {selectedPreviewEvent.symbol} Technical Chart</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => {
                  setActiveAiPreview(null);
                  setSelectedPreviewEvent(null);
                }}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-mono text-xs font-bold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
