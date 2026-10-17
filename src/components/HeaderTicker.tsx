import React, { useState, useEffect } from 'react';
import { MarketAsset } from '../types/market.ts';
import { TrendingUp, TrendingDown, Clock, Activity, Search, ShieldCheck } from 'lucide-react';

interface HeaderTickerProps {
  assets: MarketAsset[];
  onSelectAsset: (symbol: string) => void;
  selectedSymbol: string;
}

export const HeaderTicker: React.FC<HeaderTickerProps> = ({
  assets,
  onSelectAsset,
  selectedSymbol,
}) => {
  const [time, setTime] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState('');

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

  return (
    <header className="border-b border-slate-800 bg-[#060911] text-slate-200 sticky top-0 z-40 shadow-xl">
      {/* Top Utility Ribbon */}
      <div className="px-4 py-1.5 bg-[#04060b] border-b border-slate-900 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400 gap-3">
        {/* Market Centers Status */}
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-slate-300 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            GLOBAL INTELLIGENCE NETWORK
          </span>
          <span className="hidden sm:inline text-slate-600">|</span>
          <span className="hidden sm:flex items-center gap-1">
            <span className="text-slate-500">NYC (EST):</span>
            <span className="text-slate-200">{formatMarketTime(-4)}</span>
          </span>
          <span className="hidden sm:flex items-center gap-1">
            <span className="text-slate-500">SYDNEY (AEST):</span>
            <span className="text-slate-200">{formatMarketTime(10)}</span>
          </span>
          <span className="hidden md:flex items-center gap-1">
            <span className="text-slate-500">LONDON (GMT):</span>
            <span className="text-slate-200">{formatMarketTime(1)}</span>
          </span>
          <span className="hidden md:flex items-center gap-1">
            <span className="text-slate-500">TOKYO (JST):</span>
            <span className="text-slate-200">{formatMarketTime(9)}</span>
          </span>
        </div>

        {/* System & Gemini Health */}
        <div className="flex items-center gap-3 ml-auto">
          <div className="flex items-center gap-1.5 text-cyan-400 font-semibold">
            <Activity className="w-3.5 h-3.5" />
            <span>AI: ONLINE</span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-1 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="text-[10px]">TICK: REALTIME (1.5s)</span>
          </div>
        </div>
      </div>

      {/* Main Rolling Ticker Tape */}
      <div className="px-4 py-2 flex items-center gap-4 overflow-hidden relative">
        {/* Ticker items strip */}
        <div className="flex items-center gap-6 overflow-x-auto no-scrollbar scroll-smooth whitespace-nowrap py-0.5">
          {assets.map((asset) => {
            const isUp = asset.change >= 0;
            const isSelected = asset.symbol === selectedSymbol;

            return (
              <button
                key={asset.symbol}
                onClick={() => onSelectAsset(asset.symbol)}
                className={`flex items-center gap-2.5 px-3 py-1 rounded-lg text-xs font-mono transition-all border ${
                  isSelected
                    ? 'bg-blue-600/20 border-blue-500/60 shadow-sm'
                    : 'bg-slate-950/60 hover:bg-slate-900 border-slate-800/80'
                }`}
              >
                <span className="font-bold text-white tracking-tight">{asset.symbol}</span>
                <span className="text-slate-300 font-medium">${asset.price.toFixed(asset.assetClass === 'forex' ? 4 : 2)}</span>
                <span
                  className={`flex items-center text-[11px] font-semibold ${
                    isUp ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {isUp ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                  {isUp ? '+' : ''}
                  {asset.changePercent.toFixed(2)}%
                </span>
              </button>
            );
          })}
        </div>

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
            <div className="absolute right-0 top-full mt-1.5 w-64 bg-[#0b0f19] border border-slate-800 rounded-xl shadow-2xl p-1.5 z-50">
              {filtered.slice(0, 5).map((a) => (
                <button
                  key={a.symbol}
                  onClick={() => {
                    onSelectAsset(a.symbol);
                    setSearchQuery('');
                  }}
                  className="w-full text-left p-2 rounded-lg hover:bg-slate-800/80 flex items-center justify-between text-xs font-mono"
                >
                  <div>
                    <div className="font-bold text-white">{a.symbol}</div>
                    <div className="text-[10px] text-slate-400 truncate max-w-[140px]">{a.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-slate-200">${a.price.toFixed(2)}</div>
                    <div className={`text-[10px] ${a.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {a.change >= 0 ? '+' : ''}{a.changePercent.toFixed(2)}%
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
