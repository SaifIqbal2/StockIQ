import React from 'react';
import { 
  Users, TrendingUp, TrendingDown, Award, DollarSign, 
  ShieldCheck, ArrowRight, Eye, Sparkles, CheckCircle2 
} from 'lucide-react';
import { evaluateStockAlgorithm } from '../services/scoringAlgorithm';

export function PeerComparison({ selectedStock, allStocks = [], onSelectStock }) {
  if (!selectedStock) return null;

  const currentTicker = selectedStock.ticker;
  const currentSector = selectedStock.sector || 'General';

  // 1. Filter peers from the same sector (or top stocks if sector has few peers)
  const sectorPeers = allStocks
    .filter(s => s.ticker !== currentTicker && s.sector === currentSector && s.price > 0)
    .slice(0, 4);

  // If less than 2 peers in same sector, backfill with top universe stocks
  const finalPeers = [...sectorPeers];
  if (finalPeers.length < 3) {
    const extra = allStocks
      .filter(s => s.ticker !== currentTicker && !finalPeers.some(p => p.ticker === s.ticker) && s.price > 0)
      .slice(0, 4 - finalPeers.length);
    finalPeers.push(...extra);
  }

  // Combine selected stock + peers for comparative matrix
  const compareList = [selectedStock, ...finalPeers];

  // Calculate sector leaders for badges
  const bestPE = Math.min(...compareList.map(s => Number(s.pe_ratio || 99)).filter(pe => pe > 0));
  const bestROE = Math.max(...compareList.map(s => Number(s.roe || 0)));
  const bestDiv = Math.max(...compareList.map(s => Number(s.dividend_yield || 0)));

  return (
    <div style={{
      background: '#0f172a',
      borderRadius: '20px',
      border: '1px solid #1e293b',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      padding: '20px 24px'
    }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', paddingBottom: '12px', borderBottom: '1px solid #1e293b' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users style={{ width: '16px', height: '16px', color: '#6366f1' }} />
          <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
            Sector Peer Comparison Matrix
          </h3>
          <span style={{ fontSize: '11px', color: '#94a3b8', background: '#1e293b', padding: '3px 9px', borderRadius: '6px', border: '1px solid #334155' }}>
            {currentSector} Industry
          </span>
        </div>

        <span style={{ fontSize: '11px', color: '#64748b' }}>
          Comparing {compareList.length} equities
        </span>
      </div>

      {/* Peer Comparison Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #334155' }}>
              {['Company', 'Price (PKR)', 'Change', 'P/E Multiple', 'ROE %', 'Dividend Yield', 'StockIQ Score', 'Flag', 'Action'].map(h => (
                <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: '#64748b', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {compareList.map((item, idx) => {
              const isSelected = item.ticker === currentTicker;
              const algo = item.algorithmicAssessment || evaluateStockAlgorithm(item);
              const flag = algo?.flag;
              const pe = Number(item.pe_ratio || 0);
              const roe = Number(item.roe || 0);
              const div = Number(item.dividend_yield || 0);

              const isBestPE = pe > 0 && pe === bestPE;
              const isBestROE = roe > 0 && roe === bestROE;
              const isBestDiv = div > 0 && div === bestDiv;

              return (
                <tr
                  key={item.ticker}
                  onClick={() => onSelectStock && onSelectStock(item)}
                  style={{
                    background: isSelected ? 'rgba(16, 185, 129, 0.08)' : idx % 2 === 0 ? '#090d16' : '#0b1120',
                    borderBottom: '1px solid #1e293b',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    outline: isSelected ? '1px solid rgba(16, 185, 129, 0.35)' : 'none'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = isSelected ? 'rgba(16, 185, 129, 0.14)' : '#1e293b'}
                  onMouseLeave={e => e.currentTarget.style.background = isSelected ? 'rgba(16, 185, 129, 0.08)' : idx % 2 === 0 ? '#090d16' : '#0b1120'}
                >
                  {/* Ticker & Name */}
                  <td style={{ padding: '10px 10px', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 900, color: isSelected ? '#10b981' : '#ffffff', fontSize: '13px' }}>
                        {item.ticker}
                      </span>
                      {isSelected && (
                        <span style={{ fontSize: '9px', fontWeight: 800, background: 'rgba(16,185,129,0.2)', color: '#10b981', padding: '1px 5px', borderRadius: '4px', border: '1px solid rgba(16,185,129,0.4)' }}>
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.name}
                    </span>
                  </td>

                  {/* Price */}
                  <td style={{ padding: '10px 10px', fontWeight: 800, color: '#ffffff', whiteSpace: 'nowrap' }}>
                    PKR {Number(item.price).toLocaleString()}
                  </td>

                  {/* Change */}
                  <td style={{ padding: '10px 10px', fontWeight: 700, color: item.change >= 0 ? '#10b981' : '#f43f5e', whiteSpace: 'nowrap' }}>
                    {item.change >= 0 ? '+' : ''}{item.change} ({item.changePercent}%)
                  </td>

                  {/* P/E */}
                  <td style={{ padding: '10px 10px', whiteSpace: 'nowrap' }}>
                    <span style={{ fontWeight: 800, color: isBestPE ? '#22d3ee' : '#cbd5e1' }}>
                      {pe > 0 ? `${pe}x` : 'N/A'}
                    </span>
                    {isBestPE && <span style={{ fontSize: '9px', marginLeft: '4px', color: '#22d3ee', fontWeight: 700 }}>★ Lowest</span>}
                  </td>

                  {/* ROE */}
                  <td style={{ padding: '10px 10px', whiteSpace: 'nowrap' }}>
                    <span style={{ fontWeight: 800, color: isBestROE ? '#34d399' : '#cbd5e1' }}>
                      {roe > 0 ? `${roe}%` : 'N/A'}
                    </span>
                    {isBestROE && <span style={{ fontSize: '9px', marginLeft: '4px', color: '#34d399', fontWeight: 700 }}>★ Highest</span>}
                  </td>

                  {/* Div Yield */}
                  <td style={{ padding: '10px 10px', whiteSpace: 'nowrap' }}>
                    <span style={{ fontWeight: 800, color: isBestDiv ? '#fbbf24' : '#cbd5e1' }}>
                      {div >= 0 ? `${div}%` : 'N/A'}
                    </span>
                    {isBestDiv && <span style={{ fontSize: '9px', marginLeft: '4px', color: '#fbbf24', fontWeight: 700 }}>★ Best Yield</span>}
                  </td>

                  {/* Score */}
                  <td style={{ padding: '10px 10px', whiteSpace: 'nowrap' }}>
                    <span style={{ fontWeight: 900, color: '#ffffff', background: '#1e293b', padding: '2px 8px', borderRadius: '6px', border: '1px solid #334155' }}>
                      {algo?.compositeScore || 75}/100
                    </span>
                  </td>

                  {/* Flag */}
                  <td style={{ padding: '10px 10px', whiteSpace: 'nowrap' }}>
                    <span style={{ fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '9999px', border: `1px solid ${flag?.color || '#10b981'}`, color: flag?.color || '#10b981', background: flag?.bg || 'rgba(16,185,129,0.1)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      <span>{flag?.icon || '🟢'}</span> {flag?.label || 'Buy'}
                    </span>
                  </td>

                  {/* Action */}
                  <td style={{ padding: '10px 10px' }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); onSelectStock && onSelectStock(item); }}
                      style={{
                        background: isSelected ? '#10b981' : '#1e293b',
                        border: isSelected ? 'none' : '1px solid #334155',
                        color: isSelected ? '#ffffff' : '#94a3b8',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Eye style={{ width: '12px', height: '12px' }} />
                      {isSelected ? 'Viewing' : 'Inspect'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
}
