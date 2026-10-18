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

export type EarningsTiming = 'BMO' | 'AMC' | 'DMH'; // Before Market Open, After Market Close, During Market Hours

export interface HistoricalSurprise {
  quarter: string;
  epsEstimated: number;
  epsActual: number;
  epsSurprisePct: number;
  revEstimated: number; // in billions or millions
  revActual: number;
  revSurprisePct: number;
  priceReactionPct: number;
}

export interface EarningsEvent {
  id: string;
  symbol: string;
  name: string;
  exchange: string;
  sector: string;
  currency: string;
  currentPrice: number;
  reportDate: string; // ISO date string YYYY-MM-DD
  reportTime: EarningsTiming;
  fiscalQuarter: string; // e.g., 'Q3 2026'
  fiscalYear: number;
  estimatedEPS: number;
  actualEPS?: number | null;
  priorEPS: number;
  epsSurpriseAmount?: number | null;
  epsSurprisePercent?: number | null;
  estimatedRevenue: string; // formatted e.g., '$32.8B'
  estimatedRevenueNum: number; // in Billions or Millions for chart calculation
  actualRevenue?: string | null;
  actualRevenueNum?: number | null;
  priorRevenue: string;
  revenueSurpriseAmount?: string | null;
  revenueSurprisePercent?: number | null;
  impliedMovePercent: number; // Expected move based on straddle IV (e.g., 7.5%)
  status: 'upcoming' | 'reported' | 'today';
  historicalSurprises?: HistoricalSurprise[];
  isInWatchlist?: boolean;
}

export interface AIEarningsPreview {
  symbol: string;
  quarter: string;
  catalystSummary: string;
  whisperEPS: number;
  consensusEPS: number;
  impliedMove: string;
  optionsStraddlePrice: string;
  keySegmentsToWatch: { segment: string; target: string; importance: 'High' | 'Critical' | 'Medium' }[];
  bullCaseDrivers: string[];
  bearCaseRisks: string[];
  managementGuidanceRisk: 'Low' | 'Moderate' | 'Elevated' | 'High';
  tradingDeskVerdict: string;
}

// ================= SMART MONEY TRACKER TYPES =================

export interface WhaleHolding {
  symbol: string;
  shares: string;
  valueUsd: string;
  portfolioPercent: number;
  changePercent: number;
}

export interface WhaleFiling13F {
  id: string;
  fundName: string;
  manager: string;
  aumBillions: number;
  filingDate: string;
  quarter: string;
  topHolding: string;
  topHoldingWeight: number;
  newPositions: string[];
  increasedPositions: string[];
  trimmedPositions: string[];
  liquidatedPositions: string[];
  turnoverRate: number;
  stance: 'Aggressive Growth' | 'Deep Value' | 'Macro Defensive' | 'Tech Momentum' | 'Distressed Credit';
  topHoldings: WhaleHolding[];
}

export interface InsiderTrade {
  id: string;
  symbol: string;
  companyName: string;
  insiderName: string;
  title: string;
  tradeType: 'Purchase' | 'Sale' | 'Option Exercise' | 'Grant';
  shares: number;
  price: number;
  totalValue: number;
  sharesOwnedAfter: number;
  sharesChangePercent: number;
  filingDate: string;
  transactionDate: string;
  isClusterBuy: boolean;
  isRule10b5_1: boolean;
  convictionRating: 'High' | 'Medium' | 'Informational';
}

export interface DarkPoolBlock {
  id: string;
  symbol: string;
  companyName: string;
  price: number;
  sizeShares: number;
  notionalValue: number; // in USD
  timeAgo: string;
  pctAdv: number; // % of 30d Average Daily Volume
  venue: string; // e.g. Sigma X, Crossfinder, Liquidnet, Chi-X Dark
  tradeSentiment: 'Bullish Accumulation' | 'Bearish Distribution' | 'Neutral Cross';
  blockType: 'Opening Cross' | 'Dark Pool Print' | 'Late Block' | 'Signature Sweep';
}

export interface UnusualOptionsSweep {
  id: string;
  symbol: string;
  companyName?: string;
  type: 'CALL' | 'PUT';
  strike: number;
  expiration: string;
  spotPrice: number;
  premium: number; // in USD
  sizeContracts: number;
  openInterest: number;
  volumeToOiRatio: number;
  impliedVolatility: number;
  orderType: 'Sweep' | 'Block' | 'Split';
  sentiment: 'Bullish' | 'Ultra Bullish' | 'Bearish' | 'Hedging';
  timeAgo: string;
}

export interface CongressionalTrade {
  id: string;
  politician: string;
  chamber: 'House' | 'Senate';
  party: 'Democrat' | 'Republican' | 'Independent';
  committee: string;
  symbol: string;
  companyName: string;
  transactionType: 'Purchase' | 'Sale' | 'Call Option' | 'Stock Exchange';
  estimatedValue: string;
  transactionDate: string;
  filingDate: string;
  disclosureLagDays: number;
  performanceSinceTrade: number;
  industry?: string;
  riskRating?: 'Low' | 'Medium' | 'High';
  similarTradesCount?: number;
  similarTradesNote?: string;
}

export interface SmartMoneyAlertItem {
  id: string;
  title: string;
  headline: string;
  entity: string;
  symbol: string;
  companyName: string;
  amount: string;
  industry: string;
  riskRating: 'Low' | 'Medium' | 'High';
  similarTrades: string;
  alertType: 'congressional' | 'insider_cluster' | 'dark_pool' | 'whale_13f' | 'unusual_options';
  timestamp: string;
  timeAgo: string;
  sentiment: 'Bullish' | 'Neutral' | 'Bearish';
  details?: {
    committee?: string;
    filingDate?: string;
    tradeDate?: string;
    lagDays?: number;
    keyInsight?: string;
    peerTrades?: Array<{ politician: string; symbol: string; amount: string; date: string }>;
  };
}

export interface SmartMoneyMetrics {
  flowIndex: number; // 0-100
  flowIndexStatus: string;
  darkPoolActivityRatio: number; // %
  netWhaleFlow24h: number; // in Billions USD
  insiderBuyRatio: number; // e.g. 1.84x
  dominantRegime: string;
}

export interface AISmartMoneyAudit {
  symbol: string;
  companyName: string;
  overallScore: number; // 0-100
  signal: 'Strong Accumulation' | 'Moderate Accumulation' | 'Neutral Churn' | 'Distribution' | 'Heavy Distribution';
  wyckoffPhase: 'Phase A (Stopping)' | 'Phase B (Accumulation Building)' | 'Phase C (Spring / Test)' | 'Phase D (Markup in Progress)' | 'Distribution Phase';
  darkPoolAbsorption: string;
  insiderConviction: string;
  optionsGammaProfile: string;
  whaleConsensus: string;
  smartMoneyTargetPrice: number;
  currentPrice: number;
  institutionalGrade: 'AAA' | 'AA' | 'A' | 'BBB' | 'BB' | 'C';
  executiveSummary: string;
  keyInstitutionalFootprints: string[];
  riskFactors: string[];
}
