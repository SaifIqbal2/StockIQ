import { createClient } from '@supabase/supabase-js';

const FRESH_FOR_MS = 20_000;
const MAX_SYMBOLS_PER_REQUEST = 8;
const PSX_TIMEOUT_MS = 5_000;
const PSX_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

let supabaseAdmin;

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error('Server Supabase environment variables are not configured.');
  }

  if (!supabaseAdmin) {
    supabaseAdmin = createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
  }

  return supabaseAdmin;
}

function parsePositivePrice(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

async function fetchStock(company) {
  const symbol = String(company.ticker || '').trim().toUpperCase();
  if (!/^[A-Z0-9.-]{1,20}$/.test(symbol)) return null;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PSX_TIMEOUT_MS);

  try {
    const response = await fetch(
      `https://dps.psx.com.pk/timeseries/eod/${encodeURIComponent(symbol)}`,
      {
        signal: controller.signal,
        headers: {
          'User-Agent': PSX_USER_AGENT,
          Accept: 'application/json, text/plain, */*',
          Referer: `https://dps.psx.com.pk/company/${encodeURIComponent(symbol)}`
        }
      }
    );

    if (!response.ok) return null;

    const payload = await response.json();
    const candles = payload?.data;
    if (!Array.isArray(candles) || candles.length === 0) return null;

    const current = candles[0];
    const previous = candles[1] || current;
    const price = parsePositivePrice(current?.[1]);
    const volume = Number(current?.[2]);
    const previousClose = parsePositivePrice(previous?.[1]) || price;
    const change = price === null ? null : Number((price - previousClose).toFixed(4));

    if (
      !symbol ||
      price === null ||
      !Number.isSafeInteger(volume) ||
      volume < 0 ||
      change === null ||
      !Number.isFinite(change)
    ) {
      return null;
    }

    return {
      symbol,
      name: company.name || symbol,
      sector: company.sector || null,
      price,
      volume,
      change,
      previous_close: previousClose,
      change_percent: previousClose > 0
        ? Number(((change / previousClose) * 100).toFixed(4))
        : 0,
      updated_at: new Date().toISOString()
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ success: false, message: 'Method not allowed' });
  }

  let supabase;
  try {
    supabase = getSupabaseAdmin();
  } catch (error) {
    console.error('PSX scraper configuration error:', error.message);
    return response.status(503).json({ success: false, message: 'Scraper is not configured' });
  }

  let lockClaimed = false;
  try {
    // This RPC atomically checks the newest stocks.updated_at and claims a short lease.
    const { data: claimed, error: claimError } = await supabase.rpc('claim_psx_scrape');
    if (claimError) {
      console.error('PSX scrape claim failed:', claimError.message);
      return response.status(503).json({ success: false, message: 'Scrape limiter is unavailable' });
    }
    if (!claimed) {
      return response.status(200).json({ success: true, message: 'Data is already fresh or an update is in progress' });
    }
    lockClaimed = true;

    const [{ data: companies, error: companiesError }, { data: cachedRows, error: cacheError }] = await Promise.all([
      supabase
        .from('companies')
        .select('ticker,name,sector,status')
        .order('ticker', { ascending: true })
        .limit(1000),
      supabase
        .from('stocks')
        .select('symbol,price,updated_at')
        .order('updated_at', { ascending: true })
        .limit(1000)
    ]);

    if (companiesError || cacheError) {
      console.error('PSX scrape input query failed:', companiesError?.message || cacheError?.message);
      return response.status(502).json({ success: false, message: 'Could not load the stock cache' });
    }

    const cacheBySymbol = new Map((cachedRows || []).map(row => [row.symbol, row]));
    const candidates = (companies || [])
      .filter(company => !company.status || company.status === 'ACTIVE')
      .map(company => ({ ...company, ticker: String(company.ticker || '').toUpperCase() }))
      .filter(company => /^[A-Z0-9.-]{1,20}$/.test(company.ticker))
      .sort((left, right) => {
        const leftTime = Date.parse(cacheBySymbol.get(left.ticker)?.updated_at || '') || 0;
        const rightTime = Date.parse(cacheBySymbol.get(right.ticker)?.updated_at || '') || 0;
        return leftTime - rightTime || left.ticker.localeCompare(right.ticker);
      })
      .slice(0, MAX_SYMBOLS_PER_REQUEST);

    const results = await Promise.all(candidates.map(fetchStock));
    const rejected = [];
    const accepted = [];

    for (const stock of results.filter(Boolean)) {
      const oldPrice = parsePositivePrice(cacheBySymbol.get(stock.symbol)?.price);
      if (oldPrice !== null && Math.abs(stock.price - oldPrice) / oldPrice > 0.1) {
        rejected.push(stock.symbol);
        continue;
      }
      accepted.push(stock);
    }

    if (accepted.length > 0) {
      const { error: upsertError } = await supabase
        .from('stocks')
        .upsert(accepted, { onConflict: 'symbol' });

      if (upsertError) {
        console.error('PSX stock upsert failed:', upsertError.message);
        return response.status(502).json({ success: false, message: 'Could not update stock cache' });
      }
    }

    return response.status(200).json({
      success: true,
      updated: accepted.length,
      rejectedSpikes: rejected,
      message: accepted.length ? 'Stock cache updated' : 'No valid stock updates were available'
    });
  } catch (error) {
    console.error('PSX scraper failed:', error);
    return response.status(500).json({ success: false, message: 'PSX update failed' });
  } finally {
    if (lockClaimed) {
      const { error } = await supabase.rpc('release_psx_scrape');
      if (error) console.error('PSX scrape lease release failed:', error.message);
    }
  }
}
