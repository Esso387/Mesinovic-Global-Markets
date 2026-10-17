export type AssetClass = 'stock' | 'index' | 'commodity' | 'forex' | 'crypto';
export type Region = 'US' | 'AUS' | 'EU' | 'ASIA' | 'GLOBAL';
export type TrendType = 'Strong Bullish' | 'Bullish' | 'Neutral' | 'Bearish' | 'Strong Bearish';
export type RatingOpinion = 'BUY' | 'HOLD' | 'WATCH' | 'SELL';

export interface MarketAsset {
  symbol: string;
  name: string;
  exchange: string;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
  assetClass: AssetClass;
  region: Region;
  dayHigh: number;
  dayLow: number;
  open: number;
  previousClose: number;
  volume: string;
  marketCap?: string;
  peRatio?: number;
  dividendYield?: number;
  high52w: number;
  low52w: number;
  rsi?: number;
  sector?: string;
  sparkline: number[];
}

export interface Candle {
  timestamp: number;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  sma20?: number;
  ema50?: number;
  rsi?: number;
}

export interface AIStockAnalysis {
  symbol: string;
  name?: string;
  trend: TrendType;
  trendExplanation: string;
  supportLevels: number[];
  resistanceLevels: number[];
  currentRsi: number;
  rsiInterpretation: string;
  marketSentiment: {
    score: number;
    label: string;
    summary: string;
  };
  keyNewsPoints: string[];
  opinion: RatingOpinion;
  opinionRationale: string;
  targetPrice: number;
  stopLoss: number;
  riskRewardRatio?: string;
  confidenceScore: number;
  catalysts?: {
    positive: string[];
    risks: string[];
  };
}

export interface AIAssistantResponse {
  headline: string;
  reasons: string[];
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
  confidence: number;
  detailedAnalysis: string;
  macroFactors: string[];
  recommendation: string;
}

export interface AIScannerStock {
  symbol: string;
  name: string;
  price: number;
  currency: string;
  changePercent: number;
  marketCap: string;
  peRatio?: number;
  rsi: number;
  dividendYield: number;
  matchRationale: string;
  sector: string;
  status: string;
}

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  timeAgo: string;
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
  summary: string;
  tickers: string[];
  keyPoints: string[];
  impactScore: number; // 1-10
}

export interface AlertTrigger {
  id: string;
  symbol: string;
  condition: 'ABOVE' | 'BELOW' | 'RSI_OVERSOLD' | 'RSI_OVERBOUGHT' | 'SENTIMENT_CHANGE';
  targetValue: number;
  triggered: boolean;
  createdAt: string;
  notes?: string;
  triggeredAt?: string;
}

export interface PortfolioPosition {
  id: string;
  symbol: string;
  name: string;
  shares: number;
  avgCost: number;
  currentPrice: number;
  currency: string;
  sector: string;
  assetClass: AssetClass;
}

export interface PortfolioReview {
  healthGrade: string;
  diversificationScore: number;
  riskLevel: string;
  summary: string;
  sectorBreakdown: { sector: string; weight: number }[];
  recommendations: string[];
  sharpeRatio: string;
  beta: string;
}
