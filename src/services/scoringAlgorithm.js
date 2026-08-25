/**
 * StockIQ Deterministic Strategy Algorithm Engine & 3-Tier Flag System
 * Evaluates live PSX stock data across Valuation, Momentum, Profitability, and Liquidity Risk.
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

export function evaluateStockAlgorithm(stock) {
  if (!stock) return null;

  const price = Number(stock.price || 0);
  const pe = Number(stock.pe_ratio || 6.5);
  const pb = Number(stock.pb_ratio || 1.1);
  const roe = Number(stock.roe || 18.0);
  const divYield = Number(stock.dividend_yield || 5.0);
  const change = Number(stock.change || 0);
  const changePercent = Number(stock.changePercent || 0);
  const volume = Number(typeof stock.volume === 'string' ? stock.volume.replace(/,/g, '') : (stock.volume || 1000000));
  
  const high52 = Number(stock.fifty_two_week_high || (price * 1.25));
  const low52 = Number(stock.fifty_two_week_low || (price * 0.75));
  const ldcp = Number(stock.previous_close || (price - change));

  const sector = stock.sector || 'General';
  const sectorPEMedian = SECTOR_PE_MEDIANS[sector] || 6.5;

  // 1. Valuation Sub-Score (0 - 100)
  // Evaluates P/E vs sector median and discount from 52-week peak
  const peRatioToSector = sectorPEMedian > 0 ? (pe / sectorPEMedian) : 1;
  let valuationScore = 100 - (peRatioToSector * 35);
  if (pe <= 4.0) valuationScore += 15;
  if (pb <= 1.0) valuationScore += 10;
  if (high52 > price && high52 > 0) {
    const discount52 = ((high52 - price) / high52) * 100;
    if (discount52 > 20) valuationScore += 8;
  }
  valuationScore = Math.max(15, Math.min(99, Math.round(valuationScore)));

  // 2. Momentum Sub-Score (0 - 100)
  // Evaluates price trajectory and volume surge
  let momentumScore = 50 + (changePercent * 5);
  if (volume > 2000000) momentumScore += 12;
  else if (volume > 500000) momentumScore += 6;
  else if (volume < 100000) momentumScore -= 10;
  if (price >= ldcp) momentumScore += 5;
  momentumScore = Math.max(10, Math.min(98, Math.round(momentumScore)));

  // 3. Profitability & Dividend Sub-Score (0 - 100)
  // Evaluates ROE reinvestment quality and cash yield cushion
  let profitabilityScore = (roe * 1.8) + (divYield * 4.5);
  if (roe >= 25.0) profitabilityScore += 10;
  if (divYield >= 8.0) profitabilityScore += 12;
  profitabilityScore = Math.max(15, Math.min(99, Math.round(profitabilityScore)));

  // 4. Liquidity & Risk Sub-Score (0 - 100)
  // Checks trading depth and stability
  let liquidityScore = 60;
  if (volume > 3000000) liquidityScore = 95;
  else if (volume > 1000000) liquidityScore = 85;
  else if (volume > 250000) liquidityScore = 72;
  else if (volume < 50000) liquidityScore = 35;
  liquidityScore = Math.max(10, Math.min(99, liquidityScore));

  // 5. Composite Score Calculation (Weighted)
  const compositeScore = Math.round(
    (valuationScore * 0.35) + 
    (profitabilityScore * 0.30) + 
    (momentumScore * 0.20) + 
    (liquidityScore * 0.15)
  );

  // 6. Intuitive 3-Tier Flag System Assignment
  let flag = {
    tier: 'GREEN',
    label: 'Strong Growth Buy',
    icon: '🟢',
    color: '#10b981',
    hexColor: '#10b981',
    bg: 'rgba(16, 185, 129, 0.15)',
    border: 'rgba(16, 185, 129, 0.35)',
    badgeClass: 'flag-green',
    summary: 'Robust fundamental valuation with strong earnings yield, safe liquidity, and upside momentum.'
  };

  if (compositeScore >= 75) {
    flag = {
      tier: 'GREEN',
      label: 'Strong Growth Buy',
      icon: '🟢',
      color: '#10b981',
      hexColor: '#10b981',
      bg: 'rgba(16, 185, 129, 0.15)',
      border: 'rgba(16, 185, 129, 0.35)',
      badgeClass: 'flag-green',
      summary: `Score ${compositeScore}/100: Top-tier value margin (P/E ${pe}x), high capital efficiency (ROE ${roe}%), and healthy liquidity.`
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

  // 7. Dynamic Pros (Reasons to Buy)
  const pros = [];
  if (pe <= sectorPEMedian) {
    pros.push(`Attractive Valuation: P/E of ${pe}x is discounted vs ${sector} sector median (${sectorPEMedian}x).`);
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

  // 8. Dynamic Cons (Risk Factors)
  const cons = [];
  if (pe > sectorPEMedian * 1.3) {
    cons.push(`Premium Valuation: P/E of ${pe}x trades at a premium over ${sector} sector average (${sectorPEMedian}x).`);
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

  return {
    compositeScore,
    flag,
    subScores: {
      valuation: valuationScore,
      profitability: profitabilityScore,
      momentum: momentumScore,
      liquidity: liquidityScore
    },
    pros: pros.slice(0, 4),
    cons: cons.slice(0, 3),
    rationale: flag.summary
  };
}
