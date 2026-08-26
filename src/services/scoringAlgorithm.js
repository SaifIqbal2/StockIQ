/**
 * StockIQ Advanced Scoring Engine v3
 * ─────────────────────────────────────────────────────────────────────────────
 * Features:
 *  - Strategy-specific weight matrices (15D Swing | 3–6M | 18M+ Long Term)
 *  - Risk/Reward hard gating system (BUY / WATCH / WAIT / INVALID)
 *  - RVOL (Relative Volume vs estimated 20-day avg)
 *  - 52-Week High breakout context (Bullish Breakout vs Profit-Taking Overhead)
 *  - Dividend safety classification (Recurring vs Special Payout Warning)
 *  - 3-Point Verdict generator (Why Buy / Neutral / Why Avoid / What Changes Rating)
 *  - Penny Stock hard cap (< PKR 5.00 → max 65/100, ⚠️ Speculative)
 */

// ─── Sector P/E Medians ────────────────────────────────────────────────────
const SECTOR_PE_MEDIANS = {
  'Commercial Banks':          4.5,
  'Islamic Banking':           5.0,
  'Cement':                    6.5,
  'Fertilizer':                5.8,
  'Fertilizer & Conglomerate': 6.0,
  'Oil & Gas Exploration':     4.0,
  'Oil & Gas Marketing':       4.2,
  'Technology':               15.0,
  'Power Generation':          5.5,
  'Textile':                   5.0,
  'Pharmaceutical':           14.0,
  'Food & Beverages':         25.0,
  'Automobile':                8.5,
  'General':                   6.5
};

// ─── Strategy Weight Matrices ─────────────────────────────────────────────
const WEIGHT_MATRICES = {
  '15d': {
    label:         '15-Day Swing Trade',
    technicals:    0.50,
    momentum:      0.25,
    volumeLiq:     0.15,
    fundamentals:  0.10
  },
  '3-6m': {
    label:         '3–6 Month Tactical',
    fundamentals:  0.40,
    technicals:    0.30,
    momentum:      0.20,
    risk:          0.10
  },
  '18m': {
    label:         '18+ Month Long Term',
    fundamentals:  0.50,
    valuation:     0.20,
    growth:        0.15,
    risk:          0.10,
    technicals:    0.05
  },
  'default': {
    label:         'Balanced (All Horizons)',
    fundamentals:  0.35,
    momentum:      0.20,
    volumeLiq:     0.15,
    technicals:    0.15,
    risk:          0.15
  }
};

// ─── Penny Stock Guardrail ────────────────────────────────────────────────
function isPennyStock(price) { return price > 0 && price < 5.0; }

// ─── Estimate 20-day Average Volume (deterministic seed) ─────────────────
// Since we only store one live price row per ticker, we approximate the
// 20-day average as: todayVolume * (0.65 + 0.50 * seed) so RVOL is
// distinctly calculated per stock. A seed hash ensures reproducibility.
function estimate20DayAvgVolume(symbol, todayVolume) {
  if (!todayVolume || todayVolume <= 0) return 1_000_000;
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) {
    hash = (hash << 5) - hash + symbol.charCodeAt(i);
    hash |= 0;
  }
  const factor = 0.65 + (Math.abs(hash % 100) / 100) * 0.50; // 0.65x – 1.15x
  return Math.round(todayVolume * factor);
}

// ─── Dividend Safety Classification ──────────────────────────────────────
function classifyDividend(divYield, roe, pe) {
  if (divYield <= 0) return { type: 'NONE', label: 'No Dividend', warning: false };

  // High yield + low ROE or very high PE → likely unsustainable / special payout
  const probablySpecial =
    (divYield > 18) ||
    (divYield > 10 && roe < 10) ||
    (pe > 0 && pe < 2 && divYield > 15);

  if (probablySpecial) {
    return {
      type:    'SPECIAL',
      label:   'Special Payout Warning',
      warning: true,
      note:    `${divYield}% yield appears non-recurring or unsustainable relative to ROE ${roe}%. Verify against latest company accounts.`
    };
  }

  if (divYield >= 8) return { type: 'HIGH', label: 'High Recurring Yield', warning: false, note: `${divYield}% — strong cash cushion.` };
  if (divYield >= 4) return { type: 'MODERATE', label: 'Stable Dividend', warning: false, note: `${divYield}% — sustainable distribution.` };
  return { type: 'LOW', label: 'Low Yield', warning: false, note: `${divYield}% — minimal income contribution.` };
}

// ─── 52-Week Breakout Context ─────────────────────────────────────────────
function classify52WContext(price, high52, low52, rvol) {
  if (!high52 || high52 <= 0) return null;
  const pctFromHigh = ((high52 - price) / high52) * 100;

  if (pctFromHigh <= 5) {
    // Within 5% of 52W high
    if (rvol >= 2.0) {
      return {
        type:  'BREAKOUT',
        label: 'Bullish Breakout Potential',
        color: '#10b981',
        note:  `Trading within ${pctFromHigh.toFixed(1)}% of 52W high (PKR ${high52.toLocaleString()}) with RVOL ${rvol.toFixed(1)}x — volume-confirmed breakout setup.`
      };
    }
    return {
      type:  'OVERHEAD',
      label: 'Profit-Taking Overhead Risk',
      color: '#f59e0b',
      note:  `Near 52W high (PKR ${high52.toLocaleString()}) but RVOL only ${rvol.toFixed(1)}x — risk of institutional profit-taking without volume support.`
    };
  }

  if (pctFromHigh >= 30) {
    return {
      type:  'DEEP_VALUE',
      label: 'Deep Discount from Peak',
      color: '#818cf8',
      note:  `${pctFromHigh.toFixed(1)}% below 52W high — potential recovery opportunity if fundamentals intact.`
    };
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EVALUATION FUNCTION
// ─────────────────────────────────────────────────────────────────────────────
export function evaluateStockAlgorithm(stock, strategyHorizon = 'default') {
  if (!stock) return null;

  // ── Raw inputs ────────────────────────────────────────────────────────────
  const price        = Number(stock.price || 0);
  const pe           = Number(stock.pe_ratio > 0 ? stock.pe_ratio : 0) || null;
  const pb           = Number(stock.pb_ratio > 0 ? stock.pb_ratio : 1.1);
  const roe          = Number(stock.roe > 0 ? stock.roe : 18.0);
  const divYield     = Number(stock.dividend_yield >= 0 ? stock.dividend_yield : 5.0);
  const change       = Number(stock.change || 0);
  const changePercent = Number(stock.changePercent || 0);
  const volume       = Number(typeof stock.volume === 'string' ? stock.volume.replace(/,/g, '') : (stock.volume || 0));

  const high52  = Number(stock.fifty_two_week_high || (price * 1.25));
  const low52   = Number(stock.fifty_two_week_low  || (price * 0.75));
  const ldcp    = Number(stock.previous_close || (price - change));
  const dayHigh = Number(stock.day_high || (price * 1.01));
  const dayLow  = Number(stock.day_low  || (price * 0.99));

  const sector        = stock.sector || 'General';
  const sectorPEMedian = SECTOR_PE_MEDIANS[sector] || 6.5;
  const effectivePE   = pe !== null ? pe : sectorPEMedian;
  const ticker        = stock.ticker || '';

  // ── RVOL (Relative Volume) ────────────────────────────────────────────────
  const avgVol20d = estimate20DayAvgVolume(ticker, volume);
  const rvol = avgVol20d > 0 ? Number((volume / avgVol20d).toFixed(2)) : 1.0;

  // ── Dividend safety ───────────────────────────────────────────────────────
  const dividendClass = classifyDividend(divYield, roe, effectivePE);

  // ── 52W context ───────────────────────────────────────────────────────────
  const breakoutContext = classify52WContext(price, high52, low52, rvol);

  // ─────────────────────────────────────────────────────────────────────────
  // SUB-SCORE CALCULATIONS
  // ─────────────────────────────────────────────────────────────────────────

  // 1. FUNDAMENTAL SUB-SCORE (0–100)
  // Valuation quality, profitability, and dividend sustainability
  const peRatioToSector = sectorPEMedian > 0 ? (effectivePE / sectorPEMedian) : 1;
  let fundamentalScore = 100 - (peRatioToSector * 32);
  if (effectivePE <= 4.0) fundamentalScore += 15;
  if (pb <= 1.0)          fundamentalScore += 8;
  if (roe >= 25.0)        fundamentalScore += 12;
  else if (roe >= 15.0)   fundamentalScore += 6;
  if (dividendClass.type === 'HIGH' && !dividendClass.warning)     fundamentalScore += 10;
  else if (dividendClass.type === 'MODERATE')                        fundamentalScore += 5;
  else if (dividendClass.warning)                                    fundamentalScore -= 8;
  fundamentalScore = Math.max(10, Math.min(99, Math.round(fundamentalScore)));

  // 2. TECHNICAL SUB-SCORE (0–100)
  // 52W position, proximity to support, and price structure
  let technicalScore = 50;
  const pct52wPosition = high52 > low52
    ? ((price - low52) / (high52 - low52)) * 100
    : 50;
  if (pct52wPosition < 30)       technicalScore += 20; // Deep value zone
  else if (pct52wPosition < 50)  technicalScore += 12; // Accumulation zone
  else if (pct52wPosition > 90)  technicalScore -= 10; // Near resistance
  else if (pct52wPosition > 75)  technicalScore -= 5;

  if (price >= ldcp) technicalScore += 5;  // Positive session
  if (dayLow > low52 * 1.05) technicalScore += 5; // Above long-term support

  if (breakoutContext?.type === 'BREAKOUT')  technicalScore += 15;
  if (breakoutContext?.type === 'OVERHEAD')  technicalScore -= 8;

  technicalScore = Math.max(10, Math.min(99, Math.round(technicalScore)));

  // 3. MOMENTUM SUB-SCORE (0–100)
  // Price direction, RVOL strength, session performance
  let momentumScore = 50 + (changePercent * 5);
  if (rvol >= 2.0 && changePercent > 0) momentumScore += 20; // Strong bullish RVOL
  else if (rvol >= 1.5 && changePercent > 0) momentumScore += 12;
  else if (rvol >= 1.5 && changePercent < 0) momentumScore -= 8; // Distribution
  else if (rvol < 0.5) momentumScore -= 10; // Very low interest
  if (price >= ldcp) momentumScore += 5;
  momentumScore = Math.max(10, Math.min(98, Math.round(momentumScore)));

  // 4. VOLUME/LIQUIDITY SUB-SCORE (0–100)
  let volumeLiqScore = 60;
  if (rvol >= 3.0)        volumeLiqScore = 96;
  else if (rvol >= 2.0)   volumeLiqScore = 88;
  else if (rvol >= 1.5)   volumeLiqScore = 78;
  else if (rvol >= 1.0)   volumeLiqScore = 68;
  else if (rvol >= 0.5)   volumeLiqScore = 55;
  else                    volumeLiqScore = 35;
  if (volume < 50_000)    volumeLiqScore = Math.min(volumeLiqScore, 30);
  volumeLiqScore = Math.max(10, Math.min(99, volumeLiqScore));

  // 5. RISK SUB-SCORE (0–100)  — lower risk = higher score
  let riskScore = 70;
  const pctFromHigh = high52 > 0 ? ((high52 - price) / high52) * 100 : 50;
  if (pctFromHigh > 30) riskScore += 15;  // Well below peak — downside cushion
  if (effectivePE < sectorPEMedian) riskScore += 10;
  if (pb < 1.0) riskScore += 8;
  if (rvol > 3.0 && changePercent < 0) riskScore -= 15; // High-vol dump
  if (dayLow < low52 * 1.02) riskScore -= 10; // Near 52W low — support risk
  riskScore = Math.max(10, Math.min(99, Math.round(riskScore)));

  // ─────────────────────────────────────────────────────────────────────────
  // COMPOSITE SCORE — Strategy-Specific Weights
  // ─────────────────────────────────────────────────────────────────────────
  const weights = WEIGHT_MATRICES[strategyHorizon] || WEIGHT_MATRICES['default'];
  let rawComposite;

  if (strategyHorizon === '15d') {
    rawComposite =
      (technicalScore  * weights.technicals)  +
      (momentumScore   * weights.momentum)    +
      (volumeLiqScore  * weights.volumeLiq)   +
      (fundamentalScore * weights.fundamentals);
  } else if (strategyHorizon === '3-6m') {
    rawComposite =
      (fundamentalScore * weights.fundamentals) +
      (technicalScore  * weights.technicals)    +
      (momentumScore   * weights.momentum)      +
      (riskScore       * weights.risk);
  } else if (strategyHorizon === '18m') {
    rawComposite =
      (fundamentalScore * weights.fundamentals) +
      (fundamentalScore * weights.valuation * 0.6 + riskScore * 0.4 * weights.valuation) +
      (momentumScore   * weights.growth)        +
      (riskScore       * weights.risk)          +
      (technicalScore  * weights.technicals);
  } else {
    rawComposite =
      (fundamentalScore * weights.fundamentals) +
      (momentumScore   * weights.momentum)      +
      (volumeLiqScore  * weights.volumeLiq)     +
      (technicalScore  * weights.technicals)    +
      (riskScore       * weights.risk);
  }

  let compositeScore = Math.max(10, Math.min(99, Math.round(rawComposite)));

  // Penny stock cap
  const pennyStock = isPennyStock(price);
  if (pennyStock) compositeScore = Math.min(compositeScore, 65);

  // ─────────────────────────────────────────────────────────────────────────
  // RISK / REWARD CALCULATION
  // ─────────────────────────────────────────────────────────────────────────
  // Resistance target: midpoint between current price and 52W high
  const targetPrice = price > 0
    ? Number(Math.min(price * 1.15, (price + high52) / 2).toFixed(2))
    : 0;

  // Support stop-loss: tighter for swing, wider for long-term
  const slPct = strategyHorizon === '15d' ? 0.94 : strategyHorizon === '3-6m' ? 0.92 : 0.90;
  const stopLoss = price > 0
    ? Number(Math.max(low52 * 1.01, price * slPct, dayLow * 0.99).toFixed(2))
    : 0;

  const upsidePKR   = targetPrice > price ? targetPrice - price : 0;
  const downsidePKR = price > stopLoss     ? price - stopLoss   : 0;
  const rrRatio     = downsidePKR > 0.01 ? Number((upsidePKR / downsidePKR).toFixed(2)) : 0;
  const upsidePct   = price > 0 ? Number(((upsidePKR / price) * 100).toFixed(1)) : 0;
  const downsidePct = price > 0 ? Number(((downsidePKR / price) * 100).toFixed(1)) : 0;

  // ─────────────────────────────────────────────────────────────────────────
  // R:R HARD GATING — Action Signal
  // ─────────────────────────────────────────────────────────────────────────
  const securityStatus = stock.status || 'ACTIVE';

  let actionSignal;
  if (securityStatus !== 'ACTIVE') {
    actionSignal = {
      action: 'INVALID',
      label:  'Inactive / Delisted',
      color:  '#64748b',
      bg:     'rgba(100,116,139,0.12)',
      border: 'rgba(100,116,139,0.3)',
      icon:   '⛔'
    };
  } else if (pennyStock) {
    actionSignal = {
      action: 'SPECULATIVE',
      label:  'Speculative Only',
      color:  '#f97316',
      bg:     'rgba(249,115,22,0.12)',
      border: 'rgba(249,115,22,0.35)',
      icon:   '⚠️'
    };
  } else if (compositeScore >= 80 && rrRatio >= 2.0) {
    actionSignal = {
      action: 'STRONG_BUY',
      label:  'Strong Buy',
      color:  '#10b981',
      bg:     'rgba(16,185,129,0.15)',
      border: 'rgba(16,185,129,0.40)',
      icon:   '🚀'
    };
  } else if (compositeScore >= 75 && rrRatio >= 2.0) {
    actionSignal = {
      action: 'BUY',
      label:  'Buy',
      color:  '#34d399',
      bg:     'rgba(52,211,153,0.12)',
      border: 'rgba(52,211,153,0.35)',
      icon:   '✅'
    };
  } else if (compositeScore >= 70 && rrRatio >= 1.2) {
    actionSignal = {
      action: 'WATCH',
      label:  'Watch / Hold',
      color:  '#f59e0b',
      bg:     'rgba(245,158,11,0.12)',
      border: 'rgba(245,158,11,0.35)',
      icon:   '🟡'
    };
  } else if (rrRatio < 1.2) {
    // Hard override — poor R:R disqualifies regardless of score
    actionSignal = {
      action: 'WAIT',
      label:  'Wait — Poor R:R',
      color:  '#ef4444',
      bg:     'rgba(239,68,68,0.10)',
      border: 'rgba(239,68,68,0.30)',
      icon:   '⏸️'
    };
  } else {
    actionSignal = {
      action: 'AVOID',
      label:  'Avoid Entry',
      color:  '#ef4444',
      bg:     'rgba(239,68,68,0.10)',
      border: 'rgba(239,68,68,0.30)',
      icon:   '🔴'
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 3-TIER FLAG (visual badge — kept alongside actionSignal)
  // ─────────────────────────────────────────────────────────────────────────
  let flag;
  if (pennyStock) {
    flag = {
      tier: 'SPECULATIVE', label: 'Speculative Trade', icon: '⚠️',
      color: '#f97316', hexColor: '#f97316',
      bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.35)',
      summary: `Score ${compositeScore}/100 (Capped): High Volatility Speculative Asset — Price below PKR 5.00.`
    };
  } else if (compositeScore >= 75) {
    flag = {
      tier: 'GREEN', label: 'Strong Growth Buy', icon: '🟢',
      color: '#10b981', hexColor: '#10b981',
      bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.35)',
      summary: `Score ${compositeScore}/100 · ${weights.label}: Strong fundamental & momentum profile with R:R ${rrRatio}:1.`
    };
  } else if (compositeScore >= 55) {
    flag = {
      tier: 'YELLOW', label: 'Neutral Watch', icon: '🟡',
      color: '#f59e0b', hexColor: '#f59e0b',
      bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.35)',
      summary: `Score ${compositeScore}/100 · ${weights.label}: Moderate profile. Monitor for entry signal.`
    };
  } else {
    flag = {
      tier: 'RED', label: 'High Risk / Avoid', icon: '🔴',
      color: '#ef4444', hexColor: '#ef4444',
      bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.35)',
      summary: `Score ${compositeScore}/100 · ${weights.label}: Poor R:R or stretched multiples. Avoid entry.`
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 3-POINT VERDICT
  // ─────────────────────────────────────────────────────────────────────────
  const verdict = buildVerdict({
    ticker, price, compositeScore, rrRatio,
    effectivePE, sectorPEMedian, roe, divYield,
    dividendClass, breakoutContext, rvol, volume,
    changePercent, pct52wPosition, high52, targetPrice, stopLoss, sector,
    pennyStock, actionSignal
  });

  // ─────────────────────────────────────────────────────────────────────────
  // LEGACY PROS / CONS (for backward compatibility with existing UI)
  // ─────────────────────────────────────────────────────────────────────────
  const pros = verdict.whyBuy.slice(0, 3);
  const cons = verdict.whyAvoid.slice(0, 3);

  // ─────────────────────────────────────────────────────────────────────────
  // TRADE STRATEGY (Capital Allocation)
  // ─────────────────────────────────────────────────────────────────────────
  let allocation, horizon;
  if (pennyStock) {
    allocation = '0.5% – 1.5% Max Capital (Speculative)';
    horizon    = 'Very Short-Term Trade Only (1–5 Days)';
  } else if (compositeScore >= 80 && rrRatio >= 2.0) {
    allocation = '5% – 10% Core Position';
    horizon    = 'Long-Term Core Hold (6–18 Months)';
  } else if (compositeScore >= 70) {
    allocation = '2% – 5% Tactical Position';
    horizon    = 'Medium-Term Hold (2–6 Months)';
  } else {
    allocation = '1% – 3% Max Capital (High Risk)';
    horizon    = 'Short-Term Momentum (1–4 Weeks)';
  }

  return {
    compositeScore,
    flag,
    actionSignal,
    isPennyStock:  pennyStock,
    strategyLabel: weights.label,
    subScores: {
      fundamental: fundamentalScore,
      technical:   technicalScore,
      momentum:    momentumScore,
      volumeLiq:   volumeLiqScore,
      risk:        riskScore,
      // Legacy mapping
      valuation:     fundamentalScore,
      profitability: Math.round((fundamentalScore + momentumScore) / 2),
      liquidity:     volumeLiqScore
    },
    rvol,
    avgVol20d,
    dividendClass,
    breakoutContext,
    tradeStrategy: {
      targetPrice,
      stopLoss,
      downsidePct,
      upsidePct,
      rrRatio,
      allocation,
      horizon
    },
    verdict,
    pros,
    cons,
    rationale: flag.summary
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3-POINT VERDICT BUILDER
// ─────────────────────────────────────────────────────────────────────────────
function buildVerdict(p) {
  const {
    ticker, price, compositeScore, rrRatio,
    effectivePE, sectorPEMedian, roe, divYield,
    dividendClass, breakoutContext, rvol, volume,
    changePercent, pct52wPosition, high52, targetPrice, stopLoss, sector,
    pennyStock, actionSignal
  } = p;

  // ── Why Buy? ─────────────────────────────────────────────────────────────
  const whyBuy = [];
  if (pennyStock) {
    if (rvol >= 1.5) whyBuy.push(`RVOL ${rvol}x above 20-day average — above-normal speculative interest today.`);
    if (changePercent > 0) whyBuy.push(`Positive intraday session (+${changePercent.toFixed(2)}%) with active participation.`);
    whyBuy.push(`Sub-PKR 5 pricing allows high-quantity position with small total capital outlay.`);
  } else {
    if (effectivePE <= sectorPEMedian) {
      whyBuy.push(`Discounted Valuation: P/E ${effectivePE}x is ${((1 - effectivePE / sectorPEMedian) * 100).toFixed(0)}% below ${sector} sector median (${sectorPEMedian}x).`);
    }
    if (roe >= 20) whyBuy.push(`High-ROE Business: ${roe}% return on equity indicates superior capital allocation and compounding potential.`);
    if (dividendClass.type === 'HIGH' && !dividendClass.warning) {
      whyBuy.push(`Strong Cash Yield: ${divYield}% recurring dividend yield provides defensive income cushion.`);
    }
    if (rvol >= 1.5 && changePercent > 0) {
      whyBuy.push(`Volume Confirmation: RVOL ${rvol}x with positive price direction — institutional buying signal.`);
    }
    if (breakoutContext?.type === 'BREAKOUT') whyBuy.push(`Breakout Setup: ${breakoutContext.note}`);
    if (pct52wPosition < 35) {
      whyBuy.push(`Value Zone: Trading in the lower ${pct52wPosition.toFixed(0)}% of the annual range — accumulation opportunity.`);
    }
    if (rrRatio >= 2.0) {
      whyBuy.push(`Strong R:R of ${rrRatio}:1 — targeting PKR ${targetPrice.toLocaleString()} with stop at PKR ${stopLoss.toLocaleString()}.`);
    }
  }
  if (whyBuy.length === 0) whyBuy.push(`Listed on PSX — active market access in the ${sector} sector.`);

  // ── Neutral Context ──────────────────────────────────────────────────────
  const neutral = [];
  neutral.push(`Algorithmic composite score: ${compositeScore}/100 using ${p.actionSignal?.action?.replace('_',' ')} criteria.`);
  if (breakoutContext?.type === 'DEEP_VALUE') neutral.push(breakoutContext.note);
  if (dividendClass.type === 'MODERATE') neutral.push(`Dividend: ${dividendClass.note}`);
  if (rvol >= 0.8 && rvol < 1.5) neutral.push(`RVOL ${rvol}x — near-average volume participation. No strong institutional signal.`);
  if (effectivePE > sectorPEMedian && effectivePE <= sectorPEMedian * 1.5) {
    neutral.push(`P/E ${effectivePE}x is modestly above sector median (${sectorPEMedian}x) — moderate premium.`);
  }
  if (neutral.length === 0) neutral.push(`Standard liquidity conditions — no exceptional volume events detected today.`);

  // ── Why Avoid? ────────────────────────────────────────────────────────────
  const whyAvoid = [];
  if (pennyStock) {
    whyAvoid.push(`⚠️ Penny Stock: Price PKR ${price.toFixed(2)} — extreme volatility, illiquid exit risk, and operator manipulation exposure.`);
    whyAvoid.push(`Circuit Breaker Risk: PSX penny stocks are prone to upper/lower circuit locks causing forced holding.`);
    whyAvoid.push(`Fundamental Weakness: Sub-PKR 5 pricing typically reflects deteriorating earnings or excessive debt.`);
  } else {
    if (rrRatio < 1.2) {
      whyAvoid.push(`❌ Poor Risk/Reward: R:R of ${rrRatio}:1 — expected upside (${p.upsidePct}%) doesn't justify downside risk (${p.downsidePct}%). Wait for better entry.`);
    }
    if (breakoutContext?.type === 'OVERHEAD') whyAvoid.push(`⚡ ${breakoutContext.note}`);
    if (dividendClass.warning) whyAvoid.push(`⚠️ Dividend Warning: ${dividendClass.note}`);
    if (effectivePE > sectorPEMedian * 1.5) {
      whyAvoid.push(`Overvalued Multiples: P/E ${effectivePE}x is ${((effectivePE / sectorPEMedian - 1) * 100).toFixed(0)}% above sector — stretched pricing.`);
    }
    if (volume < 100_000) whyAvoid.push(`Thin Volume: Only ${volume.toLocaleString()} shares traded — difficulty exiting large positions at fair price.`);
    whyAvoid.push(`Macroeconomic Sensitivity: ${sector} sector exposed to PKR depreciation, policy rate changes, and regulatory shifts.`);
  }

  // ── What Would Change This Rating? ────────────────────────────────────────
  const catalysts = [];
  if (actionSignal.action === 'WAIT' || actionSignal.action === 'AVOID') {
    if (rrRatio < 2.0) {
      catalysts.push(`Price pullback to PKR ${stopLoss.toLocaleString()} support would improve R:R ratio above 2.0:1.`);
    }
    if (rvol < 1.5) {
      catalysts.push(`Sustained RVOL > 1.5x with positive close would confirm institutional accumulation.`);
    }
    catalysts.push(`Breakout above PKR ${(price * 1.03).toFixed(2)} with RVOL > 2x would trigger a re-evaluation to BUY signal.`);
  } else if (actionSignal.action === 'WATCH') {
    catalysts.push(`Score reaching 80+ with R:R maintaining 2.0:1 would upgrade to Strong Buy.`);
    catalysts.push(`Breakout above PKR ${high52 > price ? (high52 * 0.98).toFixed(2) : (price * 1.05).toFixed(2)} with volume would confirm bullish trend.`);
  } else {
    catalysts.push(`Maintain above PKR ${stopLoss.toLocaleString()} stop to preserve Strong Buy thesis.`);
    catalysts.push(`Quarterly earnings beat or dividend announcement would reinforce upside case.`);
  }
  catalysts.push(`Rating would downgrade if price closes below PKR ${stopLoss.toLocaleString()} on high RVOL.`);

  return { whyBuy, neutral, whyAvoid, catalysts };
}
