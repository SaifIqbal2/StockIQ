/**
 * StockIQ Filter Engine (v3 with Granular Financial Metrics)
 * ─────────────────────────────────────────────────────────────────────────────
 * Filters PSX stock universe across Time Horizon, Budget, Sector, Risk Strategy,
 * Max P/E, Min Dividend Yield %, and Min ROE %.
 */

// ─── Time Horizon Filter ───────────────────────────────────────────────────
function applyTimeHorizonFilter(stocks, horizon) {
  if (!horizon || horizon === 'all') return stocks;

  return stocks.filter(s => {
    const vol       = Number(s.volume || 0);
    const chgPct    = Number(s.changePercent || 0);
    const pe        = Number(s.pe_ratio || 999);
    const roe       = Number(s.roe || 0);
    const divYield  = Number(s.dividend_yield || 0);

    switch (horizon) {
      case '15d':
        return vol >= 1_000_000 && chgPct >= 1.5;
      case '1m':
        return pe < 8 && vol > 200_000;
      case '45d':
        return pe < 8 && vol > 100_000;
      case '2m':
        return roe >= 15 || divYield >= 8;
      default:
        return true;
    }
  });
}

// ─── Investment Budget Filter ─────────────────────────────────────────────
function applyBudgetFilter(stocks, budget) {
  if (!budget || Number(budget) <= 0) return stocks;
  const budgetNum = Number(budget);

  return stocks.filter(s => {
    const price = Number(s.price || 0);
    if (price <= 0) return false;
    return price * 100 <= budgetNum;
  });
}

// ─── Sector Filter ────────────────────────────────────────────────────────
function applySectorFilter(stocks, sector) {
  if (!sector || sector === 'all') return stocks;
  return stocks.filter(s => {
    const stockSector = (s.sector || '').toLowerCase();
    return stockSector.includes(sector.toLowerCase());
  });
}

// ─── Risk Strategy Filter ─────────────────────────────────────────────────
function applyRiskStrategyFilter(stocks, strategy) {
  if (!strategy || strategy === 'all') return stocks;

  return stocks.filter(s => {
    const algo     = s.algorithmicAssessment;
    const score    = algo?.compositeScore || 0;
    const flagTier = algo?.flag?.tier || '';
    const vol      = Number(s.volume || 0);
    const divYield = Number(s.dividend_yield || 0);

    switch (strategy) {
      case 'green':
        return flagTier === 'GREEN' && score >= 75;
      case 'momentum':
        return vol >= 2_000_000 && Number(s.changePercent || 0) > 0;
      case 'dividend':
        return divYield >= 6 && flagTier !== 'SPECULATIVE';
      default:
        return true;
    }
  });
}

// ─── Granular Financial Ratio Filters ──────────────────────────────────────
function applyGranularFilters(stocks, filters) {
  const { maxPE, minDivYield, minROE } = filters;

  return stocks.filter(s => {
    const pe  = Number(s.pe_ratio || 0);
    const div = Number(s.dividend_yield || 0);
    const roe = Number(s.roe || 0);

    // Max P/E threshold
    if (maxPE && Number(maxPE) > 0) {
      if (pe <= 0 || pe > Number(maxPE)) return false;
    }

    // Min Dividend Yield threshold
    if (minDivYield && Number(minDivYield) > 0) {
      if (div < Number(minDivYield)) return false;
    }

    // Min ROE threshold
    if (minROE && Number(minROE) > 0) {
      if (roe < Number(minROE)) return false;
    }

    return true;
  });
}

// ─── Budget Metadata Calculator ───────────────────────────────────────────
export function calcBuyQty(price, budget) {
  if (!price || !budget || Number(price) <= 0 || Number(budget) <= 0) return 0;
  return Math.floor(Number(budget) / Number(price));
}

// ─── Extract Unique Sectors ───────────────────────────────────────────────
export function extractSectors(stocks) {
  const seen = new Set();
  const sectors = [];
  stocks.forEach(s => {
    const sec = (s.sector || '').trim();
    if (sec && !seen.has(sec)) {
      seen.add(sec);
      sectors.push(sec);
    }
  });
  return sectors.sort();
}

// ─── Main Filter Pipeline ─────────────────────────────────────────────────
export function applyFilters(stocks, filters) {
  const { horizon, budget, sector, strategy } = filters;

  let result = [...stocks];
  result = applyTimeHorizonFilter(result, horizon);
  result = applyBudgetFilter(result, budget);
  result = applySectorFilter(result, sector);
  result = applyRiskStrategyFilter(result, strategy);
  result = applyGranularFilters(result, filters);

  return result;
}

// Default filter state
export const DEFAULT_FILTERS = {
  horizon:     'all',
  budget:      '',
  sector:      'all',
  strategy:    'all',
  maxPE:       '',
  minDivYield: '',
  minROE:      ''
};

// Human-readable horizon labels
export const HORIZON_OPTIONS = [
  { value: 'all', label: 'All Horizons' },
  { value: '15d', label: '15 Days (High Swing)' },
  { value: '1m',  label: '1 Month (Tactical)' },
  { value: '45d', label: '45 Days (Growth Trend)' },
  { value: '2m',  label: '2 Months (Value Compound)' }
];

export const BUDGET_PRESETS = [
  { label: '25k',  value: 25000 },
  { label: '50k',  value: 50000 },
  { label: '100k', value: 100000 },
  { label: '500k', value: 500000 }
];

export const STRATEGY_OPTIONS = [
  { value: 'all',      label: 'All Strategies' },
  { value: 'green',    label: '🟢 Green Flags Only' },
  { value: 'momentum', label: '⚡ High Volume Momentum' },
  { value: 'dividend', label: '🛡️ Defensive Dividends' }
];

export const PE_OPTIONS = [
  { value: '',   label: 'Any P/E' },
  { value: '6',  label: 'P/E < 6.0x (Value Deep)' },
  { value: '10', label: 'P/E < 10.0x (Moderate)' },
  { value: '15', label: 'P/E < 15.0x (Growth)' }
];

export const DIV_OPTIONS = [
  { value: '',   label: 'Any Dividend' },
  { value: '5',  label: 'Yield > 5%' },
  { value: '8',  label: 'Yield > 8% (High Cash)' },
  { value: '12', label: 'Yield > 12% (Fortress)' }
];

export const ROE_OPTIONS = [
  { value: '',   label: 'Any ROE' },
  { value: '15', label: 'ROE > 15%' },
  { value: '20', label: 'ROE > 20% (Quality)' },
  { value: '30', label: 'ROE > 30% (Exceptional)' }
];
