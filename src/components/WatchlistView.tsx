import React, { useState } from 'react';
import { MarketAsset, AssetClass, Region } from '../types/market.ts';
import { VolatilityHeatmap } from './VolatilityHeatmap.tsx';
import { exportAssetsToCsv } from '../utils/csvExport.ts';
import { 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Trash2, 
  BarChart2, 
  Bell, 
  ArrowUpDown, 
  Filter, 
  Eye,
  Table,
  Flame,
  Download,
  ShieldCheck
} from 'lucide-react';

interface WatchlistViewProps {
  assets: MarketAsset[];
  onSelectAsset: (symbol: string) => void;
  onAnalyzeStock: (symbol: string) => void;
  onOpenAlertModal: (symbol: string, currentPrice: number) => void;
  onRemoveFromWatchlist: (symbol: string) => void;
  onAddNewAsset: (asset: MarketAsset) => void;
  onOpenSmartMoney?: (symbol: string) => void;
}

export const WatchlistView: React.FC<WatchlistViewProps> = ({
  assets,
  onSelectAsset,
  onAnalyzeStock,
  onOpenAlertModal,
  onRemoveFromWatchlist,
  onAddNewAsset,
  onOpenSmartMoney,
}) => {
  const [filterClass, setFilterClass] = useState<string>('all');
  const [displayMode, setDisplayMode] = useState<'table' | 'heatmap'>('table');
  const [showAddModal, setShowAddModal] = useState(false);
  const [sortField, setSortField] = useState<keyof MarketAsset>('changePercent');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // New asset form state
  const [newSymbol, setNewSymbol] = useState('');
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('100.00');
  const [newRegion, setNewRegion] = useState<Region>('US');
  const [newClass, setNewClass] = useState<AssetClass>('stock');

  const filtered = assets.filter((a) => {
    if (filterClass === 'all') return true;
    if (filterClass === 'us') return a.region === 'US';
    if (filterClass === 'aus') return a.region === 'AUS';
    if (filterClass === 'commodity') return a.assetClass === 'commodity';
    if (filterClass === 'crypto') return a.assetClass === 'crypto';
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const valA = a[sortField] ?? 0;
    const valB = b[sortField] ?? 0;
    if (typeof valA === 'number' && typeof valB === 'number') {
      return sortAsc ? valA - valB : valB - valA;
    }
    return 0;
  });

  const handleSort = (field: keyof MarketAsset) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const handleCreateAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSymbol.trim()) return;
    const priceNum = parseFloat(newPrice) || 100.0;
    const item: MarketAsset = {
      symbol: newSymbol.trim().toUpperCase(),
      name: newName.trim() || `${newSymbol.toUpperCase()} Asset`,
      exchange: newRegion === 'AUS' ? 'ASX' : 'NASDAQ',
      price: priceNum,
      change: +(priceNum * 0.015).toFixed(2),
      changePercent: 1.5,
      currency: newRegion === 'AUS' ? 'AUD' : 'USD',
      assetClass: newClass,
      region: newRegion,
      dayHigh: +(priceNum * 1.02).toFixed(2),
      dayLow: +(priceNum * 0.98).toFixed(2),
      open: +(priceNum * 0.99).toFixed(2),
      previousClose: +(priceNum * 0.985).toFixed(2),
      volume: '1.2M',
      high52w: +(priceNum * 1.25).toFixed(2),
      low52w: +(priceNum * 0.75).toFixed(2),
      rsi: 54.0,
      sparkline: [priceNum * 0.96, priceNum * 0.98, priceNum * 0.97, priceNum * 1.01, priceNum],
    };
    onAddNewAsset(item);
    setShowAddModal(false);
    setNewSymbol('');
    setNewName('');
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Actions Bar */}
      <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-4">
        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
          {[
            { id: 'all', label: 'All Watchlist' },
            { id: 'us', label: '🇺🇸 US Equities' },
            { id: 'aus', label: '🇦🇺 Australian (ASX)' },
            { id: 'commodity', label: '🥇 Commodities' },
            { id: 'crypto', label: '⚡ Crypto' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterClass(tab.id)}
              className={`px-3 py-1.5 rounded-lg transition-all font-semibold ${
                filterClass === tab.id
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* View Mode & Add Asset Buttons */}
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setDisplayMode('table')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition ${
                displayMode === 'table' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Table className="w-3.5 h-3.5" /> Table
            </button>
            <button
              onClick={() => setDisplayMode('heatmap')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition ${
                displayMode === 'heatmap' ? 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-rose-400" /> Volatility Heatmap
            </button>
          </div>

          <button
            onClick={() => exportAssetsToCsv(sorted, `watchlist_${filterClass}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold rounded-lg transition shadow cursor-pointer"
            title="Download current watchlist as CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold rounded-lg transition shadow cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Ticker
          </button>
        </div>
      </div>

      {displayMode === 'heatmap' ? (
        <VolatilityHeatmap
          assets={filtered}
          onSelectAsset={onSelectAsset}
          onAnalyzeStock={onAnalyzeStock}
        />
      ) : (
        /* Watchlist Table */
        <div className="bg-[#0b0f19] border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#070b13] border-b border-slate-800 text-[11px] text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4 font-semibold cursor-pointer" onClick={() => handleSort('symbol')}>
                  <div className="flex items-center gap-1">
                    Symbol <ArrowUpDown className="w-3 h-3 text-slate-600" />
                  </div>
                </th>
                <th className="py-3.5 px-4 font-semibold cursor-pointer text-right" onClick={() => handleSort('price')}>
                  <div className="flex items-center justify-end gap-1">
                    Price <ArrowUpDown className="w-3 h-3 text-slate-600" />
                  </div>
                </th>
                <th className="py-3.5 px-4 font-semibold cursor-pointer text-right" onClick={() => handleSort('changePercent')}>
                  <div className="flex items-center justify-end gap-1">
                    24h Change <ArrowUpDown className="w-3 h-3 text-slate-600" />
                  </div>
                </th>
                <th className="py-3.5 px-4 font-semibold text-center hidden md:table-cell">
                  24h Range (Low — High)
                </th>
                <th className="py-3.5 px-4 font-semibold text-right hidden sm:table-cell">Volume</th>
                <th className="py-3.5 px-4 font-semibold text-right hidden lg:table-cell">Market Cap</th>
                <th className="py-3.5 px-4 font-semibold text-center hidden lg:table-cell">RSI (14D)</th>
                <th className="py-3.5 px-4 font-semibold text-center hidden sm:table-cell">7D Sparkline</th>
                <th className="py-3.5 px-4 font-semibold text-right">Terminal Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {sorted.map((asset) => {
                const isGain = asset.change >= 0;
                const rangePct = Math.max(
                  0,
                  Math.min(
                    100,
                    ((asset.price - asset.dayLow) / Math.max(asset.dayHigh - asset.dayLow, 0.01)) * 100
                  )
                );

                return (
                  <tr key={asset.symbol} className="hover:bg-slate-900/50 transition group">
                    {/* Symbol & Name */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div>
                          <div className="font-bold text-white text-sm tracking-tight flex items-center gap-1.5">
                            {asset.symbol}
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-normal">
                              {asset.exchange}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-sans truncate max-w-[140px]">
                            {asset.name}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Price */}
                    <td className="py-3 px-4 text-right font-bold text-white text-sm">
                      ${asset.price.toFixed(asset.assetClass === 'forex' ? 4 : 2)}
                    </td>

                    {/* Change % and $ */}
                    <td className="py-3 px-4 text-right font-bold">
                      <div className={`flex items-center justify-end gap-1 ${isGain ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isGain ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                        <span>
                          {isGain ? '+' : ''}{asset.changePercent.toFixed(2)}%
                        </span>
                      </div>
                      <div className={`text-[10px] font-normal ${isGain ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {isGain ? '+' : ''}{asset.change.toFixed(2)}
                      </div>
                    </td>

                    {/* 24h Range Bar */}
                    <td className="py-3 px-4 hidden md:table-cell">
                      <div className="w-32 mx-auto space-y-1">
                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden relative">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${rangePct}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                          <span>${asset.dayLow.toFixed(1)}</span>
                          <span>${asset.dayHigh.toFixed(1)}</span>
                        </div>
                      </div>
                    </td>

                    {/* Volume */}
                    <td className="py-3 px-4 text-right text-slate-300 hidden sm:table-cell">
                      {asset.volume}
                    </td>

                    {/* Market Cap */}
                    <td className="py-3 px-4 text-right text-slate-300 hidden lg:table-cell">
                      {asset.marketCap || '---'}
                    </td>

                    {/* RSI */}
                    <td className="py-3 px-4 text-center hidden lg:table-cell">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        (asset.rsi || 50) > 70
                          ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          : (asset.rsi || 50) < 30
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-300'
                      }`}>
                        {asset.rsi || 52}
                      </span>
                    </td>

                    {/* Sparkline mini SVG */}
                    <td className="py-3 px-4 text-center hidden sm:table-cell">
                      <svg width="68" height="22" className="inline-block">
                        <polyline
                          fill="none"
                          stroke={isGain ? '#10b981' : '#f43f5e'}
                          strokeWidth="1.5"
                          points={asset.sparkline
                            .map((val, idx) => {
                              const x = (idx / (asset.sparkline.length - 1)) * 64 + 2;
                              const min = Math.min(...asset.sparkline);
                              const max = Math.max(...asset.sparkline);
                              const y = 20 - ((val - min) / Math.max(max - min, 0.01)) * 18;
                              return `${x},${y}`;
                            })
                            .join(' ')}
                        />
                      </svg>
                    </td>

                    {/* Terminal Action Buttons */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {onOpenSmartMoney && (
                          <button
                            onClick={() => onOpenSmartMoney(asset.symbol)}
                            title="Inspect Smart Money Flow & Whales"
                            className="p-1.5 rounded-lg bg-emerald-600/15 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 transition cursor-pointer"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => onAnalyzeStock(asset.symbol)}
                          title="Run Gemini AI Deep-Dive"
                          className="p-1.5 rounded-lg bg-blue-600/15 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/30 transition cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onSelectAsset(asset.symbol)}
                          title="Open Chart & Indicators"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                        >
                          <BarChart2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onOpenAlertModal(asset.symbol, asset.price)}
                          title="Set Price/RSI Alert"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-600/20 text-slate-400 hover:text-amber-400 transition cursor-pointer"
                        >
                          <Bell className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onRemoveFromWatchlist(asset.symbol)}
                          title="Remove from Watchlist"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600/20 text-slate-500 hover:text-rose-400 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* Modal: Add New Symbol */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-400" /> Add Ticker to Watchlist
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-500 hover:text-white text-xs font-mono"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleCreateAsset} className="space-y-3 font-mono text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Symbol / Ticker</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AMD, PLTR, CBA.AX, ETHUSD"
                  value={newSymbol}
                  onChange={(e) => setNewSymbol(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white placeholder-slate-600 focus:outline-hidden focus:border-blue-500 font-bold uppercase"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Company / Asset Name</label>
                <input
                  type="text"
                  placeholder="e.g. Advanced Micro Devices"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white placeholder-slate-600 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Current Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-hidden focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Market Region</label>
                  <select
                    value={newRegion}
                    onChange={(e) => setNewRegion(e.target.value as Region)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-hidden focus:border-blue-500"
                  >
                    <option value="US">US (NYSE/NASDAQ)</option>
                    <option value="AUS">Australia (ASX)</option>
                    <option value="EU">Europe (LSE)</option>
                    <option value="ASIA">Asia (TSE/HK)</option>
                    <option value="GLOBAL">Global Commodity/Crypto</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition shadow"
                >
                  Save to Watchlist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
