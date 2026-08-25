import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { MOCK_COMPANIES } from './mockData';
import { computeStockIQScore } from './calculations';
import { evaluateStockAlgorithm } from './scoringAlgorithm';

export async function fetchTopScoringStocks() {
  if (!isSupabaseConfigured) {
    return MOCK_COMPANIES.map(s => {
      const algo = evaluateStockAlgorithm(s);
      return { ...s, algorithmicAssessment: algo };
    });
  }

  try {
    // 1. Fetch all companies
    const { data: companies, error: compErr } = await supabase
      .from('companies')
      .select('*')
      .order('ticker', { ascending: true });

    if (compErr || !companies || companies.length === 0) {
      return MOCK_COMPANIES.map(s => {
        const algo = evaluateStockAlgorithm(s);
        return { ...s, algorithmicAssessment: algo };
      });
    }

    // 2. Fetch all live prices with 12 attributes
    const { data: prices } = await supabase
      .from('live_prices')
      .select('*');

    const priceMap = {};
    if (prices) {
      prices.forEach(p => {
        priceMap[p.ticker] = p;
      });
    }

    // Merge company records with complete 12-attribute live prices
    const merged = companies.map((c, idx) => {
      const live = priceMap[c.ticker] || {};
      const fallback = MOCK_COMPANIES[idx % MOCK_COMPANIES.length];

      const price = live.price !== undefined && live.price !== null ? Number(live.price) : fallback.price;
      const previous_close = live.previous_close !== undefined && live.previous_close !== null ? Number(live.previous_close) : (fallback.price - fallback.change);
      const open_price = live.open_price !== undefined && live.open_price !== null ? Number(live.open_price) : previous_close;
      const change = live.change !== undefined && live.change !== null ? Number(live.change) : fallback.change;
      const changePercent = live.change_percent !== undefined && live.change_percent !== null ? Number(live.change_percent) : fallback.changePercent;
      
      const volume = live.volume !== undefined && live.volume !== null ? Number(live.volume) : (typeof fallback.volume === 'string' ? Number(fallback.volume.replace(/,/g, '')) : fallback.volume);
      const day_high = live.day_high !== undefined && live.day_high !== null ? Number(live.day_high) : Math.max(price, open_price, price * 1.01);
      const day_low = live.day_low !== undefined && live.day_low !== null ? Number(live.day_low) : Math.min(price, open_price, price * 0.99);
      const fifty_two_week_high = live.fifty_two_week_high !== undefined && live.fifty_two_week_high !== null ? Number(live.fifty_two_week_high) : price * 1.25;
      const fifty_two_week_low = live.fifty_two_week_low !== undefined && live.fifty_two_week_low !== null ? Number(live.fifty_two_week_low) : price * 0.75;

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
        previous_close,
        open_price,
        change,
        changePercent,
        volume,
        day_high,
        day_low,
        fifty_two_week_high,
        fifty_two_week_low,
        pe_ratio,
        pb_ratio,
        roe,
        dividend_yield,
        description: c.description || `${c.name} is a leading listed public company on the Pakistan Stock Exchange (${c.sector || 'General'}).`,
        financials: fallback.financials,
        priceHistory: fallback.priceHistory
      };

      // Run calculations & deterministic scoring algorithm
      stockObj.scores = computeStockIQScore(stockObj);
      stockObj.algorithmicAssessment = evaluateStockAlgorithm(stockObj);

      return stockObj;
    });

    // Sort by algorithmic composite score descending
    merged.sort((a, b) => (b.algorithmicAssessment?.compositeScore || 0) - (a.algorithmicAssessment?.compositeScore || 0));

    return merged;
  } catch (err) {
    console.warn('Error fetching Supabase stocks, falling back:', err);
    return MOCK_COMPANIES.map(s => {
      const algo = evaluateStockAlgorithm(s);
      return { ...s, algorithmicAssessment: algo };
    });
  }
}

export async function fetchStockDetails(ticker) {
  const stocks = await fetchTopScoringStocks();
  return stocks.find(s => s.ticker === ticker) || stocks[0];
}

export async function fetchUserWatchlist(userId) {
  if (!isSupabaseConfigured || !userId) {
    const all = await fetchTopScoringStocks();
    return [all[0], all[1]];
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

  const fallbackAll = await fetchTopScoringStocks();
  return [fallbackAll[0], fallbackAll[1]];
}

export async function fetchUserPortfolio(userId) {
  const allStocks = await fetchTopScoringStocks();
  const fallbackHoldings = [
    {
      id: '1',
      ticker: allStocks[0]?.ticker || 'LUCK',
      name: allStocks[0]?.name || 'Lucky Cement Limited',
      shares: 300,
      buyPrice: (allStocks[0]?.price || 440) * 0.95,
      currentPrice: allStocks[0]?.price || 442.69
    },
    {
      id: '2',
      ticker: allStocks[1]?.ticker || 'ENGRO',
      name: allStocks[1]?.name || 'Engro Corporation Limited',
      shares: 150,
      buyPrice: (allStocks[1]?.price || 480) * 0.95,
      currentPrice: allStocks[1]?.price || 485.38
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
