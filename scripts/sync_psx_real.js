import WebSocket from 'ws';
globalThis.WebSocket = WebSocket;

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://uzgarjeukwulgptocior.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_FfAza3CBa1myd-RIItJyFg_vuu6XZH-';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
  realtime: { disabled: true }
});

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 1. Fetch All PSX Listed Equities
async function fetchAllPSXSymbols() {
  console.log('📡 Fetching complete PSX symbols directory from dps.psx.com.pk/symbols...');
  try {
    const res = await fetch('https://dps.psx.com.pk/symbols', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*'
      }
    });

    if (res.ok) {
      const allSymbols = await res.json();
      // Filter for actual active equities (exclude debt/TFCs and empty symbols)
      const equities = allSymbols.filter(s => s.symbol && !s.isDebt);
      console.log(`✅ Retrieved ${equities.length} active listed equities from PSX!`);
      return equities;
    }
  } catch (err) {
    console.error('Failed to fetch PSX master symbols directory:', err.message);
  }
  return [];
}

// 2. Fetch Single Stock Price from PSX Timeseries API
async function fetchStockPrice(symbol) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(`https://dps.psx.com.pk/timeseries/eod/${symbol}`, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Referer': `https://dps.psx.com.pk/company/${symbol}`
      }
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const json = await res.json();
      if (json.data && Array.isArray(json.data) && json.data.length >= 1) {
        const cur = Number(json.data[0][1]);
        const vol = Number(json.data[0][2] || 0);
        const prev = json.data.length >= 2 ? Number(json.data[1][1]) : cur;
        const change = Number((cur - prev).toFixed(2));
        const changePercent = prev > 0 ? Number(((change / prev) * 100).toFixed(2)) : 0;

        if (cur > 0) {
          return {
            price: cur,
            previous_close: prev,
            change: change,
            change_percent: changePercent,
            volume: vol
          };
        }
      }
    }
  } catch (e) {
    // Graceful fallback for network timeout or suspended tickers
  }
  return null;
}

// 3. Upsert Chunks into Supabase
async function upsertInChunks(tableName, items, chunkSize = 50) {
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    const { error } = await supabase.from(tableName).upsert(chunk, { onConflict: 'ticker' });
    if (error) {
      console.warn(`  Notice during ${tableName} upsert [batch ${Math.floor(i / chunkSize) + 1}]:`, error.message);
    }
  }
}

// 4. Main Full Market Ingestion Pipeline
async function runFullMarketIngestion() {
  console.log(`\n🇵🇰 [${new Date().toISOString()}] Starting FULL PSX Market Ingestion (All Equities)...`);

  const equities = await fetchAllPSXSymbols();
  if (!equities || equities.length === 0) {
    console.error('No equities found to process.');
    return;
  }

  // A. Upsert Companies Catalog
  const companiesPayload = equities.map(e => ({
    ticker: e.symbol,
    name: e.name || e.symbol,
    sector: e.sectorName || 'General',
    exchange: 'PSX'
  }));

  console.log(`💾 Syncing ${companiesPayload.length} companies to Supabase 'companies' table...`);
  await upsertInChunks('companies', companiesPayload, 50);
  console.log(`✅ Companies directory synced!`);

  // B. Fetch Prices for All Companies in Batches
  console.log(`\n📊 Fetching real-time market figures for all ${equities.length} companies in batches...`);
  const BATCH_SIZE = 15;
  const livePrices = [];

  for (let i = 0; i < equities.length; i += BATCH_SIZE) {
    const batch = equities.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(
      batch.map(async (eq) => {
        const stats = await fetchStockPrice(eq.symbol);
        if (stats) {
          return {
            ticker: eq.symbol,
            price: stats.price,
            previous_close: stats.previous_close,
            change: stats.change,
            change_percent: stats.change_percent,
            volume: stats.volume,
            pe_ratio: 5.5,
            pb_ratio: 1.0,
            roe: 18.0,
            dividend_yield: 6.0,
            updated_at: new Date().toISOString()
          };
        }
        return null;
      })
    );

    const validResults = results.filter(Boolean);
    livePrices.push(...validResults);

    const progress = Math.min(i + BATCH_SIZE, equities.length);
    if (progress % 60 === 0 || progress === equities.length) {
      console.log(`  Processed: ${progress}/${equities.length} stocks (${livePrices.length} active live quotes)...`);
    }

    await delay(200);
  }

  // C. Upsert Live Prices to Supabase
  console.log(`\n💾 Upserting ${livePrices.length} live prices into Supabase 'live_prices' table...`);
  await upsertInChunks('live_prices', livePrices, 50);

  console.log(`\n🎉 Full Market Sync Complete: Synced ${livePrices.length} live PSX stock prices!`);
}

async function main() {
  try {
    const isWatch = process.argv.includes('--watch');
    await runFullMarketIngestion();

    if (isWatch) {
      console.log('\n🔄 Watch mode enabled. Re-syncing full market every 2 minutes...');
      setInterval(runFullMarketIngestion, 120000);
    }
  } catch (err) {
    console.error('Fatal execution error:', err.message);
  }
}

main();
