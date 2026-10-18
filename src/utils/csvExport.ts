import {
  MarketAsset,
  EarningsEvent,
  WhaleFiling13F,
  InsiderTrade,
  DarkPoolBlock,
  UnusualOptionsSweep,
  CongressionalTrade,
} from '../types/market.ts';

/**
 * Format a cell value safely for CSV output
 */
function escapeCsvValue(val: any): string {
  if (val === null || val === undefined) return '';
  const str = String(val).trim();
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Export market assets to a formatted CSV file and trigger browser download
 */
export function exportAssetsToCsv(
  assets: MarketAsset[],
  filenamePrefix: string = 'market_watchlist'
): { success: boolean; rowCount: number; filename: string } {
  if (!assets || assets.length === 0) {
    return { success: false, rowCount: 0, filename: '' };
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `${filenamePrefix}_${timestamp}.csv`;

  // Standard institutional columns
  const headers = [
    'Symbol',
    'Name',
    'Exchange',
    'Asset Class',
    'Region',
    'Sector',
    'Currency',
    'Current Price',
    'Price Change',
    'Change Percent (%)',
    'Day High',
    'Day Low',
    'Open Price',
    'Previous Close',
    '52-Week High',
    '52-Week Low',
    'Volume',
    'Market Cap',
    'P/E Ratio',
    'Dividend Yield (%)',
    'RSI (14D)',
    'Last Updated',
  ];

  const rows = assets.map((asset) => {
    return [
      asset.symbol,
      asset.name,
      asset.exchange,
      asset.assetClass,
      asset.region,
      asset.sector || 'General',
      asset.currency,
      asset.price.toFixed(asset.assetClass === 'forex' ? 4 : 2),
      asset.change >= 0 ? `+${asset.change.toFixed(2)}` : asset.change.toFixed(2),
      asset.changePercent >= 0 ? `+${asset.changePercent.toFixed(2)}%` : `${asset.changePercent.toFixed(2)}%`,
      asset.dayHigh?.toFixed(2) ?? '',
      asset.dayLow?.toFixed(2) ?? '',
      asset.open?.toFixed(2) ?? '',
      asset.previousClose?.toFixed(2) ?? '',
      asset.high52w?.toFixed(2) ?? '',
      asset.low52w?.toFixed(2) ?? '',
      asset.volume ?? '',
      asset.marketCap ?? '',
      asset.peRatio?.toFixed(1) ?? 'N/A',
      asset.dividendYield !== undefined ? `${asset.dividendYield}%` : 'N/A',
      asset.rsi?.toFixed(1) ?? 'N/A',
      new Date().toLocaleString(),
    ].map(escapeCsvValue).join(',');
  });

  const csvContent = '\uFEFF' + [headers.map(escapeCsvValue).join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return { success: true, rowCount: assets.length, filename };
}

/**
 * Export volatility metrics to CSV
 */
export function exportVolatilityToCsv(
  assets: MarketAsset[],
  timeframe: string = '30D'
): { success: boolean; rowCount: number; filename: string } {
  if (!assets || assets.length === 0) {
    return { success: false, rowCount: 0, filename: '' };
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `volatility_risk_metrics_${timeframe}_${timestamp}.csv`;

  const headers = [
    'Symbol',
    'Name',
    'Sector',
    'Current Price',
    'Daily Return (%)',
    'Daily StdDev (%)',
    'Annualized Volatility (σ %)',
    'Risk Tier',
    'Market Cap',
    'Currency',
    'Timeframe Window',
    'Calculated At',
  ];

  const rows = assets.map((asset) => {
    const prices = asset.sparkline || [asset.price];
    let dailyStd = 1.5;
    let annStd = 23.8;

    if (prices.length > 2) {
      const returns: number[] = [];
      for (let i = 1; i < prices.length; i++) {
        if (prices[i - 1] > 0) {
          returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
        }
      }
      if (returns.length > 0) {
        const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
        const variance = returns.reduce((acc, r) => acc + Math.pow(r - mean, 2), 0) / (returns.length - 1 || 1);
        dailyStd = +(Math.sqrt(variance) * 100).toFixed(2);
        annStd = +(dailyStd * Math.sqrt(252)).toFixed(1);
      }
    }

    const riskTier = annStd < 22 ? 'Low' : annStd < 38 ? 'Moderate' : annStd < 60 ? 'Elevated' : 'Extreme';

    return [
      asset.symbol,
      asset.name,
      asset.sector || 'Diversified',
      asset.price.toFixed(asset.assetClass === 'forex' ? 4 : 2),
      `${asset.changePercent >= 0 ? '+' : ''}${asset.changePercent.toFixed(2)}%`,
      `${dailyStd}%`,
      `${annStd}%`,
      riskTier,
      asset.marketCap || 'N/A',
      asset.currency,
      timeframe,
      new Date().toLocaleString(),
    ].map(escapeCsvValue).join(',');
  });

  const csvContent = '\uFEFF' + [headers.map(escapeCsvValue).join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return { success: true, rowCount: assets.length, filename };
}

/**
 * Export earnings calendar announcements with EPS estimates and revenue surprises to CSV
 */
export function exportEarningsToCsv(
  events: EarningsEvent[],
  filenamePrefix: string = 'earnings_calendar'
): { success: boolean; rowCount: number; filename: string } {
  if (!events || events.length === 0) {
    return { success: false, rowCount: 0, filename: '' };
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `${filenamePrefix}_${timestamp}.csv`;

  const headers = [
    'Symbol',
    'Company Name',
    'Exchange',
    'Sector',
    'Current Price',
    'Currency',
    'Report Date',
    'Timing (BMO/AMC)',
    'Fiscal Quarter',
    'Status',
    'Estimated EPS',
    'Actual EPS',
    'Prior EPS',
    'EPS Surprise Amount ($)',
    'EPS Surprise (%)',
    'Estimated Revenue',
    'Actual Revenue',
    'Prior Revenue',
    'Revenue Surprise Amount',
    'Revenue Surprise (%)',
    'Implied Move (Options ±%)',
    'Watchlist Constituent',
    'Exported At',
  ];

  const rows = events.map((event) => {
    return [
      event.symbol,
      event.name,
      event.exchange,
      event.sector,
      event.currentPrice.toFixed(2),
      event.currency,
      event.reportDate,
      event.reportTime === 'BMO' ? 'Before Market Open (BMO)' : 'After Market Close (AMC)',
      event.fiscalQuarter,
      event.status.toUpperCase(),
      event.estimatedEPS !== null ? `$${event.estimatedEPS.toFixed(2)}` : 'N/A',
      event.actualEPS !== null && event.actualEPS !== undefined ? `$${event.actualEPS.toFixed(2)}` : 'Pending',
      `$${event.priorEPS.toFixed(2)}`,
      event.epsSurpriseAmount !== null && event.epsSurpriseAmount !== undefined
        ? `${event.epsSurpriseAmount >= 0 ? '+' : ''}$${event.epsSurpriseAmount.toFixed(2)}`
        : 'N/A',
      event.epsSurprisePercent !== null && event.epsSurprisePercent !== undefined
        ? `${event.epsSurprisePercent >= 0 ? '+' : ''}${event.epsSurprisePercent.toFixed(2)}%`
        : 'N/A',
      event.estimatedRevenue,
      event.actualRevenue ?? 'Pending',
      event.priorRevenue,
      event.revenueSurpriseAmount ?? 'N/A',
      event.revenueSurprisePercent !== null && event.revenueSurprisePercent !== undefined
        ? `${event.revenueSurprisePercent >= 0 ? '+' : ''}${event.revenueSurprisePercent.toFixed(2)}%`
        : 'N/A',
      `±${event.impliedMovePercent}%`,
      event.isInWatchlist ? 'YES' : 'NO',
      new Date().toLocaleString(),
    ]
      .map(escapeCsvValue)
      .join(',');
  });

  const csvContent = '\uFEFF' + [headers.map(escapeCsvValue).join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return { success: true, rowCount: events.length, filename };
}

/**
 * Export Smart Money transactions (Insiders, Dark Pools, Whales, Options Sweeps) to CSV
 */
export function exportSmartMoneyToCsv(
  data: {
    insiderTrades?: InsiderTrade[];
    whaleFilings?: WhaleFiling13F[];
    darkPoolBlocks?: DarkPoolBlock[];
    optionsSweeps?: UnusualOptionsSweep[];
    congressionalTrades?: CongressionalTrade[];
  },
  filenamePrefix: string = 'smart_money_intelligence'
): { success: boolean; rowCount: number; filename: string } {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `${filenamePrefix}_${timestamp}.csv`;

  const headers = [
    'Category',
    'Identifier / Symbol',
    'Entity / Trader / Politician',
    'Position / Title / Fund',
    'Action / Type',
    'Transaction Date / Period',
    'Price / Strike',
    'Volume / Shares / Contracts',
    'Notional Value ($USD)',
    'Sentiment / Conviction',
    'Details / Notes',
    'Exported At',
  ];

  const rows: string[][] = [];

  // Add Insider Trades
  (data.insiderTrades || []).forEach((item) => {
    rows.push([
      'INSIDER FORM 4',
      item.symbol,
      item.insiderName,
      item.title,
      `${item.tradeType} ${item.isClusterBuy ? '(CLUSTER BUY)' : ''} ${item.isRule10b5_1 ? '(10b5-1 Plan)' : ''}`,
      item.transactionDate,
      `$${item.price.toFixed(2)}`,
      item.shares.toLocaleString(),
      `$${item.totalValue.toLocaleString()}`,
      item.convictionRating,
      `Owned after: ${item.sharesOwnedAfter.toLocaleString()} (${item.sharesChangePercent >= 0 ? '+' : ''}${item.sharesChangePercent.toFixed(2)}%)`,
      new Date().toLocaleString(),
    ]);
  });

  // Add 13F Whales
  (data.whaleFilings || []).forEach((item) => {
    rows.push([
      '13F WHALE FILING',
      item.topHolding,
      item.fundName,
      item.manager,
      `Top Holding: ${item.topHolding} (${item.topHoldingWeight}%)`,
      item.quarter,
      'AUM',
      `Turnover: ${item.turnoverRate}%`,
      `$${(item.aumBillions * 1e9).toLocaleString()}`,
      item.stance,
      `New: ${item.newPositions.join(', ')} | Inc: ${item.increasedPositions.join(', ')} | Trim: ${item.trimmedPositions.join(', ')}`,
      new Date().toLocaleString(),
    ]);
  });

  // Add Dark Pool Blocks
  (data.darkPoolBlocks || []).forEach((item) => {
    rows.push([
      'DARK POOL BLOCK',
      item.symbol,
      item.companyName,
      item.venue,
      item.blockType,
      item.timeAgo,
      `$${item.price.toFixed(2)}`,
      item.sizeShares.toLocaleString(),
      `$${item.notionalValue.toLocaleString()}`,
      item.tradeSentiment,
      `${item.pctAdv}% of 30-day ADV`,
      new Date().toLocaleString(),
    ]);
  });

  // Add Options Sweeps
  (data.optionsSweeps || []).forEach((item) => {
    rows.push([
      'UNUSUAL OPTIONS SWEEP',
      item.symbol,
      item.companyName || item.symbol,
      `${item.type} Strike $${item.strike}`,
      `${item.orderType} (Exp: ${item.expiration})`,
      item.timeAgo,
      `Spot $${item.spotPrice.toFixed(2)}`,
      `${item.sizeContracts.toLocaleString()} contracts (Vol/OI: ${item.volumeToOiRatio}x)`,
      `$${item.premium.toLocaleString()}`,
      item.sentiment,
      `IV: ${item.impliedVolatility}%`,
      new Date().toLocaleString(),
    ]);
  });

  // Add Congressional Trades
  (data.congressionalTrades || []).forEach((item) => {
    rows.push([
      'CONGRESSIONAL STOCK ACT',
      item.symbol,
      item.politician,
      `${item.chamber} (${item.party}) - ${item.committee}`,
      item.transactionType,
      item.transactionDate,
      `Disclosure lag: ${item.disclosureLagDays}d`,
      'Range Value',
      item.estimatedValue,
      `Return since trade: +${item.performanceSinceTrade}%`,
      `Filed: ${item.filingDate}`,
      new Date().toLocaleString(),
    ]);
  });

  const csvContent = '\uFEFF' + [headers.map(escapeCsvValue).join(','), ...rows.map(r => r.map(escapeCsvValue).join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return { success: true, rowCount: rows.length, filename };
}
