import React, { useState } from 'react';
import { AlertTrigger, MarketAsset } from '../types/market.ts';
import { 
  Bell, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownRight, 
  Activity,
  Sparkles,
  RefreshCw
} from 'lucide-react';

interface AlertsManagerProps {
  alerts: AlertTrigger[];
  assets: MarketAsset[];
  onAddAlert: (alert: AlertTrigger) => void;
  onRemoveAlert: (id: string) => void;
  onResetAlert: (id: string) => void;
  onAnalyzeStock: (symbol: string) => void;
}

export const AlertsManager: React.FC<AlertsManagerProps> = ({
  alerts,
  assets,
  onAddAlert,
  onRemoveAlert,
  onResetAlert,
  onAnalyzeStock,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [symbol, setSymbol] = useState('NVDA');
  const [condition, setCondition] = useState<AlertTrigger['condition']>('ABOVE');
  const [targetValue, setTargetValue] = useState('140.00');
  const [notes, setNotes] = useState('');

  const activeAlerts = alerts.filter((a) => !a.triggered);
  const triggeredAlerts = alerts.filter((a) => a.triggered);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const newAlert: AlertTrigger = {
      id: Date.now().toString(),
      symbol: symbol.toUpperCase(),
      condition,
      targetValue: parseFloat(targetValue) || 100,
      triggered: false,
      createdAt: new Date().toLocaleDateString(),
      notes: notes || undefined,
    };
    onAddAlert(newAlert);
    setShowModal(false);
    setNotes('');
  };

  const getConditionLabel = (cond: AlertTrigger['condition'], val: number) => {
    switch (cond) {
      case 'ABOVE':
        return `Crosses Above $${val.toFixed(2)}`;
      case 'BELOW':
        return `Drops Below $${val.toFixed(2)}`;
      case 'RSI_OVERSOLD':
        return `RSI Drops Below ${val} (Oversold Entry)`;
      case 'RSI_OVERBOUGHT':
        return `RSI Rises Above ${val} (Overbought)`;
      case 'SENTIMENT_CHANGE':
        return `Sentiment Shift Threshold ${val}/100`;
      default:
        return `Target: ${val}`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Fast Action */}
      <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-amber-400" />
          <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
            Real-time Technical & Price Alert Engine
          </h3>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
            {activeAlerts.length} Active Triggers
          </span>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-mono font-bold rounded-lg transition shadow"
        >
          <Plus className="w-3.5 h-3.5" /> Set New Alert
        </button>
      </div>

      {/* Active Alerts Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400">
          <span className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-blue-400" /> Active Monitoring Watch
          </span>
          <span>Continuously checked against live market ticks</span>
        </div>

        {activeAlerts.length === 0 ? (
          <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-8 text-center text-xs text-slate-500 font-mono">
            No active triggers configured. Set a price breakout or RSI threshold to monitor in real-time.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeAlerts.map((alt) => {
              const currentAsset = assets.find((a) => a.symbol === alt.symbol);
              const currentPrice = currentAsset?.price || 0;

              return (
                <div
                  key={alt.id}
                  className="bg-[#0b0f19] border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-mono font-bold text-white">{alt.symbol}</span>
                        {currentAsset && (
                          <span className="text-xs font-mono text-slate-400">
                            Now: ${currentPrice.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => onRemoveAlert(alt.id)}
                        className="text-slate-600 hover:text-rose-400 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="mt-2 text-xs font-mono font-bold text-amber-400 flex items-center gap-1.5">
                      {alt.condition === 'ABOVE' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                      {getConditionLabel(alt.condition, alt.targetValue)}
                    </div>

                    {alt.notes && (
                      <p className="text-[11px] text-slate-400 mt-2 font-sans italic bg-slate-950 p-2 rounded border border-slate-800/60">
                        "{alt.notes}"
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-500">
                    <span>Created: {alt.createdAt}</span>
                    <button
                      onClick={() => onAnalyzeStock(alt.symbol)}
                      className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" /> Analyze
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Triggered Alerts History */}
      {triggeredAlerts.length > 0 && (
        <div className="space-y-3 pt-4">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span className="font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Triggered Event Log
            </span>
            <span>{triggeredAlerts.length} Events Fired</span>
          </div>

          <div className="bg-[#0b0f19] border border-slate-800 rounded-xl divide-y divide-slate-800/70 overflow-hidden">
            {triggeredAlerts.map((alt) => (
              <div key={alt.id} className="p-3 sm:p-4 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-3">
                  <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                  </span>
                  <div>
                    <div className="font-bold text-white flex items-center gap-2">
                      <span>{alt.symbol}</span>
                      <span className="text-emerald-400 font-normal">
                        Condition met: {getConditionLabel(alt.condition, alt.targetValue)}
                      </span>
                    </div>
                    {alt.notes && <div className="text-[11px] text-slate-400 font-sans">{alt.notes}</div>}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onResetAlert(alt.id)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded transition flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" /> Re-arm
                  </button>
                  <button
                    onClick={() => onRemoveAlert(alt.id)}
                    className="p-1.5 rounded hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Set New Alert */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-400" /> Configure Technical Trigger
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-500 hover:text-white text-xs font-mono"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3 font-mono text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Target Ticker Symbol</label>
                <select
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-bold"
                >
                  {assets.map((a) => (
                    <option key={a.symbol} value={a.symbol}>
                      {a.symbol} — {a.name} (${a.price.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Condition Trigger</label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as AlertTrigger['condition'])}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                >
                  <option value="ABOVE">Price Crosses Above Threshold</option>
                  <option value="BELOW">Price Drops Below Floor</option>
                  <option value="RSI_OVERSOLD">RSI Drops Below Level (&lt; 30 Oversold)</option>
                  <option value="RSI_OVERBOUGHT">RSI Exceeds Level (&gt; 70 Overbought)</option>
                  <option value="SENTIMENT_CHANGE">Market Sentiment Score Threshold</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Target Numeric Value</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-bold"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Alert Notes / Strategy Rationale</label>
                <input
                  type="text"
                  placeholder="e.g. Exit on technical resistance test"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white placeholder-slate-600 font-sans"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg transition shadow"
                >
                  Arm Alert Trigger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
