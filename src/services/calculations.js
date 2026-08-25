/**
 * StockIQ Pure Client-Side Financial Calculation & Strategy Engine
 * Note: Purely analytical stock fitness scores. Contains NO direct financial buy/sell advice.
 */

export function calculateFinancialMetrics(financials, marketCap, sharePrice) {
  if (!financials) return null;

  const {
    revenue = 0,
    gross_profit = 0,
    operating_income = 0,
    net_income = 0,
    total_assets = 1,
    total_liabilities = 0,
    total_equity = 1,
    current_assets = 1,
    current_liabilities = 1,
    eps = 0
  } = financials;

  // Valuation
  const pe = sharePrice && eps ? (sharePrice / eps) : 0;
  const pb = marketCap && total_equity ? (marketCap / total_equity) : 0;
  const ps = marketCap && revenue ? (marketCap / revenue) : 0;

  // Profitability
  const roe = total_equity ? ((net_income / total_equity) * 100) : 0;
  const roa = total_assets ? ((net_income / total_assets) * 100) : 0;
  const grossMargin = revenue ? ((gross_profit / revenue) * 100) : 0;
  const netMargin = revenue ? ((net_income / revenue) * 100) : 0;

  // Solvency & Liquidity
  const debtToEquity = total_equity ? (total_liabilities / total_equity) : 0;
  const currentRatio = current_liabilities ? (current_assets / current_liabilities) : 0;

  return {
    pe: Number(pe.toFixed(2)),
    pb: Number(pb.toFixed(2)),
    ps: Number(ps.toFixed(2)),
    roe: Number(roe.toFixed(2)),
    roa: Number(roa.toFixed(2)),
    grossMargin: Number(grossMargin.toFixed(2)),
    netMargin: Number(netMargin.toFixed(2)),
    debtToEquity: Number(debtToEquity.toFixed(2)),
    currentRatio: Number(currentRatio.toFixed(2))
  };
}

/**
 * Returns strategy fitness label and color scheme based on overall StockIQ score
 */
export function getStrategyVerdict(overallScore) {
  const score = Number(overallScore);
  if (score >= 85) {
    return {
      label: 'STRONG FIT',
      bgClass: 'bg-emerald-600/20',
      textClass: 'text-emerald-400',
      borderClass: 'border-emerald-500/40',
      glowClass: 'glow-emerald',
      hexColor: '#059669'
    };
  } else if (score >= 70) {
    return {
      label: 'GOOD FIT',
      bgClass: 'bg-green-600/20',
      textClass: 'text-green-400',
      borderClass: 'border-green-500/40',
      glowClass: 'glow-green',
      hexColor: '#16A34A'
    };
  } else if (score >= 55) {
    return {
      label: 'MODERATE FIT',
      bgClass: 'bg-amber-600/20',
      textClass: 'text-amber-400',
      borderClass: 'border-amber-500/40',
      glowClass: 'glow-amber',
      hexColor: '#D97706'
    };
  } else if (score >= 40) {
    return {
      label: 'WEAK FIT',
      bgClass: 'bg-orange-600/20',
      textClass: 'text-orange-400',
      borderClass: 'border-orange-500/40',
      glowClass: 'glow-orange',
      hexColor: '#EA580C'
    };
  } else {
    return {
      label: 'POOR FIT',
      bgClass: 'bg-red-600/20',
      textClass: 'text-red-400',
      borderClass: 'border-red-500/40',
      glowClass: 'glow-red',
      hexColor: '#DC2626'
    };
  }
}

export function computeStockIQScore(company) {
  const f = company.financials || {};
  const metrics = calculateFinancialMetrics(f, company.market_cap, company.price) || {};

  // Profitability Score (0 - 100)
  let profitabilityScore = 50;
  if (metrics.roe > 25) profitabilityScore = 95;
  else if (metrics.roe > 18) profitabilityScore = 85;
  else if (metrics.roe > 12) profitabilityScore = 70;
  else if (metrics.roe > 5) profitabilityScore = 55;
  else profitabilityScore = 30;

  // Valuation Score (0 - 100)
  let valuationScore = 50;
  if (metrics.pe > 0 && metrics.pe < 6) valuationScore = 95;
  else if (metrics.pe < 10) valuationScore = 85;
  else if (metrics.pe < 15) valuationScore = 70;
  else if (metrics.pe < 25) valuationScore = 50;
  else valuationScore = 30;

  // Solvency & Health Score
  let solvencyScore = 50;
  if (metrics.debtToEquity < 0.5) solvencyScore = 90;
  else if (metrics.debtToEquity < 1.0) solvencyScore = 80;
  else if (metrics.debtToEquity < 2.0) solvencyScore = 60;
  else solvencyScore = 35;

  // Liquidity
  let liquidityScore = metrics.currentRatio > 1.5 ? 88 : (metrics.currentRatio > 1.0 ? 70 : 40);

  // Dividend Score
  let dividendScore = (company.dividend_yield || 0) > 10 ? 95 : ((company.dividend_yield || 0) > 5 ? 80 : 50);

  // Growth, Efficiency, Quality, Momentum, Risk
  const growthScore = company.scores?.growth || 80;
  const efficiencyScore = company.scores?.efficiency || 82;
  const qualityScore = Math.round((profitabilityScore + solvencyScore) / 2);
  const momentumScore = company.changePercent > 0 ? 82 : 60;
  const riskScore = metrics.debtToEquity > 1.5 ? 65 : 25;

  const overall = Number((
    (profitabilityScore * 0.15) +
    (valuationScore * 0.15) +
    (solvencyScore * 0.10) +
    (liquidityScore * 0.10) +
    (growthScore * 0.12) +
    (efficiencyScore * 0.10) +
    (qualityScore * 0.12) +
    (momentumScore * 0.08) +
    (dividendScore * 0.08)
  ).toFixed(1));

  const verdict = getStrategyVerdict(overall);

  return {
    profitability: profitabilityScore,
    valuation: valuationScore,
    solvency: solvencyScore,
    liquidity: liquidityScore,
    growth: growthScore,
    efficiency: efficiencyScore,
    quality: qualityScore,
    momentum: momentumScore,
    dividend: dividendScore,
    risk: riskScore,
    overall,
    verdict: verdict.label,
    verdictDetails: verdict
  };
}
