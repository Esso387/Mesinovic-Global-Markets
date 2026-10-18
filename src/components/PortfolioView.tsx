import React, { useState } from 'react';
import { PortfolioPosition, PortfolioReview, MarketAsset } from '../types/market.ts';
import { 
  Briefcase, 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  Plus, 
  Trash2, 
  PieChart, 
  ShieldCheck, 
  AlertTriangle, 
  RefreshCw,
  DollarSign,
  ArrowUpRight
} from 'lucide-react';

interface PortfolioViewProps {
  positions: PortfolioPosition[];
  assets: MarketAsset[];
  onAddPosition: (pos: PortfolioPosition) => void;
  onRemovePosition: (id: string) => void;
  onAnalyzeStock: (symbol: string) => void;
}

export const PortfolioView: React.FC<PortfolioViewProps> = ({
  positions,
  assets,
  onAddPosition,
  onRemovePosition,
  onAnalyzeStock,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [review, setReview] = useState<PortfolioReview | null>({
    healthGrade: 'A-',
    diversificationScore: 84,
    riskLevel: 'Moderate-Aggressive',
    summary: 'High-conviction portfolio with formidable exposure to semiconductor and cloud infrastructure titans, counterbalanced by Australian mining dividends and hard asset inflation hedges.',
    sectorBreakdown: [
      { sector: 'Technology & AI', weight: 46 },
      { sector: 'Materials & Mining', weight: 22 },
      { sector: 'Energy & LNG', weight: 14 },
      { sector: 'Digital Assets (Crypto)', weight: 12 },
      { sector: 'Cash & Reserves', weight: 6 },
    ],
    recommendations: [
      'Top holding (NVDA) represents ~38% of total equity. Consider taking partial profits if it approaches $150 to lock in alpha.',
      'Aussie resource exposure (BHP.AX, WDS.AX) provides a solid 5.8% blended dividend yield, serving as an inflation shield.',
      'Maintain disciplined stop-loss policies on high-beta crypto allocations.',
    ],
    sharpeRatio: '1.92',
    beta: '1.16',
  });

  // New position form state
  const [symbol, setSymbol] = useState('NVDA');
  const [shares, setShares] = useState('10');
  const [avgCost, setAvgCost] = useState('130.00');

  // Calculate live portfolio metrics
  const positionsWithLive = positions.map((pos) => {
    const liveAsset = assets.find((a) => a.symbol === pos.symbol);
    const price = liveAsset ? liveAsset.price : pos.currentPrice;
    const marketValue = price * pos.shares;
    const totalCost = pos.avgCost * pos.shares;
    const gainLoss = marketValue - totalCost;
    const gainLossPercent = totalCost > 0 ? (gainLoss / totalCost) * 100 : 0;
    return {
      ...pos,
      currentPrice: price,
      marketValue,
      totalCost,
      gainLoss,
      gainLossPercent,
    };
  });

  const totalValue = positionsWithLive.reduce((acc, p) => acc + p.marketValue, 0);
  const totalCost = positionsWithLive.reduce((acc, p) => acc + p.totalCost, 0);
  const totalGainLoss = totalValue - totalCost;
  const totalReturnPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

  const handleRunReview = async () => {
    setIsReviewing(true);
    try {
      const res = await fetch('/api/ai/portfolio-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          holdings: positionsWithLive.map((p) => ({
            symbol: p.symbol,
            value: p.marketValue,
            weight: +(p.marketValue / totalValue * 100).toFixed(1),
          })),
          totalValue,
        }),
      });
      if (res.ok) {
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          const data: PortfolioReview = await res.json();
          setReview(data);
          return;
        }
      }
      throw new Error(`API returned status ${res.status}`);
    } catch (err) {
      console.warn('Portfolio review fallback:', err);
    } finally {
      setIsReviewing(false);
    }
  };

  const handleCreatePosition = (e: React.FormEvent) => {
    e.preventDefault();
    const liveAsset = assets.find((a) => a.symbol === symbol);
    const costNum = parseFloat(avgCost) || 100;
    const sharesNum = parseFloat(shares) || 1;

    const newPos: PortfolioPosition = {
      id: Date.now().toString(),
      symbol: symbol.toUpperCase(),
      name: liveAsset?.name || `${symbol} Holding`,
      shares: sharesNum,
      avgCost: costNum,
      currentPrice: liveAsset?.price || costNum,
      currency: liveAsset?.currency || 'USD',
      sector: liveAsset?.sector || 'Diversified Equity',
      assetClass: liveAsset?.assetClass || 'stock',
    };

    onAddPosition(newPos);
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Portfolio Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-5 shadow-xl">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Total Portfolio Equity</span>
            <Briefcase className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-extrabold text-white mt-1">
            ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-sans">
            Cost Basis: ${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-5 shadow-xl">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Total Unrealized Return</span>
            {totalGainLoss >= 0 ? <TrendingUp className="w-4 h-4 text-emerald-400" /> : <TrendingDown className="w-4 h-4 text-rose-400" />}
          </div>
          <div className={`text-2xl font-extrabold mt-1 ${totalGainLoss >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {totalGainLoss >= 0 ? '+' : ''}${totalGainLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className={`text-[11px] font-bold ${totalGainLoss >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            {totalReturnPercent >= 0 ? '+' : ''}{totalReturnPercent.toFixed(2)}% Overall
          </div>
        </div>

        <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-5 shadow-xl">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Portfolio Beta & Sharpe</span>
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-extrabold text-cyan-400 mt-1">
            {review?.sharpeRatio || '1.85'} SR
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Beta: {review?.beta || '1.14'} (Market Relative)
          </div>
        </div>

        <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-5 shadow-xl">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>AI Health Grade</span>
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-extrabold text-purple-400">{review?.healthGrade || 'A-'}</span>
            <span className="text-xs text-slate-400">({review?.diversificationScore || 82}/100)</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Risk: {review?.riskLevel || 'Moderate'}
          </div>
        </div>
      </div>

      {/* Holdings Table with Action Bar */}
      <div className="bg-[#0b0f19] border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-slate-800/80 bg-slate-900/50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
              Portfolio Holdings ({positions.length})
            </h4>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400">
              Live Valuations
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRunReview}
              disabled={isReviewing}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-xs font-mono font-bold rounded-lg transition shadow disabled:opacity-50"
            >
              {isReviewing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              AI CIO Health Check
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold rounded-lg transition shadow"
            >
              <Plus className="w-3.5 h-3.5" /> Add Transaction
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#070b13] border-b border-slate-800 text-[11px] text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Asset</th>
                <th className="py-3 px-4 text-right">Shares</th>
                <th className="py-3 px-4 text-right">Avg Cost</th>
                <th className="py-3 px-4 text-right">Current Price</th>
                <th className="py-3 px-4 text-right">Market Value</th>
                <th className="py-3 px-4 text-right">Unrealized P&L</th>
                <th className="py-3 px-4 text-right">Allocation</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {positionsWithLive.map((pos) => {
                const isGain = pos.gainLoss >= 0;
                const weight = totalValue > 0 ? (pos.marketValue / totalValue) * 100 : 0;

                return (
                  <tr key={pos.id} className="hover:bg-slate-900/50 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-white text-sm">{pos.symbol}</div>
                      <div className="text-[11px] text-slate-400 font-sans">{pos.name}</div>
                    </td>
                    <td className="py-3 px-4 text-right text-slate-200">{pos.shares}</td>
                    <td className="py-3 px-4 text-right text-slate-400">${pos.avgCost.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right font-bold text-white">${pos.currentPrice.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right font-bold text-white">${pos.marketValue.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right font-bold">
                      <div className={isGain ? 'text-emerald-400' : 'text-rose-400'}>
                        {isGain ? '+' : ''}${pos.gainLoss.toFixed(2)}
                      </div>
                      <div className={`text-[10px] ${isGain ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {isGain ? '+' : ''}{pos.gainLossPercent.toFixed(2)}%
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right text-cyan-400 font-bold">{weight.toFixed(1)}%</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onAnalyzeStock(pos.symbol)}
                          title="Analyze holding with AI"
                          className="p-1.5 rounded-lg bg-blue-500/15 hover:bg-blue-600 text-blue-400 hover:text-white transition"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onRemovePosition(pos.id)}
                          title="Delete holding"
                          className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-600 hover:text-rose-400 transition"
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

      {/* AI Portfolio Review Card */}
      {review && (
        <div className="bg-linear-to-r from-slate-900 via-[#0d1424] to-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <h4 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
                Gemini Institutional Portfolio Review
              </h4>
            </div>
            <span className="text-xs font-mono font-bold px-3 py-1 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
              Grade: {review.healthGrade} • {review.riskLevel}
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            {review.summary}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Sector Weights */}
            <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800/80">
              <div className="text-xs font-mono font-bold text-slate-300 mb-3 flex items-center gap-1.5">
                <PieChart className="w-3.5 h-3.5 text-blue-400" /> Sector Weight Distribution
              </div>
              <div className="space-y-2">
                {review.sectorBreakdown.map((sec, idx) => (
                  <div key={idx} className="space-y-1 font-mono text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span>{sec.sector}</span>
                      <span className="font-bold">{sec.weight}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${sec.weight}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tactical Recommendations */}
            <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800/80">
              <div className="text-xs font-mono font-bold text-emerald-400 mb-3 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> CIO Rebalancing & Risk Directives
              </div>
              <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
                {review.recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Position */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-blue-400" /> Add Portfolio Position
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-500 hover:text-white text-xs font-mono"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleCreatePosition} className="space-y-3 font-mono text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Asset Symbol</label>
                <select
                  value={symbol}
                  onChange={(e) => {
                    setSymbol(e.target.value);
                    const found = assets.find((a) => a.symbol === e.target.value);
                    if (found) setAvgCost(found.price.toFixed(2));
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-bold"
                >
                  {assets.map((a) => (
                    <option key={a.symbol} value={a.symbol}>
                      {a.symbol} — {a.name} (${a.price.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Number of Shares</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={shares}
                    onChange={(e) => setShares(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Average Cost Per Share ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={avgCost}
                    onChange={(e) => setAvgCost(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-bold"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition shadow"
                >
                  Log Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
