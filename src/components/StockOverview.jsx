import React, { useRef, useState } from 'react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Sparkles, ShieldCheck, Activity, Award, 
  BarChart3, DollarSign, Layers, CheckCircle2, BookmarkPlus,
  ChevronLeft, ChevronRight, LayoutGrid, Table2, Eye
} from 'lucide-react';
import { computeStockIQScore, getStrategyVerdict } from '../services/calculations';

export function StockOverview({ stocks, selectedStock, onSelectStock, onOpenAI, onAddToWatchlist }) {
  const stock = selectedStock || stocks[0];
  const scores = computeStockIQScore(stock);
  const verdictDetails = scores.verdictDetails || getStrategyVerdict(scores.overall);

  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'
  const carouselRef = useRef(null);

  const scrollCarousel = (dir) => {
    if (!carouselRef.current) return;
    carouselRef.current.scrollBy({ left: dir * 260, behavior: 'smooth' });
  };

  const categories = [
    { name: 'Profitability Score', score: scores.profitability, icon: Award, color: '#34d399', barColor: '#10b981' },
    { name: 'Valuation Multiple', score: scores.valuation, icon: DollarSign, color: '#22d3ee', barColor: '#06b6d4' },
    { name: 'Solvency & Debt', score: scores.solvency, icon: ShieldCheck, color: '#818cf8', barColor: '#6366f1' },
    { name: 'Liquidity Ratio', score: scores.liquidity, icon: Activity, color: '#a78bfa', barColor: '#8b5cf6' },
    { name: 'Growth Metric', score: scores.growth, icon: TrendingUp, color: '#2dd4bf', barColor: '#14b8a6' },
    { name: 'Operating Efficiency', score: scores.efficiency, icon: Layers, color: '#fbbf24', barColor: '#f59e0b' },
    { name: 'Earnings Quality', score: scores.quality, icon: CheckCircle2, color: '#60a5fa', barColor: '#3b82f6' },
    { name: 'Dividend Yield Score', score: scores.dividend, icon: BarChart3, color: '#34d399', barColor: '#10b981' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* ================================================================
          TOP CAROUSEL SELECTOR
      ================================================================ */}
      <div style={{ background: '#0f172a', padding: '16px 20px', borderRadius: '16px', border: '1px solid #1e293b' }}>
        
        {/* Header Row with view toggle */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp style={{ width: '15px', height: '15px', color: '#10b981' }} />
            <h2 style={{ fontSize: '12px', fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
              PSX Stocks Universe ({stocks.length})
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* View Toggle Buttons */}
            <div style={{ display: 'flex', background: '#1e293b', borderRadius: '8px', border: '1px solid #334155', padding: '2px', gap: '2px' }}>
              <button
                onClick={() => setViewMode('cards')}
                title="Carousel Card View"
                style={{
                  background: viewMode === 'cards' ? '#334155' : 'transparent',
                  border: 'none', color: viewMode === 'cards' ? '#ffffff' : '#64748b',
                  padding: '4px 8px', borderRadius: '6px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600,
                  transition: 'all 0.15s ease'
                }}
              >
                <LayoutGrid style={{ width: '13px', height: '13px' }} /> Cards
              </button>
              <button
                onClick={() => setViewMode('table')}
                title="Market Table View"
                style={{
                  background: viewMode === 'table' ? '#334155' : 'transparent',
                  border: 'none', color: viewMode === 'table' ? '#ffffff' : '#64748b',
                  padding: '4px 8px', borderRadius: '6px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600,
                  transition: 'all 0.15s ease'
                }}
              >
                <Table2 style={{ width: '13px', height: '13px' }} /> Table
              </button>
            </div>

            {/* Arrow Controls — only in card view */}
            {viewMode === 'cards' && (
              <div style={{ display: 'flex', gap: '4px' }}>
                <button onClick={() => scrollCarousel(-1)} style={{ background: '#1e293b', border: '1px solid #334155', color: '#94a3b8', padding: '5px 8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.15s ease' }}>
                  <ChevronLeft style={{ width: '15px', height: '15px' }} />
                </button>
                <button onClick={() => scrollCarousel(1)} style={{ background: '#1e293b', border: '1px solid #334155', color: '#94a3b8', padding: '5px 8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.15s ease' }}>
                  <ChevronRight style={{ width: '15px', height: '15px' }} />
                </button>
              </div>
            )}

            <span style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 10px', borderRadius: '9999px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              Live
            </span>
          </div>
        </div>

        {/* ===================== CARD CAROUSEL ===================== */}
        {viewMode === 'cards' && (
          <div
            ref={carouselRef}
            style={{
              display: 'flex',
              gap: '12px',
              overflowX: 'auto',
              scrollBehavior: 'smooth',
              paddingBottom: '8px',
              scrollbarWidth: 'thin',
              scrollbarColor: '#334155 #0f172a',
            }}
          >
            {stocks.map((item) => {
              const itemScores = computeStockIQScore(item);
              const itemVerdict = getStrategyVerdict(itemScores.overall);
              const isSelected = item.ticker === stock.ticker;

              return (
                <div
                  key={item.ticker}
                  onClick={() => onSelectStock(item)}
                  style={{
                    minWidth: '200px',
                    flexShrink: 0,
                    background: isSelected ? '#1e293b' : '#090d16',
                    border: isSelected ? '1px solid #10b981' : '1px solid #1e293b',
                    boxShadow: isSelected ? '0 0 14px rgba(16, 185, 129, 0.2)' : 'none',
                    borderRadius: '12px',
                    padding: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800, color: '#ffffff', fontSize: '14px' }}>{item.ticker}</span>
                    <span style={{ fontSize: '11px', fontWeight: 900, color: '#10b981', background: 'rgba(16, 185, 129, 0.12)', padding: '2px 7px', borderRadius: '6px' }}>
                      {itemScores.overall}
                    </span>
                  </div>
                  <p style={{ fontSize: '11px', color: '#94a3b8', margin: '3px 0 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.name}
                  </p>
                  <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: '#e2e8f0' }}>
                        PKR {Number(item.price).toLocaleString()}
                      </span>
                      <span style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: item.change >= 0 ? '#10b981' : '#f43f5e', marginTop: '1px' }}>
                        {item.change >= 0 ? '+' : ''}{item.change} ({item.changePercent}%)
                      </span>
                    </div>
                    <span style={{ fontSize: '9px', fontWeight: 800, padding: '2px 7px', borderRadius: '9999px', border: '1px solid', color: itemVerdict.hexColor, borderColor: itemVerdict.hexColor, background: '#0f172a' }}>
                      {itemVerdict.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ===================== MARKET TABLE ===================== */}
        {viewMode === 'table' && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #334155' }}>
                  {['Ticker', 'Company', 'Price (PKR)', 'Change', 'Score', 'Fit', 'Action'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#64748b', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stocks.map((item, idx) => {
                  const itemScores = computeStockIQScore(item);
                  const itemVerdict = getStrategyVerdict(itemScores.overall);
                  const isSelected = item.ticker === stock.ticker;

                  return (
                    <tr
                      key={item.ticker}
                      onClick={() => onSelectStock(item)}
                      style={{
                        background: isSelected ? 'rgba(16, 185, 129, 0.07)' : idx % 2 === 0 ? '#090d16' : '#0b1120',
                        borderBottom: '1px solid #1e293b',
                        cursor: 'pointer',
                        transition: 'background 0.15s ease',
                        outline: isSelected ? '1px solid rgba(16, 185, 129, 0.35)' : 'none',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#1e293b'}
                      onMouseLeave={e => e.currentTarget.style.background = isSelected ? 'rgba(16, 185, 129, 0.07)' : idx % 2 === 0 ? '#090d16' : '#0b1120'}
                    >
                      <td style={{ padding: '9px 12px', fontWeight: 800, color: '#10b981', whiteSpace: 'nowrap' }}>
                        {item.ticker}
                      </td>
                      <td style={{ padding: '9px 12px', color: '#e2e8f0', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.name}
                      </td>
                      <td style={{ padding: '9px 12px', fontWeight: 700, color: '#ffffff', whiteSpace: 'nowrap' }}>
                        {Number(item.price).toLocaleString()}
                      </td>
                      <td style={{ padding: '9px 12px', fontWeight: 700, color: item.change >= 0 ? '#10b981' : '#f43f5e', whiteSpace: 'nowrap' }}>
                        {item.change >= 0 ? '+' : ''}{item.change} ({item.changePercent}%)
                      </td>
                      <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>
                        <span style={{ fontWeight: 900, color: '#ffffff', background: '#1e293b', padding: '2px 8px', borderRadius: '6px', border: '1px solid #334155' }}>
                          {itemScores.overall}/100
                        </span>
                      </td>
                      <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '9999px', border: '1px solid', color: itemVerdict.hexColor, borderColor: itemVerdict.hexColor }}>
                          {itemVerdict.label}
                        </span>
                      </td>
                      <td style={{ padding: '9px 12px' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={(e) => { e.stopPropagation(); onSelectStock(item); }}
                            title="View Analysis"
                            style={{ background: '#1e293b', border: '1px solid #334155', color: '#94a3b8', padding: '4px 7px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                          >
                            <Eye style={{ width: '13px', height: '13px' }} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); onAddToWatchlist(item); }}
                            title="Add to Watchlist"
                            style={{ background: '#1e293b', border: '1px solid #334155', color: '#94a3b8', padding: '4px 7px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                          >
                            <BookmarkPlus style={{ width: '13px', height: '13px' }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================================================================
          MAIN STOCK DETAIL LAYOUT (2-Column Grid)
      ================================================================ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        
        {/* LEFT: Stock Header + Metric Grid + Chart */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Hero Card */}
          <div style={{ background: '#0f172a', padding: '20px', borderRadius: '18px', border: '1px solid #1e293b' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', paddingBottom: '14px', borderBottom: '1px solid #1e293b' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff', margin: 0 }}>{stock.name}</h1>
                  <span style={{ padding: '3px 10px', fontSize: '12px', fontWeight: 800, background: '#1e293b', color: '#10b981', borderRadius: '8px', border: '1px solid #334155' }}>
                    {stock.ticker}
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '5px', marginBottom: 0, maxWidth: '580px' }}>{stock.description}</p>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => onAddToWatchlist(stock)}
                  style={{ background: '#1e293b', border: '1px solid #334155', color: '#cbd5e1', padding: '7px 10px', borderRadius: '9px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 600 }}
                  title="Save to Watchlist"
                >
                  <BookmarkPlus style={{ width: '15px', height: '15px' }} /> Watch
                </button>
                <button
                  onClick={() => onOpenAI(stock)}
                  style={{ background: 'linear-gradient(to right, #059669, #0d9488)', border: 'none', color: '#ffffff', padding: '8px 16px', borderRadius: '9px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)' }}
                >
                  <Sparkles style={{ width: '14px', height: '14px', color: '#fde047' }} />
                  AI Analyst
                </button>
              </div>
            </div>

            {/* Metric Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '14px', background: '#1e293b', padding: '16px', borderRadius: '12px', border: '1px solid #334155', marginTop: '16px' }}>
              
              <div>
                <span style={{ color: '#94a3b8', fontSize: '11px', display: 'block', fontWeight: 600 }}>StockIQ Rating</span>
                <span style={{ color: '#ffffff', fontWeight: 900, fontSize: '22px' }}>{scores.overall} <span style={{ fontSize: '11px', color: '#64748b' }}>/100</span></span>
                <span style={{ display: 'inline-block', fontSize: '9px', fontWeight: 800, padding: '2px 8px', borderRadius: '9999px', border: '1px solid', color: verdictDetails.hexColor, borderColor: verdictDetails.hexColor, background: '#0f172a', marginTop: '3px' }}>
                  {verdictDetails.label}
                </span>
              </div>

              <div>
                <span style={{ color: '#94a3b8', fontSize: '11px', display: 'block', fontWeight: 600 }}>Share Price</span>
                <span style={{ color: '#ffffff', fontWeight: 800, fontSize: '16px' }}>PKR {Number(stock.price).toLocaleString()}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px', fontWeight: 700, color: stock.change >= 0 ? '#10b981' : '#f43f5e', marginTop: '2px' }}>
                  {stock.change >= 0 ? <TrendingUp style={{ width: '10px', height: '10px' }} /> : <TrendingDown style={{ width: '10px', height: '10px' }} />}
                  {stock.change >= 0 ? '+' : ''}{stock.change} ({stock.changePercent}%)
                </span>
              </div>

              <div>
                <span style={{ color: '#94a3b8', fontSize: '11px', display: 'block', fontWeight: 600 }}>P/E Ratio</span>
                <span style={{ color: '#06b6d4', fontWeight: 800, fontSize: '16px' }}>{stock.pe_ratio}x</span>
                <span style={{ color: '#64748b', fontSize: '10px', display: 'block', marginTop: '2px' }}>P/B: {stock.pb_ratio}x</span>
              </div>

              <div>
                <span style={{ color: '#94a3b8', fontSize: '11px', display: 'block', fontWeight: 600 }}>Dividend Yield</span>
                <span style={{ color: '#10b981', fontWeight: 800, fontSize: '16px' }}>{stock.dividend_yield}%</span>
                <span style={{ color: '#64748b', fontSize: '10px', display: 'block', marginTop: '2px' }}>ROE: {stock.roe}%</span>
              </div>

            </div>
          </div>

          {/* Price Chart */}
          <div style={{ background: '#0f172a', padding: '18px 20px', borderRadius: '18px', border: '1px solid #1e293b' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '7px', margin: 0 }}>
                <Activity style={{ width: '15px', height: '15px', color: '#10b981' }} />
                6-Month Price Trend (PKR)
              </h3>
              <span style={{ fontSize: '11px', color: '#94a3b8', background: '#1e293b', padding: '3px 9px', borderRadius: '7px', border: '1px solid #334155' }}>
                PSX Market Data
              </span>
            </div>

            <div style={{ width: '100%', height: '200px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stock.priceHistory || []}>
                  <defs>
                    <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={verdictDetails.hexColor} stopOpacity={0.4}/>
                      <stop offset="95%" stopColor={verdictDetails.hexColor} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '10px', color: '#fff', fontSize: '12px' }}
                    formatter={(val) => [`PKR ${val}`, 'Price']}
                  />
                  <Area type="monotone" dataKey="price" stroke={verdictDetails.hexColor} strokeWidth={2.5} fillOpacity={1} fill="url(#priceGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* RIGHT: 10-Category Breakdown */}
        <div style={{ background: '#0f172a', padding: '18px 20px', borderRadius: '18px', border: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '10px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '7px', margin: 0 }}>
              <BarChart3 style={{ width: '15px', height: '15px', color: '#6366f1' }} />
              10-Category Breakdown
            </h3>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8' }}>Score / 100</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <div key={cat.name} style={{ background: '#090d16', padding: '10px 12px', borderRadius: '10px', border: '1px solid #1e293b' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                      <Icon style={{ width: '14px', height: '14px', color: cat.color }} />
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#cbd5e1' }}>{cat.name}</span>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 900, color: '#ffffff', background: '#1e293b', padding: '1px 7px', borderRadius: '5px', border: '1px solid #334155' }}>
                      {cat.score}/100
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '7px', background: '#334155', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${cat.score}%`, background: cat.barColor, borderRadius: '3px', transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
