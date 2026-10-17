import React, { useState, useMemo } from 'react';
import { Candle, AIStockAnalysis } from '../types/market.ts';
import { TrendingUp, BarChart2, Eye, Sliders, Layers } from 'lucide-react';

interface InteractiveChartProps {
  candles: Candle[];
  symbol: string;
  name: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  currency: string;
  timeframe: string;
  onTimeframeChange: (tf: string) => void;
  aiAnalysis?: AIStockAnalysis | null;
}

export const InteractiveChart: React.FC<InteractiveChartProps> = ({
  candles,
  symbol,
  name,
  currentPrice,
  change,
  changePercent,
  currency,
  timeframe,
  onTimeframeChange,
  aiAnalysis,
}) => {
  const [chartType, setChartType] = useState<'candles' | 'line'>('candles');
  const [showSMA, setShowSMA] = useState<boolean>(true);
  const [showEMA, setShowEMA] = useState<boolean>(true);
  const [showSR, setShowSR] = useState<boolean>(true);
  const [showRSI, setShowRSI] = useState<boolean>(true);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Chart dimensions
  const width = 860;
  const mainHeight = 360;
  const rsiHeight = 110;
  const padding = { top: 20, right: 65, bottom: 25, left: 10 };

  const activeCandle = hoverIndex !== null && candles[hoverIndex] ? candles[hoverIndex] : candles[candles.length - 1];

  // Price range calculation
  const { minPrice, maxPrice, priceRange, maxVol } = useMemo(() => {
    if (!candles || candles.length === 0) return { minPrice: 0, maxPrice: 100, priceRange: 100, maxVol: 1 };
    let min = Infinity;
    let max = -Infinity;
    let mv = 0;

    candles.forEach((c) => {
      if (c.low < min) min = c.low;
      if (c.high > max) max = c.high;
      if (c.volume > mv) mv = c.volume;
    });

    // Also factor in AI support/resistance if enabled
    if (showSR && aiAnalysis) {
      aiAnalysis.supportLevels?.forEach((s) => {
        if (s < min && s > min * 0.8) min = s;
      });
      aiAnalysis.resistanceLevels?.forEach((r) => {
        if (r > max && r < max * 1.2) max = r;
      });
    }

    const margin = (max - min) * 0.08 || 1;
    return {
      minPrice: min - margin,
      maxPrice: max + margin,
      priceRange: max - min + margin * 2 || 1,
      maxVol: mv || 1,
    };
  }, [candles, showSR, aiAnalysis]);

  // Coordinates helper
  const getX = (idx: number) => {
    const usableW = width - padding.left - padding.right;
    return padding.left + (idx / Math.max(candles.length - 1, 1)) * usableW;
  };

  const getY = (price: number) => {
    const usableH = mainHeight - padding.top - padding.bottom;
    const norm = (price - minPrice) / priceRange;
    return mainHeight - padding.bottom - norm * usableH;
  };

  const getRsiY = (rsiVal: number) => {
    const norm = Math.max(0, Math.min(100, rsiVal)) / 100;
    return rsiHeight - 20 - norm * (rsiHeight - 35);
  };

  // SVG paths
  const linePath = useMemo(() => {
    if (candles.length === 0) return '';
    return candles.reduce((acc, c, i) => {
      const x = getX(i);
      const y = getY(c.close);
      return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  }, [candles, minPrice, priceRange]);

  const areaPath = useMemo(() => {
    if (candles.length === 0) return '';
    const baseLine = linePath;
    const lastX = getX(candles.length - 1);
    const firstX = getX(0);
    const bottomY = mainHeight - padding.bottom;
    return `${baseLine} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  }, [linePath, candles]);

  const smaPath = useMemo(() => {
    if (!showSMA) return '';
    const valid = candles.map((c, i) => ({ val: c.sma20, idx: i })).filter((item) => typeof item.val === 'number');
    if (valid.length === 0) return '';
    return valid.reduce((acc, item, i) => {
      const x = getX(item.idx);
      const y = getY(item.val!);
      return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  }, [candles, showSMA, minPrice, priceRange]);

  const emaPath = useMemo(() => {
    if (!showEMA) return '';
    const valid = candles.map((c, i) => ({ val: c.ema50, idx: i })).filter((item) => typeof item.val === 'number');
    if (valid.length === 0) return '';
    return valid.reduce((acc, item, i) => {
      const x = getX(item.idx);
      const y = getY(item.val!);
      return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  }, [candles, showEMA, minPrice, priceRange]);

  const rsiPath = useMemo(() => {
    if (!showRSI) return '';
    const valid = candles.map((c, i) => ({ val: c.rsi, idx: i })).filter((item) => typeof item.val === 'number');
    if (valid.length === 0) return '';
    return valid.reduce((acc, item, i) => {
      const x = getX(item.idx);
      const y = getRsiY(item.val!);
      return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  }, [candles, showRSI]);

  // Handle mouse move for crosshair
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const usableW = width - padding.left - padding.right;
    const ratio = Math.max(0, Math.min(1, (mouseX - padding.left) / usableW));
    const idx = Math.round(ratio * (candles.length - 1));
    setHoverIndex(idx);
  };

  const isUp = change >= 0;

  return (
    <div className="bg-[#0b0f19] border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col">
      {/* Chart Top HUD Header */}
      <div className="p-4 border-b border-slate-800/80 bg-slate-900/60 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-xl font-bold tracking-tight text-white">{symbol}</span>
            <span className="text-sm text-slate-400 font-medium">{name}</span>
            <span className="px-2 py-0.5 rounded text-xs font-mono font-semibold bg-slate-800 text-slate-300 border border-slate-700">
              {currency}
            </span>
            {aiAnalysis && (
              <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                aiAnalysis.opinion === 'BUY' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' :
                aiAnalysis.opinion === 'SELL' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' :
                'bg-amber-500/20 text-amber-400 border border-amber-500/40'
              }`}>
                AI: {aiAnalysis.opinion} ({aiAnalysis.confidenceScore}%)
              </span>
            )}
          </div>

          {/* Dynamic Price & Candle Inspection Bar */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs mt-1.5 font-mono">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-white tracking-tight">
                ${activeCandle ? activeCandle.close.toFixed(2) : currentPrice.toFixed(2)}
              </span>
              <span className={`font-semibold ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isUp ? '+' : ''}{change.toFixed(2)} ({isUp ? '+' : ''}{changePercent.toFixed(2)}%)
              </span>
            </div>
            {activeCandle && (
              <div className="flex items-center gap-3 text-slate-400 border-l border-slate-800 pl-4">
                <span>O: <strong className="text-slate-200">{activeCandle.open.toFixed(2)}</strong></span>
                <span>H: <strong className="text-slate-200">{activeCandle.high.toFixed(2)}</strong></span>
                <span>L: <strong className="text-slate-200">{activeCandle.low.toFixed(2)}</strong></span>
                <span>C: <strong className="text-slate-200">{activeCandle.close.toFixed(2)}</strong></span>
                <span>Vol: <strong className="text-slate-200">{activeCandle.volume.toLocaleString()}</strong></span>
                {activeCandle.rsi && (
                  <span className="text-cyan-400">RSI: <strong>{activeCandle.rsi}</strong></span>
                )}
                <span className="text-slate-500 font-sans text-[11px]">{activeCandle.date}</span>
              </div>
            )}
          </div>
        </div>

        {/* Chart Controls & Timeframe Selector */}
        <div className="flex items-center gap-3">
          {/* Timeframe buttons */}
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
            {['1D', '1W', '1M', '3M', '1Y', '5Y'].map((tf) => (
              <button
                key={tf}
                onClick={() => onTimeframeChange(tf)}
                className={`px-2.5 py-1 rounded transition-all ${
                  timeframe === tf
                    ? 'bg-blue-600 text-white font-bold shadow'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Chart Type Toggle */}
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setChartType('candles')}
              className={`p-1.5 rounded transition ${
                chartType === 'candles' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Candlestick View"
            >
              <BarChart2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setChartType('line')}
              className={`p-1.5 rounded transition ${
                chartType === 'line' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Area Line View"
            >
              <TrendingUp className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Technical Indicator Toggles */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 px-2 py-1 rounded-lg border border-slate-800 text-[11px] font-mono">
            <button
              onClick={() => setShowSMA(!showSMA)}
              className={`px-2 py-0.5 rounded transition ${
                showSMA ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'text-slate-500'
              }`}
            >
              SMA 20
            </button>
            <button
              onClick={() => setShowEMA(!showEMA)}
              className={`px-2 py-0.5 rounded transition ${
                showEMA ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'text-slate-500'
              }`}
            >
              EMA 50
            </button>
            <button
              onClick={() => setShowSR(!showSR)}
              className={`px-2 py-0.5 rounded transition ${
                showSR ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40' : 'text-slate-500'
              }`}
            >
              AI S/R
            </button>
            <button
              onClick={() => setShowRSI(!showRSI)}
              className={`px-2 py-0.5 rounded transition ${
                showRSI ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'text-slate-500'
              }`}
            >
              RSI
            </button>
          </div>
        </div>
      </div>

      {/* Main SVG Chart Canvas */}
      <div className="relative select-none bg-[#090d16]">
        <svg
          viewBox={`0 0 ${width} ${mainHeight}`}
          className="w-full h-auto block"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
              <stop offset="85%" stopColor="#3b82f6" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="bullishCandle" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <linearGradient id="bearishCandle" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" />
              <stop offset="100%" stopColor="#e11d48" />
            </linearGradient>
          </defs>

          {/* Grid lines (horizontal price steps) */}
          {[0.2, 0.4, 0.6, 0.8].map((ratio, i) => {
            const priceVal = minPrice + priceRange * ratio;
            const y = getY(priceVal);
            return (
              <g key={i}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#1e293b"
                  strokeDasharray="3 3"
                  strokeWidth="0.8"
                />
                <text
                  x={width - padding.right + 6}
                  y={y + 3}
                  fill="#64748b"
                  fontSize="10"
                  fontFamily="JetBrains Mono, monospace"
                >
                  ${priceVal.toFixed(2)}
                </text>
              </g>
            );
          })}

          {/* AI Support and Resistance lines */}
          {showSR && aiAnalysis && (
            <>
              {aiAnalysis.resistanceLevels?.slice(0, 2).map((lvl, idx) => {
                const y = getY(lvl);
                return (
                  <g key={`res-${idx}`}>
                    <line
                      x1={padding.left}
                      y1={y}
                      x2={width - padding.right}
                      y2={y}
                      stroke="#f43f5e"
                      strokeWidth="1.2"
                      strokeDasharray="4 2"
                      opacity="0.75"
                    />
                    <rect
                      x={width - padding.right + 4}
                      y={y - 8}
                      width={56}
                      height={15}
                      fill="#881337"
                      rx="2"
                    />
                    <text
                      x={width - padding.right + 7}
                      y={y + 3}
                      fill="#fecdd3"
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      R{idx + 1}: ${lvl.toFixed(1)}
                    </text>
                  </g>
                );
              })}

              {aiAnalysis.supportLevels?.slice(0, 2).map((lvl, idx) => {
                const y = getY(lvl);
                return (
                  <g key={`sup-${idx}`}>
                    <line
                      x1={padding.left}
                      y1={y}
                      x2={width - padding.right}
                      y2={y}
                      stroke="#10b981"
                      strokeWidth="1.2"
                      strokeDasharray="4 2"
                      opacity="0.75"
                    />
                    <rect
                      x={width - padding.right + 4}
                      y={y - 8}
                      width={56}
                      height={15}
                      fill="#064e3b"
                      rx="2"
                    />
                    <text
                      x={width - padding.right + 7}
                      y={y + 3}
                      fill="#a7f3d0"
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      S{idx + 1}: ${lvl.toFixed(1)}
                    </text>
                  </g>
                );
              })}
            </>
          )}

          {/* Volume bars behind candles */}
          {candles.map((c, i) => {
            const x = getX(i);
            const usableW = width - padding.left - padding.right;
            const barW = Math.max(2, (usableW / candles.length) * 0.6);
            const volH = (c.volume / maxVol) * 60;
            const y = mainHeight - padding.bottom - volH;
            const isUpCandle = c.close >= c.open;
            return (
              <rect
                key={`vol-${i}`}
                x={x - barW / 2}
                y={y}
                width={barW}
                height={volH}
                fill={isUpCandle ? '#059669' : '#e11d48'}
                opacity={0.35}
                rx={1}
              />
            );
          })}

          {/* Line Chart Mode */}
          {chartType === 'line' && (
            <>
              <path d={areaPath} fill="url(#areaGradient)" />
              <path d={linePath} fill="none" stroke="#3b82f6" strokeWidth="2.2" strokeLinejoin="round" />
            </>
          )}

          {/* Candlesticks Mode */}
          {chartType === 'candles' && (
            <g>
              {candles.map((c, i) => {
                const x = getX(i);
                const usableW = width - padding.left - padding.right;
                const candleW = Math.max(3, (usableW / candles.length) * 0.7);
                const isGreen = c.close >= c.open;
                const highY = getY(c.high);
                const lowY = getY(c.low);
                const openY = getY(c.open);
                const closeY = getY(c.close);
                const bodyY = Math.min(openY, closeY);
                const bodyH = Math.max(1.8, Math.abs(closeY - openY));

                return (
                  <g key={`candle-${i}`}>
                    {/* High/Low Wick */}
                    <line
                      x1={x}
                      y1={highY}
                      x2={x}
                      y2={lowY}
                      stroke={isGreen ? '#10b981' : '#f43f5e'}
                      strokeWidth="1.2"
                    />
                    {/* Candle Body */}
                    <rect
                      x={x - candleW / 2}
                      y={bodyY}
                      width={candleW}
                      height={bodyH}
                      fill={isGreen ? 'url(#bullishCandle)' : 'url(#bearishCandle)'}
                      rx="1"
                    />
                  </g>
                );
              })}
            </g>
          )}

          {/* SMA 20 line */}
          {showSMA && smaPath && (
            <path d={smaPath} fill="none" stroke="#f59e0b" strokeWidth="1.6" opacity="0.85" />
          )}

          {/* EMA 50 line */}
          {showEMA && emaPath && (
            <path d={emaPath} fill="none" stroke="#06b6d4" strokeWidth="1.6" opacity="0.85" />
          )}

          {/* Crosshair on hover */}
          {hoverIndex !== null && activeCandle && (
            <g>
              {/* Vertical line */}
              <line
                x1={getX(hoverIndex)}
                y1={padding.top}
                x2={getX(hoverIndex)}
                y2={mainHeight - padding.bottom}
                stroke="#94a3b8"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              {/* Horizontal line */}
              <line
                x1={padding.left}
                y1={getY(activeCandle.close)}
                x2={width - padding.right}
                y2={getY(activeCandle.close)}
                stroke="#94a3b8"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              {/* Crosshair Price Badge */}
              <rect
                x={width - padding.right + 2}
                y={getY(activeCandle.close) - 9}
                width={58}
                height={18}
                fill="#3b82f6"
                rx="3"
              />
              <text
                x={width - padding.right + 7}
                y={getY(activeCandle.close) + 4}
                fill="#ffffff"
                fontSize="10"
                fontWeight="bold"
                fontFamily="JetBrains Mono, monospace"
              >
                ${activeCandle.close.toFixed(2)}
              </text>
            </g>
          )}

          {/* Current Live Price Pulsing Dot */}
          {candles.length > 0 && (
            <g>
              <circle
                cx={getX(candles.length - 1)}
                cy={getY(currentPrice)}
                r="4.5"
                fill={isUp ? '#10b981' : '#f43f5e'}
              />
              <circle
                cx={getX(candles.length - 1)}
                cy={getY(currentPrice)}
                r="9"
                fill="none"
                stroke={isUp ? '#10b981' : '#f43f5e'}
                strokeWidth="1.5"
                opacity="0.5"
                className="animate-ping"
              />
            </g>
          )}
        </svg>

        {/* RSI Sub-chart Panel */}
        {showRSI && (
          <div className="border-t border-slate-800 bg-[#070b13] pt-2 px-2 pb-1">
            <div className="flex items-center justify-between text-[11px] font-mono px-3 text-slate-400">
              <div className="flex items-center gap-2">
                <span className="font-bold text-cyan-400">RSI (14)</span>
                <span className="text-white font-bold">{activeCandle?.rsi || 50}</span>
                <span className="text-[10px] text-slate-500">
                  {((activeCandle?.rsi || 50) > 70) ? '• Overbought (>70)' : ((activeCandle?.rsi || 50) < 30) ? '• Oversold (<30)' : '• Balanced'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-[10px]">
                <span className="text-rose-400">OB: 70</span>
                <span className="text-slate-500">MID: 50</span>
                <span className="text-emerald-400">OS: 30</span>
              </div>
            </div>

            <svg viewBox={`0 0 ${width} ${rsiHeight}`} className="w-full h-auto block select-none">
              {/* Overbought 70 line */}
              <line
                x1={padding.left}
                y1={getRsiY(70)}
                x2={width - padding.right}
                y2={getRsiY(70)}
                stroke="#f43f5e"
                strokeWidth="1"
                strokeDasharray="3 3"
                opacity="0.6"
              />
              {/* Midline 50 */}
              <line
                x1={padding.left}
                y1={getRsiY(50)}
                x2={width - padding.right}
                y2={getRsiY(50)}
                stroke="#334155"
                strokeWidth="0.8"
                strokeDasharray="2 2"
              />
              {/* Oversold 30 line */}
              <line
                x1={padding.left}
                y1={getRsiY(30)}
                x2={width - padding.right}
                y2={getRsiY(30)}
                stroke="#10b981"
                strokeWidth="1"
                strokeDasharray="3 3"
                opacity="0.6"
              />

              {/* Shaded Oversold / Overbought Zones */}
              <rect
                x={padding.left}
                y={getRsiY(100)}
                width={width - padding.left - padding.right}
                height={getRsiY(70) - getRsiY(100)}
                fill="#f43f5e"
                opacity="0.05"
              />
              <rect
                x={padding.left}
                y={getRsiY(30)}
                width={width - padding.left - padding.right}
                height={getRsiY(0) - getRsiY(30)}
                fill="#10b981"
                opacity="0.05"
              />

              {/* RSI Oscillating Line */}
              {rsiPath && (
                <path d={rsiPath} fill="none" stroke="#38bdf8" strokeWidth="1.8" strokeLinejoin="round" />
              )}

              {/* Crosshair indicator on RSI */}
              {hoverIndex !== null && activeCandle?.rsi && (
                <circle
                  cx={getX(hoverIndex)}
                  cy={getRsiY(activeCandle.rsi)}
                  r="3.5"
                  fill="#38bdf8"
                />
              )}
            </svg>
          </div>
        )}
      </div>

      {/* Chart Footer Indicator Legend */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-900/40 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2 font-mono">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-amber-400 inline-block rounded"></span> SMA (20)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-cyan-400 inline-block rounded"></span> EMA (50)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-purple-400 border-b border-dashed inline-block"></span> AI Support & Resistance
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-emerald-500/30 border border-emerald-500/60 inline-block rounded-xs"></span> Volume
          </span>
        </div>
        <div className="text-[11px] text-slate-500 flex items-center gap-2">
          <span>Feed: Real-time Sim Tick (1.5s)</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
        </div>
      </div>
    </div>
  );
};
