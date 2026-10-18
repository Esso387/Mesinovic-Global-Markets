import React, { useState } from 'react';
import { MarketAsset } from '../types/market.ts';
import { exportAssetsToCsv, exportVolatilityToCsv, exportEarningsToCsv, exportSmartMoneyToCsv } from '../utils/csvExport.ts';
import { getEarningsCalendarForAssets } from '../data/mockEarningsData.ts';
import {
  INSIDER_TRADES,
  WHALE_FILINGS,
  DARK_POOL_BLOCKS,
  UNUSUAL_OPTIONS_SWEEPS,
  CONGRESSIONAL_TRADES,
} from '../data/mockSmartMoneyData.ts';
import { 
  Download, 
  FileSpreadsheet, 
  X, 
  CheckCircle2, 
  Layers, 
  Filter, 
  Flame, 
  Database,
  ArrowRight,
  Calendar,
  ShieldCheck
} from 'lucide-react';

interface ExportDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: MarketAsset[];
  onNotify?: (title: string, desc: string) => void;
}

export const ExportDataModal: React.FC<ExportDataModalProps> = ({
  isOpen,
  onClose,
  assets,
  onNotify,
}) => {
  const [exportType, setExportType] = useState<'all' | 'us' | 'aus' | 'commodities_crypto' | 'volatility' | 'earnings' | 'smart_money'>('all');
  const [includeExtendedMetrics, setIncludeExtendedMetrics] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  // Filter assets based on exportType
  const targetAssets = assets.filter((a) => {
    if (exportType === 'all' || exportType === 'volatility' || exportType === 'earnings' || exportType === 'smart_money') return true;
    if (exportType === 'us') return a.region === 'US';
    if (exportType === 'aus') return a.region === 'AUS';
    if (exportType === 'commodities_crypto') return a.assetClass === 'commodity' || a.assetClass === 'crypto';
    return true;
  });

  const handleExport = () => {
    setIsExporting(true);

    try {
      if (exportType === 'smart_money') {
        const result = exportSmartMoneyToCsv({
          insiderTrades: INSIDER_TRADES,
          whaleFilings: WHALE_FILINGS,
          darkPoolBlocks: DARK_POOL_BLOCKS,
          optionsSweeps: UNUSUAL_OPTIONS_SWEEPS,
          congressionalTrades: CONGRESSIONAL_TRADES,
        }, 'smart_money_institutional_intelligence');
        if (result.success && onNotify) {
          onNotify(
            'Smart Money CSV Exported',
            `Exported ${result.rowCount} institutional transactions to ${result.filename}`
          );
        }
      } else if (exportType === 'earnings') {
        const events = getEarningsCalendarForAssets(assets);
        const result = exportEarningsToCsv(events, 'earnings_calendar_announcements');
        if (result.success && onNotify) {
          onNotify(
            'Earnings Calendar CSV Exported',
            `Exported ${result.rowCount} earnings announcements to ${result.filename}`
          );
        }
      } else if (exportType === 'volatility') {
        const result = exportVolatilityToCsv(targetAssets, '30D');
        if (result.success && onNotify) {
          onNotify(
            'Volatility CSV Exported',
            `Exported ${result.rowCount} assets to ${result.filename}`
          );
        }
      } else {
        const prefix = 
          exportType === 'us' ? 'us_equities_data' :
          exportType === 'aus' ? 'asx_equities_data' :
          exportType === 'commodities_crypto' ? 'commodities_crypto_data' :
          'global_watchlist_market_data';

        const result = exportAssetsToCsv(targetAssets, prefix);
        if (result.success && onNotify) {
          onNotify(
            'Watchlist CSV Exported',
            `Successfully exported ${result.rowCount} records to ${result.filename}`
          );
        }
      }
      setTimeout(() => {
        setIsExporting(false);
        onClose();
      }, 400);
    } catch (err) {
      console.error('Export error:', err);
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-mono">
      <div 
        className="bg-[#0b0f19] border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-xs relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>Export Market Data to CSV</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-bold">
                  EXCEL & SHEETS
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                Generate clean, UTF-8 formatted comma-separated files of your current terminal watchlists and metrics.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white text-base font-bold p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Export Scope Selector */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-cyan-400" /> Select Data Scope:
          </label>

          <div className="grid grid-cols-1 gap-2">
            {[
              {
                id: 'all',
                title: 'Entire Global Watchlist',
                desc: `All ${assets.length} tracked equities, indices, commodities & crypto`,
                icon: Layers,
                count: assets.length,
              },
              {
                id: 'us',
                title: 'US Equities Only (NASDAQ / NYSE)',
                desc: 'Mega-cap tech and American market tickers',
                icon: Filter,
                count: assets.filter((a) => a.region === 'US').length,
              },
              {
                id: 'aus',
                title: 'Australian Equities Only (ASX)',
                desc: 'BHP, CBA, CSL, Woodside and Aussie leaders',
                icon: Filter,
                count: assets.filter((a) => a.region === 'AUS').length,
              },
              {
                id: 'commodities_crypto',
                title: 'Commodities & Digital Assets',
                desc: 'Gold, Crude Oil, Bitcoin and alternative assets',
                icon: Filter,
                count: assets.filter((a) => a.assetClass === 'commodity' || a.assetClass === 'crypto').length,
              },
              {
                id: 'volatility',
                title: 'Volatility & Quantitative Risk Metrics',
                desc: 'Daily standard deviation, annualized σ, and risk tiers',
                icon: Flame,
                count: assets.length,
              },
              {
                id: 'earnings',
                title: 'Earnings Calendar & Surprises',
                desc: 'Upcoming quarterly announcements, estimated EPS, revenue surprises & implied moves',
                icon: Calendar,
                count: getEarningsCalendarForAssets(assets).length,
              },
              {
                id: 'smart_money',
                title: 'Smart Money & Institutional Flow Intelligence',
                desc: '13F hedge fund whales, Form 4 insider clusters, dark pool prints & unusual options sweeps',
                icon: ShieldCheck,
                count: INSIDER_TRADES.length + WHALE_FILINGS.length + DARK_POOL_BLOCKS.length + UNUSUAL_OPTIONS_SWEEPS.length,
              },
            ].map((opt) => {
              const Icon = opt.icon;
              const isSelected = exportType === opt.id;

              return (
                <div
                  key={opt.id}
                  onClick={() => setExportType(opt.id as any)}
                  className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-blue-600/15 border-blue-500/50 text-white shadow-md shadow-blue-500/10'
                      : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400'
                    }`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-bold flex items-center gap-1.5">
                        <span>{opt.title}</span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />}
                      </div>
                      <div className="text-[10px] text-slate-400 font-sans">{opt.desc}</div>
                    </div>
                  </div>
                  <div className="text-right pl-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900 border border-slate-800 text-slate-300">
                      {opt.count} rows
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Data Fields Included Info Box */}
        <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-1.5">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
            Included Fields in CSV:
          </div>
          <div className="text-[10px] text-slate-300 font-sans leading-relaxed flex flex-wrap gap-1">
            {exportType === 'volatility' ? (
              ['Symbol', 'Company Name', 'Sector', 'Current Price', 'Daily Return %', 'Daily StdDev %', 'Annualized Volatility (σ)', 'Risk Tier', 'Market Cap', 'Currency', 'Calculation Timestamp'].map((f) => (
                <span key={f} className="px-1.5 py-0.5 rounded bg-slate-900 text-cyan-300 border border-slate-800">
                  {f}
                </span>
              ))
            ) : (
              ['Symbol', 'Name', 'Exchange', 'Price', 'Change ($ / %)', 'Day High / Low', 'Open / Prev Close', '52w High / Low', 'Volume', 'Market Cap', 'P/E', 'Dividend Yield', 'RSI (14D)'].map((f) => (
                <span key={f} className="px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                  {f}
                </span>
              ))
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg font-bold transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting || targetAssets.length === 0}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition flex items-center gap-2 shadow-lg shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Generating CSV...' : `Download CSV (${targetAssets.length} Assets)`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
