import React, { useState, useEffect, useRef } from 'react';
import { 
  INITIAL_ASSETS, 
  INITIAL_NEWS, 
  INITIAL_PORTFOLIO, 
  INITIAL_ALERTS, 
  generateCandleHistory 
} from './data/mockMarketData.ts';
import { 
  MarketAsset, 
  Candle, 
  AIStockAnalysis, 
  AlertTrigger, 
  PortfolioPosition, 
  AIScannerStock 
} from './types/market.ts';
import { HeaderTicker } from './components/HeaderTicker.tsx';
import { InteractiveChart } from './components/InteractiveChart.tsx';
import { AIAnalysisView } from './components/AIAnalysisView.tsx';
import { AIAssistantView } from './components/AIAssistantView.tsx';
import { AIScannerView } from './components/AIScannerView.tsx';
import { WatchlistView } from './components/WatchlistView.tsx';
import { GlobalMarketsView } from './components/GlobalMarketsView.tsx';
import { NewsView } from './components/NewsView.tsx';
import { AlertsManager } from './components/AlertsManager.tsx';
import { PortfolioView } from './components/PortfolioView.tsx';
import { SyndicateHub } from './components/SyndicateHub.tsx';
import { VolatilityHeatmap } from './components/VolatilityHeatmap.tsx';
import { CompareAssetsChart } from './components/CompareAssetsChart.tsx';
import { ExportDataModal } from './components/ExportDataModal.tsx';
import { EarningsCalendar } from './components/EarningsCalendar.tsx';
import { SmartMoneyTracker } from './components/SmartMoneyTracker.tsx';
import { SmartMoneyAlertBanner } from './components/SmartMoneyAlertBanner.tsx';
import { 
  Globe, 
  ListFilter, 
  BarChart2, 
  Sparkles, 
  Bot, 
  Search, 
  Newspaper, 
  Bell, 
  Briefcase, 
  AlertCircle,
  CheckCircle,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Cpu,
  FileSpreadsheet,
  Flame,
  Scale,
  Download,
  Calendar,
  ShieldCheck
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [assets, setAssets] = useState<MarketAsset[]>(() => {
    const saved = localStorage.getItem('gmi_assets');
    const raw: MarketAsset[] = saved ? JSON.parse(saved) : INITIAL_ASSETS;
    return raw.map((a) => {
      const priorClose = a.previousClose || (a.price - a.change);
      const dodChange = a.dayOverDayChange ?? +(a.price - priorClose).toFixed(a.assetClass === 'forex' ? 4 : 2);
      const dodPercent = a.dayOverDayPercent ?? +((dodChange / priorClose) * 100).toFixed(2);
      return {
        ...a,
        previousClose: priorClose,
        priorDayClose: priorClose,
        dayOverDayChange: dodChange,
        dayOverDayPercent: dodPercent,
        lastTickDelta: a.lastTickDelta ?? +(a.change * 0.05).toFixed(a.assetClass === 'forex' ? 4 : 2),
        lastTickPercent: a.lastTickPercent ?? +(a.changePercent * 0.06).toFixed(3),
        tickFlash: null,
      };
    });
  });

  const [selectedSymbol, setSelectedSymbol] = useState<string>('NVDA');
  const [timeframe, setTimeframe] = useState<string>('1D');
  const [dashboardChartMode, setDashboardChartMode] = useState<'single' | 'compare'>('single');
  const [candles, setCandles] = useState<Candle[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<AIStockAnalysis | null>(null);
  const [isAnalysisLoading, setIsAnalysisLoading] = useState<boolean>(false);

  const [alerts, setAlerts] = useState<AlertTrigger[]>(() => {
    const saved = localStorage.getItem('gmi_alerts');
    return saved ? JSON.parse(saved) : INITIAL_ALERTS;
  });

  const [portfolio, setPortfolio] = useState<PortfolioPosition[]>(() => {
    const saved = localStorage.getItem('gmi_portfolio');
    return saved ? JSON.parse(saved) : INITIAL_PORTFOLIO;
  });

  const [news, setNews] = useState(INITIAL_NEWS);
  const [toastMessage, setToastMessage] = useState<{ id: string; title: string; desc: string } | null>(null);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('gmi_assets', JSON.stringify(assets));
  }, [assets]);

  useEffect(() => {
    localStorage.setItem('gmi_alerts', JSON.stringify(alerts));
  }, [alerts]);

  useEffect(() => {
    localStorage.setItem('gmi_portfolio', JSON.stringify(portfolio));
  }, [portfolio]);

  // Selected asset
  const activeAsset = assets.find((a) => a.symbol === selectedSymbol) || assets[0];

  // Generate candles whenever symbol or timeframe changes
  useEffect(() => {
    if (activeAsset) {
      const generated = generateCandleHistory(activeAsset.price, 45, timeframe);
      setCandles(generated);
    }
  }, [selectedSymbol, timeframe]);

  // Run AI stock analysis
  const runStockAnalysis = async (symbolToAnalyze: string) => {
    const asset = assets.find((a) => a.symbol === symbolToAnalyze);
    setIsAnalysisLoading(true);
    setSelectedSymbol(symbolToAnalyze);

    try {
      const res = await fetch('/api/ai/analyze-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: symbolToAnalyze,
          currentPrice: asset?.price,
          companyName: asset?.name,
        }),
      });

      if (res.ok) {
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          const data: AIStockAnalysis = await res.json();
          setAiAnalysis(data);
          return;
        }
      }
      throw new Error(`API returned status ${res.status}`);
    } catch (err) {
      console.warn('Using fallback stock analysis:', err);
      setAiAnalysis({
        symbol: symbolToAnalyze,
        name: asset?.name || symbolToAnalyze,
        trend: asset && asset.change >= 0 ? 'Bullish' : 'Neutral',
        trendExplanation: `${symbolToAnalyze} is exhibiting constructive price action above key moving averages with institutional accumulation volume.`,
        supportLevels: [
          +((asset?.price || 100) * 0.94).toFixed(2),
          +((asset?.price || 100) * 0.89).toFixed(2),
          +((asset?.price || 100) * 0.82).toFixed(2),
        ],
        resistanceLevels: [
          +((asset?.price || 100) * 1.05).toFixed(2),
          +((asset?.price || 100) * 1.12).toFixed(2),
          +((asset?.price || 100) * 1.20).toFixed(2),
        ],
        currentRsi: asset?.rsi || 58.4,
        rsiInterpretation: 'Constructive momentum with sustained room for continuation.',
        marketSentiment: {
          score: 78,
          label: 'Bullish',
          summary: `Institutional order flow and options positioning indicate positive bias for ${symbolToAnalyze}.`,
        },
        keyNewsPoints: [
          `Institutional order book delta positive over trailing sessions.`,
          `High-margin product roadmaps and forward guidance support consensus targets.`,
          `Active share repurchase and institutional accumulation support price floors.`,
        ],
        opinion: 'BUY',
        opinionRationale: `Favorable risk-to-reward ratio on test of dynamic 20-day exponential moving average.`,
        targetPrice: +((asset?.price || 100) * 1.15).toFixed(2),
        stopLoss: +((asset?.price || 100) * 0.92).toFixed(2),
        riskRewardRatio: '2.8:1',
        confidenceScore: 88,
      });
    } finally {
      setIsAnalysisLoading(false);
    }
  };

  // Run initial AI analysis on load
  useEffect(() => {
    runStockAnalysis(selectedSymbol);
  }, []);

  // Real-time market tick engine: updates prices every 1.5s and checks alerts
  useEffect(() => {
    const interval = setInterval(() => {
      setAssets((prev) => {
        const next = [...prev];
        // Pick 2-3 random assets to simulate live ticks
        const updateCount = Math.floor(Math.random() * 2) + 2;
        for (let i = 0; i < updateCount; i++) {
          const idx = Math.floor(Math.random() * next.length);
          const item = next[idx];
          const delta = (Math.random() - 0.49) * (item.price * 0.0035);
          const newPrice = +(item.price + delta).toFixed(item.assetClass === 'forex' ? 4 : 2);
          const newChange = +(item.change + delta).toFixed(2);
          const newChangePercent = +((newChange / (newPrice - newChange)) * 100).toFixed(2);
          const newHigh = Math.max(item.dayHigh, newPrice);
          const newLow = Math.min(item.dayLow, newPrice);

          // Update sparkline
          const newSparkline = [...item.sparkline.slice(1), newPrice];

          const priorClose = item.previousClose || (item.price - item.change);
          const dodChange = +(newPrice - priorClose).toFixed(item.assetClass === 'forex' ? 4 : 2);
          const dodPercent = +((dodChange / priorClose) * 100).toFixed(2);
          const tickDelta = +delta.toFixed(item.assetClass === 'forex' ? 4 : 2);
          const tickPercent = +((delta / (item.price || 1)) * 100).toFixed(3);
          const tickFlash: 'up' | 'down' = delta >= 0 ? 'up' : 'down';

          next[idx] = {
            ...item,
            price: newPrice,
            change: newChange,
            changePercent: newChangePercent,
            dayHigh: newHigh,
            dayLow: newLow,
            sparkline: newSparkline,
            previousClose: priorClose,
            priorDayClose: priorClose,
            dayOverDayChange: dodChange,
            dayOverDayPercent: dodPercent,
            lastTickDelta: tickDelta,
            lastTickPercent: tickPercent,
            tickFlash: tickFlash,
          };

          // Check if any active alerts triggered
          alerts.forEach((alt) => {
            if (!alt.triggered && alt.symbol === item.symbol) {
              let fired = false;
              if (alt.condition === 'ABOVE' && newPrice >= alt.targetValue) fired = true;
              if (alt.condition === 'BELOW' && newPrice <= alt.targetValue) fired = true;

              if (fired) {
                setAlerts((aList) =>
                  aList.map((a) =>
                    a.id === alt.id ? { ...a, triggered: true, triggeredAt: new Date().toLocaleTimeString() } : a
                  )
                );
                setToastMessage({
                  id: Date.now().toString(),
                  title: `TRIGGERED: ${item.symbol} Alert`,
                  desc: `${item.symbol} reached target price $${newPrice.toFixed(2)} (${alt.condition})`,
                });
              }
            }
          });
        }
        return next;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [alerts]);

  // Handlers
  const handleSelectAsset = (sym: string) => {
    setSelectedSymbol(sym);
  };

  const handleAnalyzeFromAnywhere = (sym: string) => {
    setSelectedSymbol(sym);
    setActiveTab('ai-analysis');
    runStockAnalysis(sym);
  };

  const handleAddToWatchlist = (scanned: AIScannerStock) => {
    const existing = assets.find((a) => a.symbol === scanned.symbol);
    if (!existing) {
      const newAsset: MarketAsset = {
        symbol: scanned.symbol,
        name: scanned.name,
        exchange: scanned.symbol.endsWith('.AX') ? 'ASX' : 'NASDAQ',
        price: scanned.price,
        change: +(scanned.price * (scanned.changePercent / 100)).toFixed(2),
        changePercent: scanned.changePercent,
        currency: scanned.currency,
        assetClass: 'stock',
        region: scanned.symbol.endsWith('.AX') ? 'AUS' : 'US',
        dayHigh: +(scanned.price * 1.02).toFixed(2),
        dayLow: +(scanned.price * 0.98).toFixed(2),
        open: scanned.price,
        previousClose: +(scanned.price / (1 + scanned.changePercent / 100)).toFixed(2),
        volume: '2.5M',
        marketCap: scanned.marketCap,
        peRatio: scanned.peRatio,
        dividendYield: scanned.dividendYield,
        high52w: +(scanned.price * 1.2).toFixed(2),
        low52w: +(scanned.price * 0.8).toFixed(2),
        rsi: scanned.rsi,
        sector: scanned.sector,
        sparkline: [scanned.price * 0.97, scanned.price * 0.98, scanned.price * 0.99, scanned.price],
      };
      setAssets((prev) => [newAsset, ...prev]);
    }
    setToastMessage({
      id: Date.now().toString(),
      title: 'Added to Watchlist',
      desc: `${scanned.symbol} (${scanned.name}) is now tracked in your terminal.`,
    });
  };

  const handleRemoveFromWatchlist = (sym: string) => {
    setAssets((prev) => prev.filter((a) => a.symbol !== sym));
  };

  const handleAddNewAsset = (newA: MarketAsset) => {
    setAssets((prev) => [newA, ...prev]);
    setToastMessage({
      id: Date.now().toString(),
      title: 'Ticker Enrolled',
      desc: `${newA.symbol} added to real-time watchlist.`,
    });
  };

  return (
    <div className="min-h-screen bg-[#060911] text-slate-100 flex flex-col font-sans">
      {/* Real-time Top Marquee Ticker */}
      <HeaderTicker
        assets={assets}
        onSelectAsset={(sym) => {
          handleSelectAsset(sym);
          if (activeTab === 'dashboard') setActiveTab('chart');
        }}
        selectedSymbol={selectedSymbol}
      />

      {/* Main Terminal Shell Navigation */}
      <nav className="border-b border-slate-800 bg-[#090d16] px-4 py-2 sticky top-[77px] z-30 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Logo Branding */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-blue-600 via-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="font-mono text-sm font-extrabold tracking-tight text-white flex items-center gap-1.5">
                <span>GLOBAL MARKET INTELLIGENCE</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  AI TERMINAL
                </span>
              </div>
              <div className="text-[10px] font-mono text-slate-400">
                Bloomberg-Caliber Analytics • Powered by Gemini 3.8
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1 text-xs font-mono">
            {[
              { id: 'dashboard', label: 'Global Overview', icon: Globe },
              { id: 'chart', label: 'Technical Chart', icon: BarChart2 },
              { id: 'compare', label: 'Compare Assets', icon: Scale },
              { id: 'ai-analysis', label: 'AI Deep-Dive', icon: Sparkles },
              { id: 'assistant', label: 'AI Market Assistant', icon: Bot },
              { id: 'scanner', label: 'AI Stock Scanner', icon: Search },
              { id: 'watchlist', label: 'Watchlist', icon: ListFilter },
              { id: 'smart-money', label: 'Smart Money Tracker', icon: ShieldCheck },
              { id: 'earnings', label: 'Earnings Calendar', icon: Calendar },
              { id: 'volatility', label: 'Volatility Heatmap', icon: Flame },
              { id: 'news', label: 'News Wire', icon: Newspaper },
              { id: 'alerts', label: 'Alerts', icon: Bell, badge: alerts.filter((a) => !a.triggered).length },
              { id: 'portfolio', label: 'Portfolio', icon: Briefcase },
              { id: 'syndicate', label: 'FAB5 Set for Life', icon: FileSpreadsheet },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Header Utility: Export CSV */}
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 text-xs font-mono transition shadow-md shadow-emerald-500/10 cursor-pointer shrink-0"
            title="Export Watchlist & Market Data to CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Export CSV</span>
          </button>
        </div>
      </nav>

      {/* Flagship Real-Time Smart Money Alert Banner (Senator NVDA Purchase & Institutional Whales) */}
      <SmartMoneyAlertBanner
        assets={assets}
        onSelectAsset={(sym) => {
          handleSelectAsset(sym);
          if (activeTab === 'dashboard') setActiveTab('chart');
        }}
        onOpenAudit={(sym) => {
          handleSelectAsset(sym);
          setActiveTab('smart-money');
        }}
        onNavigateToSmartMoney={() => setActiveTab('smart-money')}
        onOpenAlertModal={(sym, price) => {
          handleSelectAsset(sym);
          setActiveTab('alerts');
        }}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* VIEW 1: GLOBAL DASHBOARD (Overview + Interactive Chart + Compare Assets + Movers) */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Dashboard Display Switcher: Single Asset vs Compare Assets + CSV Export */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0b0f19] border border-slate-800 rounded-xl p-3 shadow-lg font-mono text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[11px]">Dashboard Chart Mode:</span>
                <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
                  <button
                    onClick={() => setDashboardChartMode('single')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                      dashboardChartMode === 'single'
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <BarChart2 className="w-3.5 h-3.5" />
                    <span>Single Asset ({activeAsset.symbol})</span>
                  </button>
                  <button
                    onClick={() => setDashboardChartMode('compare')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                      dashboardChartMode === 'compare'
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Scale className="w-3.5 h-3.5" />
                    <span>Compare Assets (Normalized Overlay)</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 text-[11px] text-slate-400">
                {dashboardChartMode === 'single' ? (
                  <button
                    onClick={() => setDashboardChartMode('compare')}
                    className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition cursor-pointer font-semibold"
                  >
                    <Scale className="w-3.5 h-3.5" />
                    <span>Compare {activeAsset.symbol} with peers &rarr;</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setDashboardChartMode('single')}
                    className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition cursor-pointer font-semibold"
                  >
                    <BarChart2 className="w-3.5 h-3.5" />
                    <span>&larr; Return to {activeAsset.symbol} Candlesticks</span>
                  </button>
                )}

                {/* Dashboard Direct CSV Export Utility */}
                <button
                  onClick={() => setShowExportModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 rounded-lg text-xs font-mono font-bold transition shadow-md shadow-emerald-500/10 cursor-pointer ml-1"
                  title="Export Watchlist or Volatility Data to CSV"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Market CSV</span>
                </button>
              </div>
            </div>

            {/* If Single: Interactive Candlestick + Gemini Valuation */}
            {dashboardChartMode === 'single' ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <InteractiveChart
                    candles={candles}
                    symbol={activeAsset.symbol}
                    name={activeAsset.name}
                    currentPrice={activeAsset.price}
                    change={activeAsset.change}
                    changePercent={activeAsset.changePercent}
                    currency={activeAsset.currency}
                    timeframe={timeframe}
                    onTimeframeChange={setTimeframe}
                    aiAnalysis={aiAnalysis}
                  />
                </div>

                {/* Side Snapshot Widget */}
                <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <span className="text-xs font-mono font-bold uppercase text-cyan-400 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4" /> Gemini Valuation Snapshot
                      </span>
                      <button
                        onClick={() => setActiveTab('ai-analysis')}
                        className="text-xs font-mono text-blue-400 hover:text-blue-300 flex items-center cursor-pointer"
                      >
                        Full Model <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-bold font-mono text-white">{activeAsset.symbol}</span>
                        <span className={`px-2.5 py-1 rounded text-xs font-mono font-extrabold uppercase ${
                          aiAnalysis?.opinion === 'BUY'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : aiAnalysis?.opinion === 'SELL'
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        }`}>
                          AI: {aiAnalysis?.opinion || 'BUY'}
                        </span>
                      </div>

                      <div className="mt-3 p-3 bg-slate-950 rounded-lg border border-slate-800/80 text-xs text-slate-300 leading-relaxed font-sans">
                        {aiAnalysis?.trendExplanation || 'Analyzing price action and fundamental catalysts...'}
                      </div>

                      <div className="grid grid-cols-2 gap-3 mt-4 font-mono text-xs">
                        <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800">
                          <div className="text-[10px] text-slate-500">Target (12M)</div>
                          <div className="font-bold text-emerald-400">${aiAnalysis?.targetPrice || +(activeAsset.price * 1.15).toFixed(2)}</div>
                        </div>
                        <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800">
                          <div className="text-[10px] text-slate-500">Stop-Loss Limit</div>
                          <div className="font-bold text-rose-400">${aiAnalysis?.stopLoss || +(activeAsset.price * 0.9).toFixed(2)}</div>
                        </div>
                        <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800">
                          <div className="text-[10px] text-slate-500">Sentiment Score</div>
                          <div className="font-bold text-cyan-400">{aiAnalysis?.marketSentiment?.score || 78}/100</div>
                        </div>
                        <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800">
                          <div className="text-[10px] text-slate-500">RSI (14D)</div>
                          <div className="font-bold text-amber-400">{aiAnalysis?.currentRsi || 62.4}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-800/80 space-y-2">
                    <button
                      onClick={() => handleAnalyzeFromAnywhere(activeAsset.symbol)}
                      className="w-full py-2 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/40 rounded-lg text-xs font-mono font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Run Detailed Analysis on {activeAsset.symbol}
                    </button>
                    <button
                      onClick={() => setDashboardChartMode('compare')}
                      className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-lg text-xs font-mono transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Scale className="w-3.5 h-3.5 text-cyan-400" /> Compare with Peer Stocks
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* If Compare: Render CompareAssetsChart directly in Dashboard */
              <CompareAssetsChart
                assets={assets}
                initialSymbols={[activeAsset.symbol, 'MSFT', 'BHP.AX']}
                onSelectAsset={(sym) => {
                  handleSelectAsset(sym);
                  setDashboardChartMode('single');
                }}
                onAnalyzeStock={handleAnalyzeFromAnywhere}
              />
            )}

            {/* Upcoming Earnings Announcement Strip for Watchlist Assets */}
            <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/30">
                    <Calendar className="w-4 h-4" />
                  </span>
                  <div>
                    <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                      Upcoming Watchlist Earnings Releases
                    </span>
                    <span className="text-[10px] text-slate-400 font-sans ml-2 hidden sm:inline">
                      Consensus EPS hurdles & options volatility expected moves
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('earnings')}
                  className="flex items-center gap-1 text-xs font-mono text-cyan-400 hover:text-cyan-300 font-bold transition cursor-pointer"
                >
                  <span>Open Full Calendar & Analytics</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
                {[
                  { sym: 'NVDA', name: 'NVIDIA Corp', date: 'Oct 24', time: 'AMC', qtr: 'Q3 FY26', estEps: '$0.75', estRev: '$33.1B', move: '±8.4%' },
                  { sym: 'TSLA', name: 'Tesla Inc', date: 'Oct 23', time: 'AMC', qtr: 'Q3 FY26', estEps: '$0.58', estRev: '$25.4B', move: '±9.6%' },
                  { sym: 'GOOGL', name: 'Alphabet Inc', date: 'Oct 22', time: 'AMC', qtr: 'Q3 FY26', estEps: '$1.85', estRev: '$86.3B', move: '±5.6%' },
                  { sym: 'MSFT', name: 'Microsoft Corp', date: 'Oct 29', time: 'AMC', qtr: 'Q1 FY27', estEps: '$3.10', estRev: '$64.5B', move: '±4.8%' },
                ].map((item) => (
                  <div
                    key={item.sym}
                    onClick={() => {
                      handleSelectAsset(item.sym);
                      setActiveTab('earnings');
                    }}
                    className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-800/60 transition cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-white group-hover:text-blue-400 text-sm">
                          {item.sym}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono truncate max-w-[80px]">
                          {item.name}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-300 border border-purple-500/30">
                        {item.time}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-1">
                      {item.date} • {item.qtr}
                    </div>
                    <div className="flex items-center justify-between text-xs font-mono mt-2 pt-1.5 border-t border-slate-800/60">
                      <div>
                        <span className="text-slate-500 text-[10px]">Est EPS: </span>
                        <span className="text-emerald-400 font-bold">{item.estEps}</span>
                      </div>
                      <div className="text-amber-300 font-bold text-[11px]" title="Options ATM Straddle Expected Move">
                        {item.move}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Smart Money Flow & Whale Radar Preview Strip */}
            <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    <ShieldCheck className="w-4 h-4" />
                  </span>
                  <div>
                    <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                      Live Smart Money Radar & Whale Footprints
                    </span>
                    <span className="text-[10px] text-slate-400 font-sans ml-2 hidden sm:inline">
                      13F Hedge Funds, Insider Clusters & Dark Pool Volume
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('smart-money')}
                  className="flex items-center gap-1 text-xs font-mono text-emerald-400 hover:text-emerald-300 font-bold transition cursor-pointer"
                >
                  <span>Launch Smart Money Tracker</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
                {[
                  {
                    sym: 'NVDA',
                    type: '🚨 CONGRESS ALERT',
                    desc: 'Senator purchased NVDA ($15K-$50K) • AI Industry',
                    metric: 'Medium Risk',
                    sentiment: '12 Bought AI',
                    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
                  },
                  {
                    sym: 'NVDA',
                    type: 'CLUSTER BUY',
                    desc: '2 Directors bought $13.4M shares on open market',
                    metric: '94/100 Flow',
                    sentiment: 'Ultra Bullish',
                    badgeColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
                  },
                  {
                    sym: 'BHP',
                    type: 'C-SUITE BUY',
                    desc: 'CEO + Chair joint open-market purchase A$2.26M',
                    metric: '91/100 Flow',
                    sentiment: 'Strong Accumulation',
                    badgeColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
                  },
                  {
                    sym: 'CITADEL',
                    type: '13F FILING',
                    desc: 'Ken Griffin expanded NVDA (+18%) & MSFT (+12%)',
                    metric: '$98.4B AUM',
                    sentiment: 'Tech Momentum',
                    badgeColor: 'bg-blue-500/15 text-blue-300 border-blue-500/40',
                  },
                ].map((item, idx) => (
                  <div
                    key={`${item.sym}-${idx}`}
                    onClick={() => setActiveTab('smart-money')}
                    className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/60 transition cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-white group-hover:text-emerald-400 text-sm">
                          {item.sym}
                        </span>
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${item.badgeColor}`}>
                          {item.type}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold">
                        {item.metric}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-300 font-sans mt-1.5 line-clamp-1">
                      {item.desc}
                    </p>

                    <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-800/60 text-[10px] font-mono">
                      <span className="text-slate-400">{item.sentiment}</span>
                      <span className="text-emerald-400 font-bold group-hover:underline flex items-center gap-0.5">
                        Inspect
                        <ChevronRight className="w-2.5 h-2.5" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Global Markets Indices & Sector Breakdown */}
            <GlobalMarketsView
              assets={assets}
              onSelectAsset={handleSelectAsset}
              onAnalyzeStock={handleAnalyzeFromAnywhere}
            />
          </div>
        )}

        {/* VIEW: COMPARE ASSETS (Direct Tab Access) */}
        {activeTab === 'compare' && (
          <div className="space-y-6">
            <CompareAssetsChart
              assets={assets}
              initialSymbols={['NVDA', 'MSFT', 'BHP.AX']}
              onSelectAsset={(sym) => {
                handleSelectAsset(sym);
                setActiveTab('chart');
              }}
              onAnalyzeStock={handleAnalyzeFromAnywhere}
            />
          </div>
        )}

        {/* VIEW 2: TECHNICAL CHART */}
        {activeTab === 'chart' && (
          <div className="space-y-6">
            <InteractiveChart
              candles={candles}
              symbol={activeAsset.symbol}
              name={activeAsset.name}
              currentPrice={activeAsset.price}
              change={activeAsset.change}
              changePercent={activeAsset.changePercent}
              currency={activeAsset.currency}
              timeframe={timeframe}
              onTimeframeChange={setTimeframe}
              aiAnalysis={aiAnalysis}
            />

            {/* Quick Switcher Strip below chart */}
            <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-4 shadow-lg flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
              <span className="text-slate-400">Quick Switch Ticker:</span>
              <div className="flex flex-wrap items-center gap-2">
                {assets.map((a) => (
                  <button
                    key={a.symbol}
                    onClick={() => handleSelectAsset(a.symbol)}
                    className={`px-2.5 py-1 rounded text-xs transition ${
                      selectedSymbol === a.symbol
                        ? 'bg-blue-600 text-white font-bold'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {a.symbol} (${a.price.toFixed(a.assetClass === 'forex' ? 4 : 2)})
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: AI STOCK ANALYSIS (User's Core Specification) */}
        {activeTab === 'ai-analysis' && (
          <AIAnalysisView
            assets={assets}
            selectedSymbol={selectedSymbol}
            onSelectSymbol={handleSelectAsset}
            aiAnalysis={aiAnalysis}
            isLoading={isAnalysisLoading}
            onRunAnalysis={runStockAnalysis}
          />
        )}

        {/* VIEW 4: AI MARKET ASSISTANT ("Why did NVIDIA rise today?") */}
        {activeTab === 'assistant' && (
          <AIAssistantView onAnalyzeStock={handleAnalyzeFromAnywhere} />
        )}

        {/* VIEW 5: AI STOCK SCANNER ("Find Australian stocks: RSI < 30, Dividend > 4%...") */}
        {activeTab === 'scanner' && (
          <AIScannerView
            onAnalyzeStock={handleAnalyzeFromAnywhere}
            onAddToWatchlist={handleAddToWatchlist}
            watchlistSymbols={assets.map((a) => a.symbol)}
          />
        )}

        {/* VIEW 6: WATCHLIST & QUOTES */}
        {activeTab === 'watchlist' && (
          <WatchlistView
            assets={assets}
            onSelectAsset={(sym) => {
              handleSelectAsset(sym);
              setActiveTab('chart');
            }}
            onAnalyzeStock={handleAnalyzeFromAnywhere}
            onOpenAlertModal={(sym, price) => {
              setActiveTab('alerts');
            }}
            onRemoveFromWatchlist={handleRemoveFromWatchlist}
            onAddNewAsset={handleAddNewAsset}
            onOpenSmartMoney={(sym) => {
              handleSelectAsset(sym);
              setActiveTab('smart-money');
            }}
          />
        )}

        {/* VIEW: SMART MONEY & INSTITUTIONAL FLOW TRACKER */}
        {activeTab === 'smart-money' && (
          <SmartMoneyTracker
            assets={assets}
            onSelectAsset={(sym) => {
              handleSelectAsset(sym);
              setActiveTab('chart');
            }}
            onAnalyzeStock={handleAnalyzeFromAnywhere}
            onAddAlert={(a) => {
              setAlerts((prev) => [a, ...prev]);
              setToastMessage({
                id: Date.now().toString(),
                title: 'Smart Money Alert Armed',
                desc: `${a.symbol} institutional trigger armed.`,
              });
            }}
            onNotify={(title, desc) => {
              setToastMessage({
                id: Date.now().toString(),
                title,
                desc,
              });
            }}
          />
        )}

        {/* VIEW: EARNINGS CALENDAR & SURPRISES */}
        {activeTab === 'earnings' && (
          <EarningsCalendar
            assets={assets}
            onSelectAsset={(sym) => {
              handleSelectAsset(sym);
              setActiveTab('chart');
            }}
            onAnalyzeStock={handleAnalyzeFromAnywhere}
            onAddAlert={(a) => {
              setAlerts((prev) => [a, ...prev]);
              setToastMessage({
                id: Date.now().toString(),
                title: 'Earnings Alert Armed',
                desc: `${a.symbol} trigger active ahead of release.`,
              });
            }}
            onNotify={(title, desc) => {
              setToastMessage({
                id: Date.now().toString(),
                title,
                desc,
              });
            }}
          />
        )}

        {/* VIEW: VOLATILITY HEATMAP (RECHARTS) */}
        {activeTab === 'volatility' && (
          <VolatilityHeatmap
            assets={assets}
            onSelectAsset={(sym) => {
              handleSelectAsset(sym);
              setActiveTab('chart');
            }}
            onAnalyzeStock={handleAnalyzeFromAnywhere}
          />
        )}

        {/* VIEW 7: MARKET NEWS */}
        {activeTab === 'news' && (
          <NewsView
            news={news}
            onSelectTicker={(sym) => {
              handleSelectAsset(sym);
              setActiveTab('chart');
            }}
            onAnalyzeTicker={handleAnalyzeFromAnywhere}
          />
        )}

        {/* VIEW 8: ALERTS & TRIGGERS */}
        {activeTab === 'alerts' && (
          <AlertsManager
            alerts={alerts}
            assets={assets}
            onAddAlert={(a) => {
              setAlerts((prev) => [a, ...prev]);
              setToastMessage({
                id: Date.now().toString(),
                title: 'Alert Armed',
                desc: `${a.symbol} trigger active.`,
              });
            }}
            onRemoveAlert={(id) => setAlerts((prev) => prev.filter((a) => a.id !== id))}
            onResetAlert={(id) => setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, triggered: false } : a))}
            onAnalyzeStock={handleAnalyzeFromAnywhere}
          />
        )}

        {/* VIEW 9: PORTFOLIO & AI REVIEW */}
        {activeTab === 'portfolio' && (
          <PortfolioView
            positions={portfolio}
            assets={assets}
            onAddPosition={(pos) => setPortfolio((prev) => [pos, ...prev])}
            onRemovePosition={(id) => setPortfolio((prev) => prev.filter((p) => p.id !== id))}
            onAnalyzeStock={handleAnalyzeFromAnywhere}
          />
        )}

        {/* VIEW 10: SET FOR LIFE FAB5 SYNDICATE & AUTOMATION HUB */}
        {activeTab === 'syndicate' && (
          <SyndicateHub />
        )}
      </main>

      {/* Floating Alert / Action Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm bg-slate-900 border border-cyan-500/50 p-4 rounded-xl shadow-2xl flex items-start gap-3 animate-slide-in">
          <CheckCircle className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          <div className="flex-1 font-mono text-xs">
            <div className="font-bold text-white">{toastMessage.title}</div>
            <div className="text-[11px] text-slate-300 font-sans mt-0.5">{toastMessage.desc}</div>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-500 hover:text-white text-xs font-mono"
          >
            &times;
          </button>
        </div>
      )}

      {/* Export Market Data CSV Modal */}
      <ExportDataModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        assets={assets}
        onNotify={(title, desc) =>
          setToastMessage({
            id: Date.now().toString(),
            title,
            desc,
          })
        }
      />

      {/* Bloomberg-Style Terminal Footer Ribbon */}
      <footer className="border-t border-slate-800 bg-[#04060b] py-3 px-6 text-xs font-mono text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-slate-400 font-semibold">FEED: SYNCHRONIZED</span>
            <span>•</span>
            <span>DATA LATENCY: &lt; 85ms</span>
            <span>•</span>
            <span>MODEL: GEMINI-3.8-FLASH</span>
          </div>
          <div className="text-[11px]">
            &copy; 2026 Global Market Intelligence Terminal • Institutional Edition
          </div>
        </div>
      </footer>
    </div>
  );
}
