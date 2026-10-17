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
  Flame
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [assets, setAssets] = useState<MarketAsset[]>(() => {
    const saved = localStorage.getItem('gmi_assets');
    return saved ? JSON.parse(saved) : INITIAL_ASSETS;
  });

  const [selectedSymbol, setSelectedSymbol] = useState<string>('NVDA');
  const [timeframe, setTimeframe] = useState<string>('1D');
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
      const data: AIStockAnalysis = await res.json();
      setAiAnalysis(data);
    } catch (err) {
      console.error('Failed to run stock analysis:', err);
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

          next[idx] = {
            ...item,
            price: newPrice,
            change: newChange,
            changePercent: newChangePercent,
            dayHigh: newHigh,
            dayLow: newLow,
            sparkline: newSparkline,
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
              { id: 'ai-analysis', label: 'AI Deep-Dive', icon: Sparkles },
              { id: 'assistant', label: 'AI Market Assistant', icon: Bot },
              { id: 'scanner', label: 'AI Stock Scanner', icon: Search },
              { id: 'watchlist', label: 'Watchlist', icon: ListFilter },
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
        </div>
      </nav>

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* VIEW 1: GLOBAL DASHBOARD (Overview + Interactive Chart + Movers) */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Top Row: Chart on Left (or Featured Asset) + Fast AI Snapshot on Right */}
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
                      className="text-xs font-mono text-blue-400 hover:text-blue-300 flex items-center"
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
                        <div className="font-bold text-emerald-400">${aiAnalysis?.targetPrice || activeAsset.price * 1.15}</div>
                      </div>
                      <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800">
                        <div className="text-[10px] text-slate-500">Stop-Loss Limit</div>
                        <div className="font-bold text-rose-400">${aiAnalysis?.stopLoss || activeAsset.price * 0.9}</div>
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

                <div className="pt-4 mt-4 border-t border-slate-800/80">
                  <button
                    onClick={() => handleAnalyzeFromAnywhere(activeAsset.symbol)}
                    className="w-full py-2 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/40 rounded-lg text-xs font-mono font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Run Detailed Analysis on {activeAsset.symbol}
                  </button>
                </div>
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
