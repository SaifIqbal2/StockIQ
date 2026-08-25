/**
 * StockIQ Deterministic Strategy Algorithm Engine & 3-Tier Flag System
 * Evaluates live PSX stock data across Valuation, Momentum, Profitability, and Liquidity Risk.
 * Includes Penny Stock Guardrails (< PKR 5.00) with automatic score cap and ⚠️ Speculative badge.
 */

// Sector baseline P/E medians for Pakistan Stock Exchange
const SECTOR_PE_MEDIANS = {
  'Commercial Banks': 4.5,
  'Islamic Banking': 5.0,
  'Cement': 6.5,
  'Fertilizer': 5.8,
  'Fertilizer & Conglomerate': 6.0,
  'Oil & Gas Exploration': 4.0,
  'Oil & Gas Marketing': 4.2,
  'Technology': 15.0,
  'Power Generation': 5.5,
  'Textile': 5.0,
  'Pharmaceutical': 14.0,
  'Food & Beverages': 25.0,
  'Automobile': 8.5,
  'General': 6.5
};

// ─────────────────────────────────────────────────────────────────────────────
// PENNY STOCK DETECTOR: < PKR 5.00
// ─────────────────────────────────────────────────────────────────────────────
function isPennyStock(price) {
  return price > 0 && price < 5.0;
}

function buildPennyFlag(compositeScore) {
  return {
    tier: 'SPECULATIVE',
    label: 'Speculative Trade',
    icon: '⚠️',
    color: '#f97316',
    hexColor: '#f97316',
    bg: 'rgba(249, 115, 22, 0.12)',
    border: 'rgba(249, 115, 22, 0.35)',
    badgeClass: 'flag-speculative',
    summary: `Score ${compositeScore}/100 (Capped): High Volatility Speculative Asset — Price < PKR 5.00. Susceptible to extreme price swings, circuit breaker halts, and thin liquidity. Suitable only for risk-tolerant traders with strict stop-loss discipline.`
  };
}

export function evaluateStockAlgorithm(stock) {
  if (!stock) return null;

  const price     = Number(stock.price || 0);
  // Use actual pe_ratio if available; fall back to sector median only when truly absent
  const pe        = Number(stock.pe_ratio > 0 ? stock.pe_ratio : 0) || null;
  const pb        = Number(stock.pb_ratio > 0 ? stock.pb_ratio : 1.1);
  const roe       = Number(stock.roe > 0 ? stock.roe : 18.0);
  const divYield  = Number(stock.dividend_yield >= 0 ? stock.dividend_yield : 5.0);
  const change    = Number(stock.change || 0);
  const changePercent = Number(stock.changePercent || 0);
  const volume    = Number(typeof stock.volume === 'string' ? stock.volume.replace(/,/g, '') : (stock.volume || 1000000));

  const high52 = Number(stock.fifty_two_week_high || (price * 1.25));
  const low52  = Number(stock.fifty_two_week_low  || (price * 0.75));
  const ldcp   = Number(stock.previous_close || (price - change));

  const sector        = stock.sector || 'General';
  const sectorPEMedian = SECTOR_PE_MEDIANS[sector] || 6.5;
  const effectivePE   = pe !== null ? pe : sectorPEMedian;

  // ─── 1. Valuation Sub-Score (0–100) ───────────────────────────────────────
  const peRatioToSector = sectorPEMedian > 0 ? (effectivePE / sectorPEMedian) : 1;
  let valuationScore = 100 - (peRatioToSector * 35);
  if (effectivePE <= 4.0) valuationScore += 15;
  if (pb <= 1.0) valuationScore += 10;
  if (high52 > price && high52 > 0) {
    const discount52 = ((high52 - price) / high52) * 100;
    if (discount52 > 20) valuationScore += 8;
  }
  valuationScore = Math.max(15, Math.min(99, Math.round(valuationScore)));

  // ─── 2. Momentum Sub-Score (0–100) ────────────────────────────────────────
  let momentumScore = 50 + (changePercent * 5);
  if (volume > 2000000) momentumScore += 12;
  else if (volume > 500000) momentumScore += 6;
  else if (volume < 100000) momentumScore -= 10;
  if (price >= ldcp) momentumScore += 5;
  momentumScore = Math.max(10, Math.min(98, Math.round(momentumScore)));

  // ─── 3. Profitability & Dividend Sub-Score (0–100) ────────────────────────
  let profitabilityScore = (roe * 1.8) + (divYield * 4.5);
  if (roe >= 25.0) profitabilityScore += 10;
  if (divYield >= 8.0) profitabilityScore += 12;
  profitabilityScore = Math.max(15, Math.min(99, Math.round(profitabilityScore)));

  // ─── 4. Liquidity & Risk Sub-Score (0–100) ────────────────────────────────
  let liquidityScore = 60;
  if (volume > 3000000)  liquidityScore = 95;
  else if (volume > 1000000) liquidityScore = 85;
  else if (volume > 250000)  liquidityScore = 72;
  else if (volume < 50000)   liquidityScore = 35;
  liquidityScore = Math.max(10, Math.min(99, liquidityScore));

  // ─── 5. Composite Score (Weighted) ────────────────────────────────────────
  let compositeScore = Math.round(
    (valuationScore  * 0.35) +
    (profitabilityScore * 0.30) +
    (momentumScore   * 0.20) +
    (liquidityScore  * 0.15)
  );

  // ─── PENNY STOCK GUARDRAIL ────────────────────────────────────────────────
  const pennyStock = isPennyStock(price);
  if (pennyStock) {
    compositeScore = Math.min(compositeScore, 65); // Hard cap at 65/100
  }

  // ─── 6. 3-Tier Flag System ────────────────────────────────────────────────
  let flag;
  if (pennyStock) {
    flag = buildPennyFlag(compositeScore);
  } else if (compositeScore >= 75) {
    flag = {
      tier: 'GREEN',
      label: 'Strong Growth Buy',
      icon: '🟢',
      color: '#10b981',
      hexColor: '#10b981',
      bg: 'rgba(16, 185, 129, 0.15)',
      border: 'rgba(16, 185, 129, 0.35)',
      badgeClass: 'flag-green',
      summary: `Score ${compositeScore}/100: Top-tier value margin (P/E ${effectivePE}x), high capital efficiency (ROE ${roe}%), and healthy liquidity.`
    };
  } else if (compositeScore >= 55) {
    flag = {
      tier: 'YELLOW',
      label: 'Neutral Watch',
      icon: '🟡',
      color: '#f59e0b',
      hexColor: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.15)',
      border: 'rgba(245, 158, 11, 0.35)',
      badgeClass: 'flag-yellow',
      summary: `Score ${compositeScore}/100: Moderate valuation profile. Monitor for better entry price or volume breakout confirmation.`
    };
  } else {
    flag = {
      tier: 'RED',
      label: 'High Risk Overvalued',
      icon: '🔴',
      color: '#ef4444',
      hexColor: '#ef4444',
      bg: 'rgba(239, 68, 68, 0.15)',
      border: 'rgba(239, 68, 68, 0.35)',
      badgeClass: 'flag-red',
      summary: `Score ${compositeScore}/100: Stretched multiples relative to earnings or constrained volume liquidity. Exercise caution.`
    };
  }

  // ─── 7. Dynamic Pros ──────────────────────────────────────────────────────
  const pros = [];
  if (pennyStock) {
    pros.push(`Speculative Momentum: Sub-PKR 5 securities can generate explosive short-term percentage gains on low float.`);
    pros.push(`Volume Active: ${(volume / 1000000).toFixed(2)}M shares traded today, showing active speculative interest.`);
    if (changePercent > 0) {
      pros.push(`Positive Session: Up ${changePercent.toFixed(2)}% today — intraday bullish momentum visible.`);
    }
  } else {
    if (effectivePE <= sectorPEMedian) {
      pros.push(`Attractive Valuation: P/E of ${effectivePE}x is discounted vs ${sector} sector median (${sectorPEMedian}x).`);
    }
    if (roe >= 18.0) {
      pros.push(`High Profitability: Return on Equity stands at a healthy ${roe}%, reflecting strong operational returns.`);
    }
    if (divYield >= 6.0) {
      pros.push(`Generous Cash Yield: ${divYield}% Dividend Yield provides defensive recurring payout.`);
    }
    if (volume > 1000000 && changePercent >= 0) {
      pros.push(`Active Volume Support: ${(volume / 1000000).toFixed(2)}M shares traded with positive price stabilization.`);
    }
    if (high52 > price && ((high52 - price) / high52) > 0.15) {
      pros.push(`Upside Room: Trading ${(((high52 - price) / high52) * 100).toFixed(1)}% below 52-week peak of PKR ${high52.toLocaleString()}.`);
    }
    if (pros.length < 2) {
      pros.push(`Established Market Position: Major listed entity in the ${sector} industry.`);
    }
  }

  // ─── 8. Dynamic Cons ──────────────────────────────────────────────────────
  const cons = [];
  if (pennyStock) {
    cons.push(`⚠️ Penny Stock Risk: Price below PKR 5.00 — high susceptibility to operator manipulation, circuit breaker halts, and illiquid exit.`);
    cons.push(`Extreme Volatility: Daily swings of 20–40% common for sub-PKR 5 equities on PSX. Position sizing must be minimal.`);
    cons.push(`Fundamental Weakness: Low price often reflects deteriorating earnings, high debt load, or suspended dividends.`);
  } else {
    if (effectivePE > sectorPEMedian * 1.3) {
      cons.push(`Premium Valuation: P/E of ${effectivePE}x trades at a premium over ${sector} sector average (${sectorPEMedian}x).`);
    }
    if (volume < 150000) {
      cons.push(`Low Daily Volume: ${(volume / 1000).toFixed(0)}k shares traded today; position liquidation may face liquidity friction.`);
    }
    if (divYield < 2.0) {
      cons.push(`Low Cash Yield: Modest dividend yield of ${divYield}% offers limited cushion during market downturns.`);
    }
    if (high52 > 0 && price >= high52 * 0.92) {
      cons.push(`Near 52-Week High: Trading near peak resistance (PKR ${high52.toLocaleString()}); vulnerable to short-term profit taking.`);
    }
    cons.push(`Macroeconomic Cycle: Sensitive to inflation, interest rate shifts, and industry regulatory changes.`);
  }

  // ─── 9. Trade Strategy & Capital Allocation ───────────────────────────────
  // Target Price: midpoint between current price and 52W high
  const targetPrice = price > 0
    ? Number(Math.min(price * 1.12, (price + high52) / 2).toFixed(2))
    : 0;

  // Stop-Loss: based on day low / LDCP, whichever is stricter
  const stopLoss = price > 0
    ? Number(Math.max(low52 * 1.02, Math.min(ldcp * 0.97, price * (pennyStock ? 0.85 : 0.93))).toFixed(2))
    : 0;

  const downsidePct = price > 0 && stopLoss > 0
    ? Number(((price - stopLoss) / price * 100).toFixed(1))
    : 0;

  const upsidePct = price > 0 && targetPrice > 0
    ? Number(((targetPrice - price) / price * 100).toFixed(1))
    : 0;

  const rrRatio = downsidePct > 0 ? Number((upsidePct / downsidePct).toFixed(2)) : 0;

  let allocation, horizon;
  if (pennyStock) {
    allocation = '0.5% – 1.5% Max Capital (Speculative)';
    horizon = 'Very Short-Term Trade Only (1–5 Days)';
  } else if (compositeScore >= 75) {
    allocation = '5% – 10% Core Position';
    horizon = 'Long-Term Core Hold (6–18 Months)';
  } else if (compositeScore >= 55) {
    allocation = '2% – 5% Tactical Position';
    horizon = 'Medium-Term Hold (2–6 Months)';
  } else {
    allocation = '1% – 3% Max Capital (High Risk)';
    horizon = 'Short-Term Momentum (1–4 Weeks)';
  }

  return {
    compositeScore,
    flag,
    isPennyStock: pennyStock,
    subScores: {
      valuation: valuationScore,
      profitability: profitabilityScore,
      momentum: momentumScore,
      liquidity: liquidityScore
    },
    tradeStrategy: {
      targetPrice,
      stopLoss,
      downsidePct,
      upsidePct,
      rrRatio,
      allocation,
      horizon
    },
    pros: pros.slice(0, 4),
    cons: cons.slice(0, 3),
    rationale: flag.summary
  };
}
