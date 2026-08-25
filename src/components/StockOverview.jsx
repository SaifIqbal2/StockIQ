import React, { useRef, useState } from 'react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Sparkles, ShieldCheck, Activity, Award, 
  BarChart3, DollarSign, Layers, CheckCircle2, BookmarkPlus,
  ChevronLeft, ChevronRight, LayoutGrid, Table2, Eye,
  ArrowUpRight, AlertTriangle, Compass, Target, Gauge, Zap
} from 'lucide-react';
import { computeStockIQScore, getStrategyVerdict } from '../services/calculations';
import { analyzeStockStrategy } from '../services/strategyEngine';

export function StockOverview({ stocks, selectedStock, onSelectStock, onOpenAI, onAddToWatchlist }) {
  const stock = selectedStock || stocks[0];
  const scores = computeStockIQScore(stock);
  const strategyAnalysis = analyzeStockStrategy(stock);
  const verdictDetails = strategyAnalysis?.verdict || getStrategyVerdict(scores.overall);

  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'
  const [metricsTab, setMetricsTab] = useState('summary'); // 'summary' | 'psx_deep'
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

  const m = strategyAnalysis?.metrics || {
    price: stock.price,
    open: stock.open_price || stock.price,
    high: stock.day_high || (stock.price * 1.01),
    low: stock.day_low || (stock.price * 0.99),
    ldcp: stock.previous_close || stock.price,
    volume: stock.volume || 1000000,
    high52: stock.fifty_two_week_high || (stock.price * 1.25),
    low52: stock.fifty_two_week_low || (stock.price * 0.75),
    pe: stock.pe_ratio,
    pb: stock.pb_ratio,
    roe: stock.roe,
    divYield: stock.dividend_yield,
    change: stock.change,
    changePercent: stock.changePercent
  };

  // Day range % position
  const dayRangePos = m.high > m.low ? Math.min(100, Math.max(0, Math.round(((m.price - m.low) / (m.high - m.low)) * 100))) : 50;
  // 52-week range % position
  const yearRangePos = m.high52 > m.low52 ? Math.min(100, Math.max(0, Math.round(((m.price - m.low52) / (m.high52 - m.low52)) * 100))) : 50;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* ================================================================
          1. TOP PSX STOCKS CAROUSEL / UNIVERSE SELECTOR
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
                    minWidth: '210px',
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
          2. MAIN ACTIVE STOCK PANEL: HERO & 12-ATTRIBUTE DATA GRID
      ================================================================ */}
      <div style={{ background: '#0f172a', padding: '24px', borderRadius: '20px', border: '1px solid #1e293b' }}>
        
        {/* Top Header Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', paddingBottom: '16px', borderBottom: '1px solid #1e293b' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff', margin: 0 }}>{stock.name}</h1>
              <span style={{ padding: '3px 10px', fontSize: '13px', fontWeight: 800, background: '#1e293b', color: '#10b981', borderRadius: '8px', border: '1px solid #334155' }}>
                {stock.ticker}
              </span>
              <span style={{ fontSize: '12px', color: '#94a3b8', background: '#1e293b', padding: '3px 10px', borderRadius: '6px', border: '1px solid #334155' }}>
                {stock.sector || 'General'}
              </span>
            </div>

            {/* Selected Strategy Match Tag */}
            {strategyAnalysis && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 800, color: strategyAnalysis.strategy.color, background: strategyAnalysis.strategy.badgeBg, padding: '4px 10px', borderRadius: '8px', border: `1px solid ${strategyAnalysis.strategy.color}40` }}>
                  <Compass style={{ width: '13px', height: '13px' }} />
                  {strategyAnalysis.strategy.name}
                </span>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                  {strategyAnalysis.strategy.tagline}
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => onAddToWatchlist(stock)}
              style={{ background: '#1e293b', border: '1px solid #334155', color: '#cbd5e1', padding: '8px 14px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600 }}
              title="Save to Watchlist"
            >
              <BookmarkPlus style={{ width: '16px', height: '16px' }} /> Watch
            </button>
            <button
              onClick={() => onOpenAI(stock)}
              style={{ background: 'linear-gradient(to right, #059669, #0d9488)', border: 'none', color: '#ffffff', padding: '9px 18px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)' }}
            >
              <Sparkles style={{ width: '15px', height: '15px', color: '#fde047' }} />
              AI Analyst
            </button>
          </div>
        </div>

        {/* 12-Attribute PSX Trading Data Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', background: '#1e293b', padding: '16px 20px', borderRadius: '14px', border: '1px solid #334155', marginTop: '18px' }}>
          
          <div>
            <span style={{ color: '#94a3b8', fontSize: '11px', display: 'block', fontWeight: 600 }}>Current Price</span>
            <span style={{ color: '#ffffff', fontWeight: 900, fontSize: '20px' }}>PKR {Number(m.price).toLocaleString()}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', fontWeight: 700, color: m.change >= 0 ? '#10b981' : '#f43f5e', marginTop: '2px' }}>
              {m.change >= 0 ? <TrendingUp style={{ width: '12px', height: '12px' }} /> : <TrendingDown style={{ width: '12px', height: '12px' }} />}
              {m.change >= 0 ? '+' : ''}{m.change} ({m.changePercent}%)
            </span>
          </div>

          <div>
            <span style={{ color: '#94a3b8', fontSize: '11px', display: 'block', fontWeight: 600 }}>LDCP / Prev Close</span>
            <span style={{ color: '#e2e8f0', fontWeight: 800, fontSize: '16px' }}>PKR {Number(m.ldcp).toLocaleString()}</span>
            <span style={{ color: '#64748b', fontSize: '10px', display: 'block', marginTop: '2px' }}>Open: PKR {Number(m.open).toLocaleString()}</span>
          </div>

          <div>
            <span style={{ color: '#94a3b8', fontSize: '11px', display: 'block', fontWeight: 600 }}>Day High / Low</span>
            <span style={{ color: '#10b981', fontWeight: 800, fontSize: '15px' }}>{Number(m.high).toLocaleString()}</span>
            <span style={{ color: '#f43f5e', fontSize: '12px', fontWeight: 700, display: 'block' }}>{Number(m.low).toLocaleString()}</span>
          </div>

          <div>
            <span style={{ color: '#94a3b8', fontSize: '11px', display: 'block', fontWeight: 600 }}>24H Total Volume</span>
            <span style={{ color: '#fbbf24', fontWeight: 800, fontSize: '16px' }}>{Number(m.volume).toLocaleString()}</span>
            <span style={{ color: '#64748b', fontSize: '10px', display: 'block', marginTop: '2px' }}>Shares Traded</span>
          </div>

          <div>
            <span style={{ color: '#94a3b8', fontSize: '11px', display: 'block', fontWeight: 600 }}>P/E & P/B Multiples</span>
            <span style={{ color: '#06b6d4', fontWeight: 800, fontSize: '16px' }}>{m.pe}x</span>
            <span style={{ color: '#64748b', fontSize: '11px', display: 'block', marginTop: '2px' }}>P/B: {m.pb}x</span>
          </div>

          <div>
            <span style={{ color: '#94a3b8', fontSize: '11px', display: 'block', fontWeight: 600 }}>Dividend & ROE</span>
            <span style={{ color: '#34d399', fontWeight: 800, fontSize: '16px' }}>{m.divYield}%</span>
            <span style={{ color: '#64748b', fontSize: '11px', display: 'block', marginTop: '2px' }}>ROE: {m.roe}%</span>
          </div>

          <div>
            <span style={{ color: '#94a3b8', fontSize: '11px', display: 'block', fontWeight: 600 }}>StockIQ Score</span>
            <span style={{ color: '#ffffff', fontWeight: 900, fontSize: '20px' }}>{strategyAnalysis?.compositeScore || scores.overall} <span style={{ fontSize: '11px', color: '#64748b' }}>/100</span></span>
            <span style={{ display: 'inline-block', fontSize: '9px', fontWeight: 800, padding: '2px 7px', borderRadius: '9999px', border: '1px solid', color: verdictDetails.hexColor, borderColor: verdictDetails.hexColor, background: '#0f172a', marginTop: '2px' }}>
              {verdictDetails.label}
            </span>
          </div>

        </div>

        {/* Range Gauges (Day Range & 52-Week Range) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginTop: '16px' }}>
          
          {/* Day Range Bar */}
          <div style={{ background: '#090d16', padding: '12px 16px', borderRadius: '12px', border: '1px solid #1e293b' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8', marginBottom: '6px' }}>
              <span>Day Low: <b style={{ color: '#f43f5e' }}>{Number(m.low).toLocaleString()}</b></span>
              <span style={{ fontWeight: 700, color: '#e2e8f0' }}>Intraday Range</span>
              <span>Day High: <b style={{ color: '#10b981' }}>{Number(m.high).toLocaleString()}</b></span>
            </div>
            <div style={{ position: 'relative', width: '100%', height: '8px', background: '#334155', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${dayRangePos}%`, height: '100%', background: 'linear-gradient(to right, #f43f5e, #10b981)', borderRadius: '4px' }} />
            </div>
          </div>

          {/* 52-Week Range Bar */}
          <div style={{ background: '#090d16', padding: '12px 16px', borderRadius: '12px', border: '1px solid #1e293b' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8', marginBottom: '6px' }}>
              <span>52W Low: <b style={{ color: '#f43f5e' }}>{Number(m.low52).toLocaleString()}</b></span>
              <span style={{ fontWeight: 700, color: '#e2e8f0' }}>52-Week Range ({yearRangePos}%)</span>
              <span>52W High: <b style={{ color: '#10b981' }}>{Number(m.high52).toLocaleString()}</b></span>
            </div>
            <div style={{ position: 'relative', width: '100%', height: '8px', background: '#334155', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${yearRangePos}%`, height: '100%', background: 'linear-gradient(to right, #6366f1, #06b6d4, #10b981)', borderRadius: '4px' }} />
            </div>
          </div>

        </div>

      </div>

      {/* ================================================================
          3. STRATEGY ANALYSIS & GROWTH DRIVERS VS RISK WARNINGS
      ================================================================ */}
      {strategyAnalysis && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          
          {/* Growth Drivers / Catalysts ("Why Stock Price Will Go Up") */}
          <div style={{ background: '#0f172a', padding: '20px', borderRadius: '18px', border: '1px solid #1e293b' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', paddingBottom: '10px', borderBottom: '1px solid #1e293b' }}>
              <Zap style={{ width: '16px', height: '16px', color: '#10b981' }} />
              <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                Growth Drivers & Catalysts <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 600 }}>({strategyAnalysis.growthDrivers.length} Identified)</span>
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {strategyAnalysis.growthDrivers.map((driver, idx) => (
                <div key={idx} style={{ background: '#090d16', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#34d399', fontWeight: 700, fontSize: '12px', marginBottom: '3px' }}>
                    <ArrowUpRight style={{ width: '14px', height: '14px' }} />
                    {driver.title}
                  </div>
                  <p style={{ fontSize: '11px', color: '#cbd5e1', margin: 0, lineHeight: 1.45 }}>
                    {driver.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Risk Factors & Headwinds ("Why Stock Price Might Fall / Risks") */}
          <div style={{ background: '#0f172a', padding: '20px', borderRadius: '18px', border: '1px solid #1e293b' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', paddingBottom: '10px', borderBottom: '1px solid #1e293b' }}>
              <AlertTriangle style={{ width: '16px', height: '16px', color: '#f59e0b' }} />
              <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                Risk Factors & Headwinds <span style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 600 }}>({strategyAnalysis.riskWarnings.length} Flagged)</span>
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {strategyAnalysis.riskWarnings.map((risk, idx) => (
                <div key={idx} style={{ background: '#090d16', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fbbf24', fontWeight: 700, fontSize: '12px', marginBottom: '3px' }}>
                    <AlertTriangle style={{ width: '13px', height: '13px' }} />
                    {risk.title}
                  </div>
                  <p style={{ fontSize: '11px', color: '#cbd5e1', margin: 0, lineHeight: 1.45 }}>
                    {risk.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ================================================================
          4. 6-MONTH CHART & 10-CATEGORY PROGRESS BREAKDOWN
      ================================================================ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        
        {/* Price Chart */}
        <div style={{ background: '#0f172a', padding: '20px', borderRadius: '18px', border: '1px solid #1e293b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '7px', margin: 0 }}>
              <Activity style={{ width: '15px', height: '15px', color: '#10b981' }} />
              6-Month Price Trend (PKR)
            </h3>
            <span style={{ fontSize: '11px', color: '#94a3b8', background: '#1e293b', padding: '3px 9px', borderRadius: '7px', border: '1px solid #334155' }}>
              PSX Market Data
            </span>
          </div>

          <div style={{ width: '100%', height: '220px' }}>
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

        {/* 10-Category Breakdown */}
        <div style={{ background: '#0f172a', padding: '20px', borderRadius: '18px', border: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '10px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '7px', margin: 0 }}>
              <BarChart3 style={{ width: '15px', height: '15px', color: '#6366f1' }} />
              10-Category Breakdown
            </h3>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8' }}>Score / 100</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <div key={cat.name} style={{ background: '#090d16', padding: '9px 12px', borderRadius: '10px', border: '1px solid #1e293b' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                      <Icon style={{ width: '13px', height: '13px', color: cat.color }} />
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#cbd5e1' }}>{cat.name}</span>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 900, color: '#ffffff', background: '#1e293b', padding: '1px 6px', borderRadius: '4px', border: '1px solid #334155' }}>
                      {cat.score}/100
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: '#334155', borderRadius: '3px', overflow: 'hidden' }}>
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
