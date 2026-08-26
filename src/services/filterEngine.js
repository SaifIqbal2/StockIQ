/**
 * StockIQ Filter Engine
 * Applies time-horizon, budget, sector, and risk-strategy filters
 * to the full PSX stock universe. Returns filtered results + metadata.
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
        // High swing: active volume + positive momentum
        return vol >= 1_000_000 && chgPct >= 1.5;

      case '1m':
        // Tactical: reasonable valuation, any positive volume
        return pe < 8 && vol > 200_000;

      case '45d':
        // Growth trend: value P/E + decent volume
        return pe < 8 && vol > 100_000;

      case '2m':
        // Value compound: high ROE or solid dividend
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

  // Standard PSX lot = 500 shares; filter to stocks affordable in at least 100 shares
  return stocks.filter(s => {
    const price = Number(s.price || 0);
    if (price <= 0) return false;
    // Affordable if user can buy at least 100 shares
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
        // High volume (>2M) + positive price change
        return vol >= 2_000_000 && Number(s.changePercent || 0) > 0;

      case 'dividend':
        // Defensive: good dividend + lower risk (not speculative)
        return divYield >= 6 && flagTier !== 'SPECULATIVE';

      default:
        return true;
    }
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

  return result;
}

// Default filter state
export const DEFAULT_FILTERS = {
  horizon:  'all',
  budget:   '',
  sector:   'all',
  strategy: 'all'
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
