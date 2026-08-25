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
    const { data: prices, error: priceErr } = await supabase
      .from('live_prices')
      .select('*');

    const priceMap = {};
    if (prices) {
      prices.forEach(p => {
        priceMap[p.ticker] = p;
      });
    }

    // Merge company and price records
    const merged = companies.map((c, idx) => {
      const live = priceMap[c.ticker] || {};
      const mockFallback = MOCK_COMPANIES[idx % MOCK_COMPANIES.length];

      const price = live.price ? Number(live.price) : mockFallback.price;
      const change = live.change ? Number(live.change) : mockFallback.change;
      const changePercent = live.change_percent ? Number(live.change_percent) : mockFallback.changePercent;
      const pe_ratio = live.pe_ratio ? Number(live.pe_ratio) : mockFallback.pe_ratio;
      const pb_ratio = live.pb_ratio ? Number(live.pb_ratio) : mockFallback.pb_ratio;
      const roe = live.roe ? Number(live.roe) : mockFallback.roe;
      const dividend_yield = live.dividend_yield ? Number(live.dividend_yield) : mockFallback.dividend_yield;

      const stockObj = {
        id: c.id,
        ticker: c.ticker,
        name: c.name,
        sector: c.sector || 'General',
        market_cap: c.market_cap || mockFallback.market_cap,
        price,
        change,
        changePercent,
        pe_ratio,
        pb_ratio,
        roe,
        dividend_yield,
        description: c.description || mockFallback.description,
        financials: mockFallback.financials,
        priceHistory: mockFallback.priceHistory
      };

      const calculatedScores = computeStockIQScore(stockObj);
      stockObj.scores = calculatedScores;

      return stockObj;
    });

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
      currentPrice: 685.50
    },
    {
      id: '2',
      ticker: 'SYS',
      name: 'Systems Limited',
      shares: 150,
      buyPrice: 360.00,
      currentPrice: 415.00
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
