import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { MOCK_COMPANIES } from './mockData';
import { computeStockIQScore } from './calculations';

export async function fetchTopScoringStocks() {
  if (!isSupabaseConfigured) {
    return MOCK_COMPANIES;
  }

  try {
    // 1. Fetch companies
    const { data: companies, error: compErr } = await supabase
      .from('companies')
      .select('*');

    if (compErr || !companies || companies.length === 0) {
      return MOCK_COMPANIES;
    }

    // 2. Fetch live prices
    const { data: prices } = await supabase
      .from('live_prices')
      .select('*');

    const priceMap = {};
    if (prices) {
      prices.forEach(p => {
        priceMap[p.ticker] = p;
      });
    }

    // Merge company and live price records
    const merged = companies.map((c, idx) => {
      const live = priceMap[c.ticker] || {};
      const fallback = MOCK_COMPANIES[idx % MOCK_COMPANIES.length];

      const price = live.price !== undefined && live.price !== null ? Number(live.price) : fallback.price;
      const change = live.change !== undefined && live.change !== null ? Number(live.change) : fallback.change;
      const changePercent = live.change_percent !== undefined && live.change_percent !== null ? Number(live.change_percent) : fallback.changePercent;
      const pe_ratio = live.pe_ratio ? Number(live.pe_ratio) : fallback.pe_ratio;
      const pb_ratio = live.pb_ratio ? Number(live.pb_ratio) : fallback.pb_ratio;
      const roe = live.roe ? Number(live.roe) : fallback.roe;
      const dividend_yield = live.dividend_yield ? Number(live.dividend_yield) : fallback.dividend_yield;

      const stockObj = {
        id: c.id,
        ticker: c.ticker,
        name: c.name,
        sector: c.sector || 'General',
        market_cap: c.market_cap || fallback.market_cap,
        price,
        change,
        changePercent,
        pe_ratio,
        pb_ratio,
        roe,
        dividend_yield,
        description: c.description || `${c.name} is a leading listed company on the Pakistan Stock Exchange (${c.sector || 'General'}).`,
        financials: fallback.financials,
        priceHistory: fallback.priceHistory
      };

      const calculatedScores = computeStockIQScore(stockObj);
      stockObj.scores = calculatedScores;

      return stockObj;
    });

    // Sort by StockIQ overall rating descending
    merged.sort((a, b) => (b.scores?.overall || 0) - (a.scores?.overall || 0));

    return merged;
  } catch (err) {
    console.warn('Error fetching Supabase stocks, falling back:', err);
    return MOCK_COMPANIES;
  }
}

export async function fetchStockDetails(ticker) {
  const stocks = await fetchTopScoringStocks();
  return stocks.find(s => s.ticker === ticker) || stocks[0];
}

export async function fetchUserWatchlist(userId) {
  if (!isSupabaseConfigured || !userId) {
    return [MOCK_COMPANIES[0], MOCK_COMPANIES[1]];
  }

  try {
    const { data: watchlists } = await supabase
      .from('watchlists')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (watchlists && watchlists.length > 0) {
      const { data: items } = await supabase
        .from('watchlist_items')
        .select('ticker')
        .eq('watchlist_id', watchlists[0].id);

      if (items && items.length > 0) {
        const tickers = items.map(i => i.ticker);
        const allStocks = await fetchTopScoringStocks();
        return allStocks.filter(s => tickers.includes(s.ticker));
      }
    }
  } catch (e) {
    console.warn('Watchlist fetch fallback:', e);
  }

  return [MOCK_COMPANIES[0], MOCK_COMPANIES[1]];
}

export async function fetchUserPortfolio(userId) {
  const fallbackHoldings = [
    {
      id: '1',
      ticker: 'LUCK',
      name: 'Lucky Cement Limited',
      shares: 300,
      buyPrice: 610.00,
      currentPrice: 907.65
    },
    {
      id: '2',
      ticker: 'ENGRO',
      name: 'Engro Corporation Limited',
      shares: 150,
      buyPrice: 450.00,
      currentPrice: 485.38
    }
  ];

  if (!isSupabaseConfigured || !userId) {
    return fallbackHoldings;
  }

  try {
    const { data: portfolios } = await supabase
      .from('portfolios')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (portfolios && portfolios.length > 0) {
      const { data: holdings } = await supabase
        .from('holdings')
        .select('*')
        .eq('portfolio_id', portfolios[0].id);

      if (holdings && holdings.length > 0) {
        const allStocks = await fetchTopScoringStocks();
        const priceMap = {};
        allStocks.forEach(s => { priceMap[s.ticker] = s; });

        return holdings.map(h => ({
          id: h.id,
          ticker: h.ticker,
          name: priceMap[h.ticker]?.name || h.ticker,
          shares: Number(h.shares),
          buyPrice: Number(h.average_buy_price),
          currentPrice: priceMap[h.ticker]?.price || Number(h.average_buy_price)
        }));
      }
    }
  } catch (e) {
    console.warn('Portfolio fetch fallback:', e);
  }

  return fallbackHoldings;
}

export function subscribeToLivePrices(onPriceUpdate) {
  if (!isSupabaseConfigured) return () => {};

  const subscription = supabase
    .channel('live_prices_realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'live_prices' },
      payload => {
        if (onPriceUpdate) onPriceUpdate(payload.new);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
}
