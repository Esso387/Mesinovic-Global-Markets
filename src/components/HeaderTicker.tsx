import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MarketAsset } from '../types/market.ts';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Search,
  ShieldCheck,
  Zap,
  ChevronLeft,
  ChevronRight,
  Info,
  SlidersHorizontal,
  X,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  BarChart3,
  Calendar,
} from 'lucide-react';

interface HeaderTickerProps {
  assets: MarketAsset[];
  onSelectAsset: (symbol: string) => void;
  selectedSymbol: string;
}

type TickerDisplayMode = 'dual' | 'dod_focus' | 'tick_focus';

export const HeaderTicker: React.FC<HeaderTickerProps> = ({
  assets,
  onSelectAsset,
  selectedSymbol,
}) => {
  const [time, setTime] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [displayMode, setDisplayMode] = useState<TickerDisplayMode>('dual');
  const [inspectingAsset, setInspectingAsset] = useState<MarketAsset | null>(null);
  const tickerStripRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatMarketTime = (offsetHours: number) => {
    const d = new Date(time.getTime() + offsetHours * 3600 * 1000);
    return d.toTimeString().slice(0, 5);
  };

  const filtered = searchQuery.trim()
    ? assets.filter(
        (a) =>
          a.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  // Calculate Market-Wide Day-Over-Day Statistics
  const marketDoDStats = useMemo(() => {
    if (!assets || assets.length === 0) return { avgDoD: 0, gainers: 0, losers: 0, total: 0 };
    let sumDoD = 0;
    let gainers = 0;
    let losers = 0;

    assets.forEach((a) => {
      const dod = a.dayOverDayPercent ?? a.changePercent;
      sumDoD += dod;
      if (dod >= 0) gainers++;
      else losers++;
    });

    return {
      avgDoD: sumDoD / assets.length,
      gainers,
      losers,
      total: assets.length,
    };
  }, [assets]);

  const scrollTicker = (direction: 'left' | 'right') => {
    if (tickerStripRef.current) {
      const scrollAmount = direction === 'left' ? -350 : 350;
      tickerStripRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <header className="border-b border-slate-800 bg-[#060911] text-slate-200 sticky top-0 z-40 shadow-xl">
      {/* Top Utility Ribbon */}
      <div className="px-4 py-1.5 bg-[#04060b] border-b border-slate-900 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400 gap-3">
        {/* Market Centers Status & Aggregate DoD Benchmark */}
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
          <span className="flex items-center gap-1.5 text-slate-300 font-semibold tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            GLOBAL INTELLIGENCE NETWORK
          </span>

          <span className="hidden sm:inline text-slate-700">|</span>

          {/* Aggregate Day-Over-Day Benchmark */}
          <div className="flex items-center gap-2 bg-slate-950 px-2 py-0.5 rounded border border-slate-800/80">
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Market DoD Avg:</span>
            <span
              className={`font-semibold flex items-center text-[10px] ${
                marketDoDStats.avgDoD >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {marketDoDStats.avgDoD >= 0 ? <TrendingUp className="w-3 h-3 mr-0.5 inline" /> : <TrendingDown className="w-3 h-3 mr-0.5 inline" />}
              {marketDoDStats.avgDoD >= 0 ? '+' : ''}
              {marketDoDStats.avgDoD.toFixed(2)}%
            </span>
            <span className="text-[10px] text-slate-500">
              ({marketDoDStats.gainers}▲ / {marketDoDStats.losers}▼)
            </span>
          </div>

          <span className="hidden md:inline text-slate-700">|</span>

          {/* Clocks */}
          <span className="hidden sm:flex items-center gap-1">
            <span className="text-slate-500">NYC:</span>
            <span className="text-slate-200">{formatMarketTime(-4)}</span>
          </span>
          <span className="hidden sm:flex items-center gap-1">
            <span className="text-slate-500">LON:</span>
            <span className="text-slate-200">{formatMarketTime(1)}</span>
          </span>
          <span className="hidden lg:flex items-center gap-1">
            <span className="text-slate-500">TYO:</span>
            <span className="text-slate-200">{formatMarketTime(9)}</span>
          </span>
          <span className="hidden lg:flex items-center gap-1">
            <span className="text-slate-500">SYD:</span>
            <span className="text-slate-200">{formatMarketTime(10)}</span>
          </span>
        </div>

        {/* System & Mode Controls */}
        <div className="flex items-center gap-3 ml-auto">
          {/* Display Mode Switcher */}
          <div className="hidden sm:flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[10px]">
            <button
              onClick={() => setDisplayMode('dual')}
              title="Show Real-Time Tick and Day-Over-Day % side by side"
              className={`px-2 py-0.5 rounded transition-all font-medium ${
                displayMode === 'dual'
                  ? 'bg-blue-600 text-white shadow-xs font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Dual (Tick + DoD)
            </button>
            <button
              onClick={() => setDisplayMode('dod_focus')}
              title="Emphasize Day-Over-Day (DoD) Percentage Change"
              className={`px-2 py-0.5 rounded transition-all font-medium ${
                displayMode === 'dod_focus'
                  ? 'bg-blue-600 text-white shadow-xs font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              DoD Focus
            </button>
            <button
              onClick={() => setDisplayMode('tick_focus')}
              title="Emphasize Real-Time Tick Delta"
              className={`px-2 py-0.5 rounded transition-all font-medium ${
                displayMode === 'tick_focus'
                  ? 'bg-blue-600 text-white shadow-xs font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Tick Focus
            </button>
          </div>

          <span className="hidden sm:inline text-slate-700">|</span>

          <div className="flex items-center gap-1 text-cyan-400">
            <Zap className="w-3.5 h-3.5 fill-cyan-400/20" />
            <span className="text-[10px] hidden md:inline">TICK: LIVE (1.5s)</span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-1 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="text-[10px]">VERIFIED FEED</span>
          </div>
        </div>
      </div>

      {/* Main Rolling Ticker Tape */}
      <div className="px-3 py-1.5 flex items-center gap-2 overflow-hidden relative">
        {/* Scroll Left Button */}
        <button
          onClick={() => scrollTicker('left')}
          className="p-1 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white shrink-0 transition-all z-10"
          title="Scroll ticker left"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Ticker items strip */}
        <div
          ref={tickerStripRef}
          className="flex items-center gap-2.5 overflow-x-auto no-scrollbar scroll-smooth whitespace-nowrap py-0.5 flex-1"
        >
          {assets.map((asset) => {
            const isSelected = asset.symbol === selectedSymbol;

            // Day-Over-Day calculations
            const priorClose = asset.previousClose || (asset.price - asset.change);
            const dodPercent = asset.dayOverDayPercent ?? asset.changePercent;
            const dodChange = asset.dayOverDayChange ?? asset.change;
            const isDoDUp = dodPercent >= 0;

            // Real-Time Tick calculations
            const tickDelta = asset.lastTickDelta ?? +(asset.change * 0.05);
            const tickPct = asset.lastTickPercent ?? +(asset.changePercent * 0.06);
            const isTickUp = (tickPct >= 0);

            // Flash animation state
            const flashColor =
              asset.tickFlash === 'up'
                ? 'ring-1 ring-emerald-500/80 bg-emerald-950/20'
                : asset.tickFlash === 'down'
                ? 'ring-1 ring-rose-500/80 bg-rose-950/20'
                : '';

            return (
              <div
                key={asset.symbol}
                className={`group flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono transition-all border shrink-0 ${flashColor} ${
                  isSelected
                    ? 'bg-blue-950/40 border-blue-500/70 shadow-sm shadow-blue-500/10'
                    : 'bg-slate-950/80 hover:bg-slate-900 border-slate-800/90 hover:border-slate-700'
                }`}
              >
                {/* Main click to select asset */}
                <button
                  onClick={() => onSelectAsset(asset.symbol)}
                  className="flex items-center gap-2 text-left"
                >
                  <span className="font-bold text-white tracking-tight flex items-center gap-1">
                    {asset.symbol}
                    {asset.tickFlash && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full animate-ping ${
                          asset.tickFlash === 'up' ? 'bg-emerald-400' : 'bg-rose-400'
                        }`}
                      />
                    )}
                  </span>
                  <span className="text-slate-200 font-semibold">
                    ${asset.price.toFixed(asset.assetClass === 'forex' ? 4 : 2)}
                  </span>
                </button>

                {/* DUAL VIEW: Both Real-Time Tick AND Day-Over-Day % */}
                {displayMode === 'dual' && (
                  <div className="flex items-center gap-1.5 border-l border-slate-800 pl-2">
                    {/* 1. Real-Time Tick Indicator */}
                    <div
                      className={`flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                        isTickUp
                          ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/50'
                          : 'bg-rose-950/40 text-rose-300 border-rose-800/50'
                      }`}
                      title={`Latest Real-Time Tick Delta: ${tickDelta >= 0 ? '+' : ''}${tickDelta.toFixed(
                        asset.assetClass === 'forex' ? 4 : 2
                      )} (${tickPct >= 0 ? '+' : ''}${tickPct.toFixed(2)}%)`}
                    >
                      <Zap className="w-2.5 h-2.5 mr-0.5 opacity-80" />
                      <span className="text-[9px] text-slate-400 mr-0.5">TICK:</span>
                      <span>
                        {isTickUp ? '+' : ''}
                        {tickPct.toFixed(2)}%
                      </span>
                    </div>

                    {/* 2. Day-Over-Day (DoD) Percentage Change Comparison */}
                    <div
                      className={`flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                        isDoDUp
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      }`}
                      title={`Day-Over-Day (DoD) Change vs Prior Close ($${priorClose.toFixed(
                        asset.assetClass === 'forex' ? 4 : 2
                      )}): ${isDoDUp ? '+' : ''}${dodChange.toFixed(
                        asset.assetClass === 'forex' ? 4 : 2
                      )} (${isDoDUp ? '+' : ''}${dodPercent.toFixed(2)}%)`}
                    >
                      {isDoDUp ? (
                        <TrendingUp className="w-2.5 h-2.5 mr-0.5" />
                      ) : (
                        <TrendingDown className="w-2.5 h-2.5 mr-0.5" />
                      )}
                      <span className="text-[9px] text-slate-400 mr-0.5">DoD:</span>
                      <span>
                        {isDoDUp ? '+' : ''}
                        {dodPercent.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                )}

                {/* DoD FOCUS VIEW */}
                {displayMode === 'dod_focus' && (
                  <div className="flex items-center gap-1.5 border-l border-slate-800 pl-2">
                    <div
                      className={`flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${
                        isDoDUp
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
                          : 'bg-rose-500/15 text-rose-400 border-rose-500/40'
                      }`}
                      title={`Day-Over-Day: ${isDoDUp ? '+' : ''}${dodPercent.toFixed(2)}% vs Prior Close $${priorClose.toFixed(2)}`}
                    >
                      {isDoDUp ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                      <span className="text-[9px] uppercase tracking-wider text-slate-400 mr-1">DoD:</span>
                      <span>
                        {isDoDUp ? '+' : ''}
                        {dodPercent.toFixed(2)}%
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 hidden xl:inline">
                      Prev: ${priorClose.toFixed(asset.assetClass === 'forex' ? 4 : 2)}
                    </span>
                  </div>
                )}

                {/* TICK FOCUS VIEW */}
                {displayMode === 'tick_focus' && (
                  <div className="flex items-center gap-1.5 border-l border-slate-800 pl-2">
                    <div
                      className={`flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${
                        isTickUp
                          ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/40'
                          : 'bg-amber-500/15 text-amber-400 border-amber-500/40'
                      }`}
                      title={`Latest Real-Time Tick Delta: ${tickDelta >= 0 ? '+' : ''}${tickDelta.toFixed(2)}`}
                    >
                      <Zap className="w-3 h-3 mr-1" />
                      <span className="text-[9px] uppercase tracking-wider text-slate-400 mr-1">LIVE TICK:</span>
                      <span>
                        {isTickUp ? '+' : ''}
                        {tickPct.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                )}

                {/* Quick DoD Inspection Popover Trigger */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setInspectingAsset(asset);
                  }}
                  title={`Inspect Day-Over-Day & Tick Breakdown for ${asset.symbol}`}
                  className="p-1 rounded text-slate-500 hover:text-blue-400 hover:bg-slate-800/80 transition-colors"
                >
                  <Info className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Scroll Right Button */}
        <button
          onClick={() => scrollTicker('right')}
          className="p-1 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white shrink-0 transition-all z-10"
          title="Scroll ticker right"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Quick Search Dropdown */}
        <div className="relative shrink-0 hidden sm:block">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Find ticker..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-white placeholder-slate-600 focus:outline-hidden focus:border-blue-500 w-36 transition-all focus:w-48"
            />
          </div>

          {searchQuery && filtered.length > 0 && (
            <div className="absolute right-0 top-full mt-1.5 w-80 bg-[#0b0f19] border border-slate-800 rounded-xl shadow-2xl p-2 z-50">
              <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 border-b border-slate-800/80 mb-1 flex items-center justify-between">
                <span>Search Results</span>
                <span>Tick vs DoD %</span>
              </div>
              {filtered.slice(0, 6).map((a) => {
                const dodPct = a.dayOverDayPercent ?? a.changePercent;
                const isDoDUp = dodPct >= 0;
                const tickPct = a.lastTickPercent ?? +(a.changePercent * 0.06);
                const isTickUp = tickPct >= 0;

                return (
                  <button
                    key={a.symbol}
                    onClick={() => {
                      onSelectAsset(a.symbol);
                      setSearchQuery('');
                    }}
                    className="w-full text-left p-2 rounded-lg hover:bg-slate-800/80 flex items-center justify-between text-xs font-mono transition-colors"
                  >
                    <div>
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span>{a.symbol}</span>
                        <span className="text-[10px] text-slate-500 px-1 py-0.2 rounded bg-slate-900 border border-slate-800">
                          {a.assetClass}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[130px]">{a.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-slate-200 font-semibold">${a.price.toFixed(a.assetClass === 'forex' ? 4 : 2)}</div>
                      <div className="flex items-center gap-1.5 justify-end mt-0.5">
                        <span
                          className={`text-[9px] px-1 py-0.2 rounded font-semibold ${
                            isTickUp ? 'bg-emerald-950/60 text-emerald-400' : 'bg-rose-950/60 text-rose-400'
                          }`}
                        >
                          Tick: {isTickUp ? '+' : ''}{tickPct.toFixed(2)}%
                        </span>
                        <span
                          className={`text-[9px] px-1 py-0.2 rounded font-semibold ${
                            isDoDUp ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                          }`}
                        >
                          DoD: {isDoDUp ? '+' : ''}{dodPct.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* DAY-OVER-DAY & TICK INTELLIGENCE DOSSIER MODAL */}
      {inspectingAsset && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden font-sans">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    {inspectingAsset.symbol} Day-Over-Day Performance
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30">
                      FORENSIC COMPARISON
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">{inspectingAsset.name} &bull; {inspectingAsset.exchange}</p>
                </div>
              </div>
              <button
                onClick={() => setInspectingAsset(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 font-mono text-xs">
              {/* Primary Comparison Cards */}
              <div className="grid grid-cols-2 gap-3">
                {/* Real-Time Live Price & Tick */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400 flex items-center gap-1 mb-1">
                    <Zap className="w-3 h-3 text-cyan-400" />
                    <span>CURRENT REAL-TIME PRICE</span>
                  </div>
                  <div className="text-xl font-bold text-white">
                    ${inspectingAsset.price.toFixed(inspectingAsset.assetClass === 'forex' ? 4 : 2)}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-[11px]">
                    <span className="text-slate-400">Tick Delta:</span>
                    <span
                      className={`font-semibold ${
                        (inspectingAsset.lastTickPercent ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {(inspectingAsset.lastTickPercent ?? 0) >= 0 ? '+' : ''}
                      {(inspectingAsset.lastTickPercent ?? 0.05).toFixed(3)}%
                    </span>
                  </div>
                </div>

                {/* Day-Over-Day (DoD) Metric */}
                {(() => {
                  const priorClose = inspectingAsset.previousClose || (inspectingAsset.price - inspectingAsset.change);
                  const dodPct = inspectingAsset.dayOverDayPercent ?? inspectingAsset.changePercent;
                  const dodDiff = inspectingAsset.dayOverDayChange ?? inspectingAsset.change;
                  const isUp = dodPct >= 0;

                  return (
                    <div
                      className={`p-3 rounded-xl border ${
                        isUp
                          ? 'bg-emerald-950/20 border-emerald-500/30'
                          : 'bg-rose-950/20 border-rose-500/30'
                      }`}
                    >
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 mb-1">
                        <TrendingUp className={`w-3 h-3 ${isUp ? 'text-emerald-400' : 'text-rose-400'}`} />
                        <span>DAY-OVER-DAY (DoD) CHANGE</span>
                      </div>
                      <div className={`text-xl font-bold ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isUp ? '+' : ''}
                        {dodPct.toFixed(2)}%
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 text-[11px]">
                        <span className="text-slate-400">DoD $:</span>
                        <span className={`font-semibold ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isUp ? '+' : ''}
                          {dodDiff.toFixed(inspectingAsset.assetClass === 'forex' ? 4 : 2)}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Detailed Breakdown Comparison Table */}
              <div className="bg-slate-950 rounded-xl border border-slate-800 p-3 space-y-2">
                <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Price Benchmarks Comparison</span>
                  <span className="text-[10px] text-slate-500">24H Trading Session</span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-900 text-slate-300">
                  <span className="text-slate-400">Prior Session Close (DoD Baseline)</span>
                  <span className="font-bold text-white">
                    ${(inspectingAsset.previousClose || (inspectingAsset.price - inspectingAsset.change)).toFixed(
                      inspectingAsset.assetClass === 'forex' ? 4 : 2
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-900 text-slate-300">
                  <span className="text-slate-400">Session Open Price</span>
                  <span className="font-bold text-white">
                    ${inspectingAsset.open.toFixed(inspectingAsset.assetClass === 'forex' ? 4 : 2)}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-900 text-slate-300">
                  <span className="text-slate-400">Intraday Move (Price vs Open)</span>
                  {(() => {
                    const openDiff = inspectingAsset.price - inspectingAsset.open;
                    const openPct = (openDiff / inspectingAsset.open) * 100;
                    return (
                      <span className={`font-bold ${openPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {openPct >= 0 ? '+' : ''}{openPct.toFixed(2)}% (${openDiff >= 0 ? '+' : ''}{openDiff.toFixed(2)})
                      </span>
                    );
                  })()}
                </div>

                <div className="flex items-center justify-between py-1 text-slate-300">
                  <span className="text-slate-400">Session Day Range (Low — High)</span>
                  <span className="text-slate-200">
                    ${inspectingAsset.dayLow.toFixed(2)} &mdash; ${inspectingAsset.dayHigh.toFixed(2)}
                  </span>
                </div>

                {/* Day Range Needle Bar */}
                {(() => {
                  const range = inspectingAsset.dayHigh - inspectingAsset.dayLow;
                  const pos = range > 0 ? Math.min(100, Math.max(0, ((inspectingAsset.price - inspectingAsset.dayLow) / range) * 100)) : 50;
                  return (
                    <div className="pt-2">
                      <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                        <span>Low: ${inspectingAsset.dayLow.toFixed(2)}</span>
                        <span>Price Location: {pos.toFixed(0)}% of Range</span>
                        <span>High: ${inspectingAsset.dayHigh.toFixed(2)}</span>
                      </div>
                      <div className="w-full bg-slate-900 h-2 rounded-full relative overflow-hidden">
                        <div
                          className="bg-linear-to-r from-blue-500 to-emerald-400 h-full rounded-full"
                          style={{ width: `${pos}%` }}
                        />
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* DoD Velocity & Momentum Insight */}
              <div className="p-3 rounded-xl bg-blue-950/20 border border-blue-500/20 text-slate-300 space-y-1">
                <div className="font-semibold text-blue-400 flex items-center gap-1.5 text-[11px]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Day-Over-Day Momentum Velocity</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                  {inspectingAsset.symbol} is currently tracking at{' '}
                  <strong className="text-white">
                    {(inspectingAsset.dayOverDayPercent ?? inspectingAsset.changePercent) >= 0 ? '+' : ''}
                    {(inspectingAsset.dayOverDayPercent ?? inspectingAsset.changePercent).toFixed(2)}%
                  </strong>{' '}
                  Day-over-Day versus prior close of{' '}
                  <strong className="text-white">
                    ${(inspectingAsset.previousClose || (inspectingAsset.price - inspectingAsset.change)).toFixed(2)}
                  </strong>
                  . The real-time tick engine is streaming updates every 1.5 seconds with{' '}
                  <span className="text-emerald-400 font-semibold">low latency execution</span>.
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between">
              <button
                onClick={() => setInspectingAsset(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium text-xs transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  onSelectAsset(inspectingAsset.symbol);
                  setInspectingAsset(null);
                }}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-1.5 transition-colors shadow-sm shadow-blue-500/20"
              >
                <span>Select & Analyze {inspectingAsset.symbol}</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
