import { useEffect, useState } from 'react';
import { Activity, Radio } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

function formatNumber(value, maximumFractionDigits = 2) {
  const number = Number(value);
  return Number.isFinite(number)
    ? number.toLocaleString('en-PK', { maximumFractionDigits })
    : '--';
}

export function StockDashboard() {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      setError('Supabase is not configured');
      return undefined;
    }

    let active = true;

    const loadStocks = async () => {
      const { data, error: queryError } = await supabase
        .from('stocks')
        .select('symbol,name,sector,price,change,change_percent,volume,updated_at')
        .order('symbol', { ascending: true });

      if (!active) return;
      if (queryError) {
        setError('Live stock data is unavailable');
      } else {
        setStocks(data || []);
        setError('');
      }
      setLoading(false);
    };

    loadStocks();

    const channel = supabase
      .channel('stocks-dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stocks' }, payload => {
        if (!active) return;

        if (payload.eventType === 'DELETE') {
          setStocks(current => current.filter(stock => stock.symbol !== payload.old?.symbol));
          return;
        }

        const updated = payload.new;
        if (!updated?.symbol) return;
        setStocks(current => {
          const exists = current.some(stock => stock.symbol === updated.symbol);
          const next = exists
            ? current.map(stock => stock.symbol === updated.symbol ? { ...stock, ...updated } : stock)
            : [...current, updated];
          return next.sort((left, right) => left.symbol.localeCompare(right.symbol));
        });
      })
      .subscribe(status => setConnected(status === 'SUBSCRIBED'));

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <section style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', marginBottom: '20px', overflow: 'hidden' }} aria-labelledby="live-stock-heading">
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '14px 18px', borderBottom: '1px solid #1e293b' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
          <Activity size={16} color="#10b981" aria-hidden="true" />
          <h2 id="live-stock-heading" style={{ margin: 0, fontSize: '14px', color: '#f1f5f9' }}>Live PSX Cache</h2>
        </div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: connected ? '#34d399' : '#94a3b8', fontSize: '11px', fontWeight: 700 }} aria-live="polite">
          <Radio size={13} aria-hidden="true" /> {connected ? 'Realtime connected' : 'Connecting'}
        </span>
      </header>

      {loading ? (
        <p style={{ margin: 0, padding: '20px 18px', color: '#94a3b8', fontSize: '13px' }}>Loading cached prices...</p>
      ) : error ? (
        <p role="status" style={{ margin: 0, padding: '20px 18px', color: '#fbbf24', fontSize: '13px' }}>{error}</p>
      ) : stocks.length === 0 ? (
        <p style={{ margin: 0, padding: '20px 18px', color: '#94a3b8', fontSize: '13px' }}>No cached prices yet. The background updater will populate the cache.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
            <thead>
              <tr style={{ color: '#64748b', borderBottom: '1px solid #1e293b' }}>
                {['Symbol', 'Company', 'Price (PKR)', 'Change', 'Volume', 'Updated'].map(label => (
                  <th key={label} scope="col" style={{ padding: '10px 14px', fontWeight: 700, whiteSpace: 'nowrap' }}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stocks.map(stock => {
                const change = Number(stock.change);
                const positive = Number.isFinite(change) && change >= 0;
                return (
                  <tr key={stock.symbol} style={{ borderBottom: '1px solid #172033', color: '#cbd5e1' }}>
                    <th scope="row" style={{ padding: '10px 14px', color: '#34d399', fontWeight: 800 }}>{stock.symbol}</th>
                    <td style={{ padding: '10px 14px', minWidth: '150px' }}>{stock.name || stock.symbol}</td>
                    <td style={{ padding: '10px 14px', fontVariantNumeric: 'tabular-nums', color: '#f8fafc' }}>{formatNumber(stock.price)}</td>
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', color: positive ? '#34d399' : '#fb7185' }}>
                      {positive ? '+' : ''}{formatNumber(stock.change)} ({formatNumber(stock.change_percent)}%)
                    </td>
                    <td style={{ padding: '10px 14px', fontVariantNumeric: 'tabular-nums' }}>{formatNumber(stock.volume, 0)}</td>
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', color: '#94a3b8' }}>
                      {stock.updated_at ? new Date(stock.updated_at).toLocaleTimeString() : '--'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
