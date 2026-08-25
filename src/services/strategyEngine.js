/**
 * StockIQ Strategy & Dynamic Growth Scoring Engine
 * Analyzes PSX stock fundamentals, technical positions, and valuation multiples
 * to categorize investment strategy fit, growth catalysts, and risk warnings.
 */

export function analyzeStockStrategy(stock) {
  if (!stock) return null;

  const price = Number(stock.price || 0);
  const pe = Number(stock.pe_ratio || 6.5);
  const pb = Number(stock.pb_ratio || 1.2);
  const roe = Number(stock.roe || 18.0);
  const divYield = Number(stock.dividend_yield || 5.0);
  const change = Number(stock.change || 0);
  const changePercent = Number(stock.changePercent || 0);
  const volume = Number(typeof stock.volume === 'string' ? stock.volume.replace(/,/g, '') : (stock.volume || 1000000));
  
  const high52 = Number(stock.fifty_two_week_high || (price * 1.25));
  const low52 = Number(stock.fifty_two_week_low || (price * 0.75));
  const open = Number(stock.open_price || stock.previous_close || price);
  const ldcp = Number(stock.previous_close || (price - change));

  // 1. Calculate Core Factor Scores
  const valuationScore = Math.max(10, Math.min(98, 100 - (pe * 4.5)));
  const profitabilityScore = Math.max(15, Math.min(99, roe * 2.1));
  const dividendScore = Math.max(10, Math.min(98, divYield * 7.5));
  const momentumScore = Math.max(10, Math.min(95, 50 + (changePercent * 6) + (price >= ldcp ? 10 : -10)));

  // Distance from 52-Week High/Low (0 = at low, 100 = at high)
  const range52Position = high52 > low52 ? Math.round(((price - low52) / (high52 - low52)) * 100) : 50;

  // 2. Select Best Strategy Pickup
  let strategy = {
    key: 'VALUE_PLAY',
    name: 'Undervalued Value Play',
    tagline: 'Discounted multiple with solid intrinsic cash generation',
    color: '#06b6d4',
    badgeBg: 'rgba(6, 182, 212, 0.15)'
  };

  if (divYield >= 9.0) {
    strategy = {
      key: 'DIVIDEND_FORTRESS',
      name: 'Dividend Fortress',
      tagline: 'High recurring dividend yield with strong capital preservation',
      color: '#10b981',
      badgeBg: 'rgba(16, 185, 129, 0.15)'
    };
  } else if (roe >= 28.0 && pe < 12.0) {
    strategy = {
      key: 'QUALITY_COMPOUNDER',
      name: 'Quality Compounder',
      tagline: 'Superior return on equity with exceptional pricing power',
      color: '#8b5cf6',
      badgeBg: 'rgba(139, 92, 246, 0.15)'
    };
  } else if (range52Position >= 85 && changePercent > 0) {
    strategy = {
      key: 'MOMENTUM_BREAKOUT',
      name: 'Momentum Breakout',
      tagline: 'Bullish technical setup trading near 52-week resistance',
      color: '#f59e0b',
      badgeBg: 'rgba(245, 158, 11, 0.15)'
    };
  } else if (pe <= 5.5 && pb <= 1.0) {
    strategy = {
      key: 'DEEP_VALUE',
      name: 'Deep Value & Asset Play',
      tagline: 'Trading at severe discount to book value and earnings power',
      color: '#22d3ee',
      badgeBg: 'rgba(34, 211, 238, 0.15)'
    };
  } else if (range52Position <= 25 && roe >= 15) {
    strategy = {
      key: 'TURNAROUND_VALUE',
      name: 'Cyclical Turnaround',
      tagline: 'Oversold near 52-week support with mean-reversion upside',
      color: '#ec4899',
      badgeBg: 'rgba(236, 72, 153, 0.15)'
    };
  }

  // 3. Dynamic Strategy Growth Drivers ("Why Stock Price May Appreciate")
  const growthDrivers = [];

  if (pe <= 7.0) {
    growthDrivers.push({
      title: 'Compelling Valuation Multiple',
      detail: `Trading at a P/E of ${pe.toFixed(1)}x (P/B: ${pb.toFixed(2)}x), providing an attractive margin of safety relative to PSX benchmark multiples.`
    });
  }

  if (roe >= 20.0) {
    growthDrivers.push({
      title: 'High Capital Efficiency & ROE',
      detail: `Generates a robust ${roe.toFixed(1)}% Return on Equity, demonstrating high reinvestment profitability and pricing dominance.`
    });
  }

  if (divYield >= 7.0) {
    growthDrivers.push({
      title: 'Attractive Dividend Payout',
      detail: `Offers a ${divYield.toFixed(1)}% cash dividend yield, creating dependable shareholder return irrespective of broader market volatility.`
    });
  }

  if (changePercent > 0.5 && volume > 500000) {
    growthDrivers.push({
      title: 'Active Institutional Liquidity',
      detail: `Healthy volume accumulation of ${(volume / 1000000).toFixed(2)}M shares with positive day momentum (+${changePercent.toFixed(2)}%).`
    });
  }

  if (range52Position < 65) {
    const upsidePotential = high52 > price ? (((high52 - price) / price) * 100).toFixed(1) : '15.0';
    growthDrivers.push({
      title: '52-Week Recovery Room',
      detail: `Currently trading at a ${upsidePotential}% discount from its 52-week high of PKR ${high52.toLocaleString()}, leaving headroom for multiple re-rating.`
    });
  }

  // Fallback driver if list is short
  if (growthDrivers.length < 3) {
    growthDrivers.push({
      title: 'Sector Leadership & Stability',
      detail: `${stock.name} maintains entrenched market share in the ${stock.sector || 'core'} sector with proven cyclical resilience.`
    });
  }

  // 4. Dynamic Risk Warnings ("Why Stock Price Might Fall / Headwinds")
  const riskWarnings = [];

  if (range52Position >= 85) {
    riskWarnings.push({
      title: 'Near 52-Week High Resistance',
      detail: `Trading within ${(100 - range52Position).toFixed(0)}% of 52-week peak (PKR ${high52.toLocaleString()}); profit-taking may create short-term volatility.`
    });
  }

  if (pe >= 15.0) {
    riskWarnings.push({
      title: 'Premium Earnings Multiple',
      detail: `Elevated P/E multiple of ${pe.toFixed(1)}x increases vulnerability if future quarterly earnings fail to beat market consensus.`
    });
  }

  if (volume < 100000) {
    riskWarnings.push({
      title: 'Constrained Daily Liquidity',
      detail: `Light daily trading volume of ${(volume / 1000).toFixed(0)}k shares may amplify slippage during large position liquidation.`
    });
  }

  if (divYield < 2.0 && pe > 10) {
    riskWarnings.push({
      title: 'Low Dividend Cushion',
      detail: `Modest dividend yield of ${divYield.toFixed(1)}% provides limited cash yield cushion during broader PSX market corrections.`
    });
  }

  // Baseline macro risk
  riskWarnings.push({
    title: 'Macro & Policy Sensitivities',
    detail: 'Subject to policy rate adjustments, energy tariff revisions, and general macroeconomic cycles within the Pakistani market.'
  });

  // 5. Compute Final Composite Strategy Score (0 - 100)
  let rawScore = (valuationScore * 0.30) + (profitabilityScore * 0.35) + (dividendScore * 0.20) + (momentumScore * 0.15);
  const compositeScore = Math.max(25, Math.min(98, Math.round(rawScore * 10) / 10));

  let verdict = { label: 'MODERATE FIT', color: '#f59e0b', hexColor: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' };
  if (compositeScore >= 85) {
    verdict = { label: 'STRONG FIT', color: '#059669', hexColor: '#059669', bg: 'rgba(5, 150, 105, 0.15)' };
  } else if (compositeScore >= 70) {
    verdict = { label: 'GOOD FIT', color: '#16a34a', hexColor: '#16a34a', bg: 'rgba(22, 163, 74, 0.15)' };
  } else if (compositeScore >= 55) {
    verdict = { label: 'MODERATE FIT', color: '#d97706', hexColor: '#d97706', bg: 'rgba(217, 119, 6, 0.15)' };
  } else if (compositeScore >= 40) {
    verdict = { label: 'WEAK FIT', color: '#ea580c', hexColor: '#ea580c', bg: 'rgba(234, 88, 12, 0.15)' };
  } else {
    verdict = { label: 'POOR FIT', color: '#dc2626', hexColor: '#dc2626', bg: 'rgba(220, 38, 38, 0.15)' };
  }

  return {
    strategy,
    verdict,
    compositeScore,
    range52Position,
    metrics: {
      price,
      open,
      high: Math.max(price, open, (price * 1.01)),
      low: Math.min(price, open, (price * 0.99)),
      ldcp,
      volume,
      high52,
      low52,
      pe,
      pb,
      roe,
      divYield,
      change,
      changePercent
    },
    growthDrivers: growthDrivers.slice(0, 4),
    riskWarnings: riskWarnings.slice(0, 3)
  };
}
