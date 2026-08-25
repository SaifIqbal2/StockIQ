import React from 'react';
import { Bookmark, Trash2, ArrowUpRight, Award } from 'lucide-react';
import { computeStockIQScore, getStrategyVerdict } from '../services/calculations';

export function WatchlistManager({ watchlist, onRemoveFromWatchlist, onSelectStock }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1280px', margin: '0 auto' }}>
      
      {/* Header Container */}
      <div style={{ background: '#0f172a', padding: '24px', borderRadius: '16px', border: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Bookmark style={{ width: '24px', height: '24px', color: '#fbbf24' }} />
            Your Stock Watchlist
          </h2>
          <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px', marginBottom: 0 }}>Keep track of key PSX stocks and Strategy Fit evaluations</p>
        </div>
        <span style={{ padding: '6px 14px', borderRadius: '9999px', fontSize: '12px', fontWeight: 700, background: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24', border: '1px solid rgba(251, 191, 36, 0.2)' }}>
          {watchlist.length} Saved Stocks
        </span>
      </div>

      {watchlist.length === 0 ? (
        <div style={{ background: '#0f172a', padding: '48px', borderRadius: '16px', border: '1px solid #1e293b', textAlign: 'center', color: '#94a3b8' }}>
          <Bookmark style={{ width: '40px', height: '40px', color: '#475569', margin: '0 auto 12px auto' }} />
          <p style={{ fontWeight: 700, color: '#cbd5e1', fontSize: '15px' }}>Your watchlist is currently empty.</p>
          <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Click the bookmark icon on any stock card in the Stocks tab to save it here.</p>
        </div>
      ) : (
        /* Responsive Horizontal Grid */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {watchlist.map((stock) => {
            const scores = computeStockIQScore(stock);
            const verdictDetails = getStrategyVerdict(scores.overall);
            return (
              <div key={stock.ticker} style={{ background: '#1e293b', border: '1px solid #334155', padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyBetween: 'space-between', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8' }}>{stock.sector}</span>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', margin: '2px 0 0 0' }}>{stock.ticker}</h3>
                    <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>{stock.name}</p>
                  </div>
                  <button
                    onClick={() => onRemoveFromWatchlist(stock.ticker)}
                    style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '6px', borderRadius: '8px' }}
                    title="Remove stock"
                  >
                    <Trash2 style={{ width: '16px', height: '16px' }} />
                  </button>
                </div>

                <div style={{ paddingTop: '12px', borderTop: '1px solid #334155', display: 'flex', alignItems: 'center', justifyBetween: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: 900, color: '#ffffff' }}>PKR {stock.price.toLocaleString()}</div>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: stock.change >= 0 ? '#10b981' : '#f43f5e' }}>
                      {stock.change >= 0 ? '+' : ''}{stock.change} ({stock.changePercent}%)
                    </span>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                      <Award style={{ width: '16px', height: '16px', color: '#10b981' }} />
                      <span style={{ fontSize: '16px', fontWeight: 900, color: '#ffffff' }}>{scores.overall}</span>
                    </div>
                    <span style={{ display: 'inline-block', fontSize: '9px', fontWeight: 800, padding: '2px 8px', borderRadius: '9999px', border: '1px solid', color: verdictDetails.hexColor, borderColor: verdictDetails.hexColor, background: '#0f172a', marginTop: '4px' }}>
                      {verdictDetails.label}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => onSelectStock(stock)}
                  style={{ width: '100%', padding: '8px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#cbd5e1', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  View Full Analytics
                  <ArrowUpRight style={{ width: '14px', height: '14px' }} />
                </button>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
