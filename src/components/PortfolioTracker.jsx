import React, { useState } from 'react';
import { PieChart, Plus, Trash2, TrendingUp, DollarSign, Briefcase } from 'lucide-react';

export function PortfolioTracker({ holdings, onAddHolding, onRemoveHolding, availableStocks }) {
  const [ticker, setTicker] = useState('LUCK');
  const [shares, setShares] = useState('');
  const [buyPrice, setBuyPrice] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!shares || !buyPrice) return;
    const stock = availableStocks.find(s => s.ticker === ticker) || availableStocks[0];
    onAddHolding({
      id: Date.now().toString(),
      ticker: stock.ticker,
      name: stock.name,
      shares: parseFloat(shares),
      buyPrice: parseFloat(buyPrice),
      currentPrice: stock.price
    });
    setShares('');
    setBuyPrice('');
  };

  const totalInvestment = holdings.reduce((acc, h) => acc + (h.shares * h.buyPrice), 0);
  const currentValue = holdings.reduce((acc, h) => acc + (h.shares * h.currentPrice), 0);
  const totalReturn = currentValue - totalInvestment;
  const returnPercent = totalInvestment > 0 ? ((totalReturn / totalInvestment) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1280px', margin: '0 auto' }}>
      
      {/* 3-Column Grid Portfolio Summary Container */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', background: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
        
        {/* Portfolio Valuation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', background: '#0f172a', padding: '16px', borderRadius: '10px', border: '1px solid #334155' }}>
          <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)', color: '#818cf8' }}>
            <Briefcase style={{ width: '24px', height: '24px' }} />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, display: 'block' }}>Portfolio Valuation</span>
            <div style={{ fontSize: '20px', fontWeight: 900, color: '#ffffff', marginTop: '2px' }}>
              PKR {currentValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* Total Invested */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', background: '#0f172a', padding: '16px', borderRadius: '10px', border: '1px solid #334155' }}>
          <div style={{ padding: '12px', borderRadius: '10px', background: '#1e293b', border: '1px solid #334155', color: '#06b6d4' }}>
            <DollarSign style={{ width: '24px', height: '24px' }} />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, display: 'block' }}>Total Invested</span>
            <div style={{ fontSize: '20px', fontWeight: 900, color: '#cbd5e1', marginTop: '2px' }}>
              PKR {totalInvestment.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* Total Return */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', background: '#0f172a', padding: '16px', borderRadius: '10px', border: '1px solid #334155' }}>
          <div style={{ padding: '12px', borderRadius: '10px', background: returnPercent >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)', border: returnPercent >= 0 ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(244, 63, 94, 0.2)', color: returnPercent >= 0 ? '#10b981' : '#f43f5e' }}>
            <TrendingUp style={{ width: '24px', height: '24px' }} />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, display: 'block' }}>Total Return</span>
            <div style={{ fontSize: '20px', fontWeight: 900, color: returnPercent >= 0 ? '#10b981' : '#f43f5e', marginTop: '2px' }}>
              {returnPercent >= 0 ? '+' : ''}{totalReturn.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              <span style={{ fontSize: '13px', fontWeight: 700, marginLeft: '6px' }}>({returnPercent.toFixed(2)}%)</span>
            </div>
          </div>
        </div>

      </div>

      {/* Add New PSX Holding Form */}
      <div style={{ background: '#0f172a', padding: '24px', borderRadius: '16px', border: '1px solid #1e293b' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus style={{ width: '18px', height: '18px', color: '#10b981' }} />
          Add PSX Holding
        </h3>

        {/* Inline Flex Form Row */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>Stock Ticker</label>
            <select
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
              style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#ffffff', outline: 'none' }}
            >
              {availableStocks.map(s => (
                <option key={s.ticker} value={s.ticker}>{s.ticker} - {s.name}</option>
              ))}
            </select>
          </div>

          <div style={{ flex: '1 1 140px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>Shares</label>
            <input
              type="number"
              placeholder="e.g. 500"
              value={shares}
              onChange={(e) => setShares(e.target.value)}
              style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#ffffff', outline: 'none', boxSizing: 'border-box' }}
              required
            />
          </div>

          <div style={{ flex: '1 1 140px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>Buy Price (PKR)</label>
            <input
              type="number"
              step="0.01"
              placeholder="e.g. 620.00"
              value={buyPrice}
              onChange={(e) => setBuyPrice(e.target.value)}
              style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#ffffff', outline: 'none', boxSizing: 'border-box' }}
              required
            />
          </div>

          <button
            type="submit"
            style={{ background: '#10b981', color: '#030712', fontWeight: 800, padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', height: '40px' }}
          >
            <Plus style={{ width: '16px', height: '16px' }} />
            Add Position
          </button>
        </form>
      </div>

      {/* Current Holdings Table Card */}
      <div style={{ background: '#0f172a', borderRadius: '16px', border: '1px solid #1e293b', overflow: 'hidden' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #1e293b' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PieChart style={{ width: '18px', height: '18px', color: '#818cf8' }} />
            Your Holdings ({holdings.length})
          </h3>
        </div>

        {holdings.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
            No holdings added yet. Use the form above to add your PSX stock positions.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1e293b', color: '#94a3b8', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', background: '#090d16' }}>
                  <th style={{ padding: '14px 20px' }}>Stock</th>
                  <th style={{ padding: '14px 20px' }}>Shares</th>
                  <th style={{ padding: '14px 20px' }}>Avg Cost</th>
                  <th style={{ padding: '14px 20px' }}>Current Price</th>
                  <th style={{ padding: '14px 20px' }}>Total Value</th>
                  <th style={{ padding: '14px 20px' }}>Profit / Loss</th>
                  <th style={{ padding: '14px 20px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: '13px' }}>
                {holdings.map((h) => {
                  const val = h.shares * h.currentPrice;
                  const cost = h.shares * h.buyPrice;
                  const gain = val - cost;
                  const gainPct = cost > 0 ? (gain / cost) * 100 : 0;

                  return (
                    <tr key={h.id} style={{ borderBottom: '1px solid #1e293b' }}>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ fontWeight: 800, color: '#ffffff' }}>{h.ticker}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>{h.name}</div>
                      </td>
                      <td style={{ padding: '16px 20px', color: '#cbd5e1', fontWeight: 700 }}>{h.shares.toLocaleString()}</td>
                      <td style={{ padding: '16px 20px', color: '#cbd5e1' }}>PKR {h.buyPrice.toFixed(2)}</td>
                      <td style={{ padding: '16px 20px', color: '#cbd5e1', fontWeight: 700 }}>PKR {h.currentPrice.toFixed(2)}</td>
                      <td style={{ padding: '16px 20px', fontWeight: 800, color: '#ffffff' }}>PKR {val.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{ fontWeight: 800, color: gain >= 0 ? '#10b981' : '#f43f5e' }}>
                          {gain >= 0 ? '+' : ''}{gain.toFixed(2)} ({gainPct.toFixed(2)}%)
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        <button
                          onClick={() => onRemoveHolding(h.id)}
                          style={{ padding: '6px', borderRadius: '8px', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                          title="Remove holding"
                        >
                          <Trash2 style={{ width: '16px', height: '16px' }} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
