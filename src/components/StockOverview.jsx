import React, { useRef, useState, useMemo } from 'react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Sparkles, ShieldCheck, Activity, Award, 
  BarChart3, DollarSign, Layers, CheckCircle2, BookmarkPlus,
  ChevronLeft, ChevronRight, LayoutGrid, Table2, Eye,
  ArrowUpRight, AlertTriangle, Compass, Target, Gauge, Zap,
  Info, CheckCircle, HelpCircle, Wallet, ShieldAlert, Clock, TrendingDown as TrendDown,
  SlidersHorizontal, History, Radio, RefreshCw, Calculator, Globe, Newspaper
} from 'lucide-react';
import { evaluateStockAlgorithm } from '../services/scoringAlgorithm';
import { applyFilters, DEFAULT_FILTERS } from '../services/filterEngine';
import { getBacktestStatsForStock } from '../services/backtestEngine';
import { getMacroSentiment } from '../services/geminiService';
import { StockFilterBar } from './StockFilterBar';
import { DelistedBanner } from './DelistedBanner';
import { PeerComparison } from './PeerComparison';

export function StockOverview({ stocks = [], selectedStock, onSelectStock, onOpenAI, onAddToWatchlist }) {
  const stock = selectedStock || stocks[0];
  const algo = stock?.algorithmicAssessment || evaluateStockAlgorithm(stock);
  const flag = algo?.flag || {
    tier: 'GREEN',
    label: 'Strong Growth Buy',
    icon: '🟢',
    color: '#10b981',
    hexColor: '#10b981',
    bg: 'rgba(16, 185, 129, 0.15)',
    border: 'rgba(16, 185, 129, 0.35)',
    summary: 'Robust fundamental valuation with strong earnings yield.'
  };

  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'
  const [showTooltip, setShowTooltip] = useState(false);
  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS });
  const [showBacktestLogs, setShowBacktestLogs] = useState(false);
  
  // Custom user target & stop-loss state
  const [customTarget, setCustomTarget] = useState('');
  const [customStopLoss, setCustomStopLoss] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);

  const carouselRef = useRef(null);

  // Derive historical backtesting metrics for the selected stock
  const backtestStats = useMemo(() => getBacktestStatsForStock(stock), [stock]);

  // Derive macro & news sentiment indicators
  const macroSentiment = useMemo(() => getMacroSentiment(stock), [stock]);

  // Apply filter pipeline to full stock list
  const displayedStocks = useMemo(
    () => applyFilters(stocks, filters),
    [stocks, filters]
  );

  const scrollCarousel = (dir) => {
    if (!carouselRef.current) return;
    carouselRef.current.scrollBy({ left: dir * 260, behavior: 'smooth' });
  };

  const subScoresList = [
    { name: 'Fundamental Score', score: algo?.subScores?.fundamental || 80, icon: DollarSign, color: '#22d3ee', barColor: '#06b6d4' },
    { name: 'Technical Score',   score: algo?.subScores?.technical   || 72, icon: Activity,   color: '#a78bfa', barColor: '#8b5cf6' },
    { name: 'Momentum Score',    score: algo?.subScores?.momentum    || 76, icon: TrendingUp,  color: '#818cf8', barColor: '#6366f1' },
    { name: 'Risk Score',        score: algo?.subScores?.risk        || 70, icon: ShieldCheck, color: '#fbbf24', barColor: '#f59e0b' }
  ];

  const price = Number(stock?.price || 0);
  const open = Number(stock?.open_price || stock?.price || 0);
  const high = Number(stock?.day_high || (price * 1.01));
  const low = Number(stock?.day_low || (price * 0.99));
  const ldcp = Number(stock?.previous_close || (price - (stock?.change || 0)));
  const volume = Number(typeof stock?.volume === 'string' ? stock.volume.replace(/,/g, '') : (stock?.volume || 1000000));
  const high52 = Number(stock?.fifty_two_week_high || (price * 1.25));
  const low52 = Number(stock?.fifty_two_week_low || (price * 0.75));

  const dayRangePos = high > low ? Math.min(100, Math.max(0, Math.round(((price - low) / (high - low)) * 100))) : 50;
  const yearRangePos = high52 > low52 ? Math.min(100, Math.max(0, Math.round(((price - low52) / (high52 - low52)) * 100))) : 50;

  // ─── Dynamic Target & Stop-Loss (Auto vs Custom) ───────────────────────────
  const activeTargetPrice = isCustomMode && Number(customTarget) > 0
    ? Number(customTarget)
    : (algo?.tradeStrategy?.targetPrice || price * 1.12);

  const activeStopLoss = isCustomMode && Number(customStopLoss) > 0
    ? Number(customStopLoss)
    : (algo?.tradeStrategy?.stopLoss || price * 0.93);

  const customUpsidePKR = activeTargetPrice > price ? activeTargetPrice - price : 0;
  const customDownsidePKR = price > activeStopLoss ? price - activeStopLoss : 0;
  const dynamicRR = customDownsidePKR > 0.01 ? Number((customUpsidePKR / customDownsidePKR).toFixed(2)) : 0;
  const dynamicUpsidePct = price > 0 ? Number(((customUpsidePKR / price) * 100).toFixed(1)) : 0;
  const dynamicDownsidePct = price > 0 ? Number(((customDownsidePKR / price) * 100).toFixed(1)) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* ================================================================
          0. ADVANCED STOCK SCREENER FILTER BAR
      ================================================================ */}
      <StockFilterBar
        allStocks={stocks}
        filters={filters}
        onFiltersChange={setFilters}
        filteredCount={displayedStocks.length}
      />

      {/* ================================================================
          1. TOP PSX STOCKS CAROUSEL WITH 3-TIER FLAG BADGES
      ================================================================ */}
      <div style={{ background: '#0f172a', padding: '16px 20px', borderRadius: '16px', border: '1px solid #1e293b' }}>
        
        {/* Header Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp style={{ width: '15px', height: '15px', color: '#10b981' }} />
            <h2 style={{ fontSize: '12px', fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
              PSX Stocks Universe (
                {displayedStocks.length !== stocks.length
                  ? <><span style={{ color: '#10b981' }}>{displayedStocks.length} Filtered Picks</span><span style={{ color: '#475569' }}> / {stocks.length}</span></>
                  : stocks.length
                }
              )
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* View Toggle */}
            <div style={{ display: 'flex', background: '#1e293b', borderRadius: '8px', border: '1px solid #334155', padding: '2px', gap: '2px' }}>
              <button
                onClick={() => setViewMode('cards')}
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

            {/* Arrows */}
            {viewMode === 'cards' && (
              <div style={{ display: 'flex', gap: '4px' }}>
                <button onClick={() => scrollCarousel(-1)} style={{ background: '#1e293b', border: '1px solid #334155', color: '#94a3b8', padding: '5px 8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <ChevronLeft style={{ width: '15px', height: '15px' }} />
                </button>
                <button onClick={() => scrollCarousel(1)} style={{ background: '#1e293b', border: '1px solid #334155', color: '#94a3b8', padding: '5px 8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <ChevronRight style={{ width: '15px', height: '15px' }} />
                </button>
              </div>
            )}

            <span style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 10px', borderRadius: '9999px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              Live
            </span>
          </div>
        </div>

        {/* Card Carousel */}
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
            {displayedStocks.length === 0 ? (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', padding: '40px 20px', gap: '10px',
                color: '#475569', minWidth: '300px'
              }}>
                <SlidersHorizontal style={{ width: '32px', height: '32px', color: '#334155' }} />
                <p style={{ fontSize: '13px', fontWeight: 700, margin: 0 }}>No stocks match your current filters</p>
                <p style={{ fontSize: '11px', margin: 0, color: '#334155' }}>Try adjusting or resetting the screener above</p>
              </div>
            ) : displayedStocks.map((item) => {
              const itemAlgo = item.algorithmicAssessment || evaluateStockAlgorithm(item);
              const itemFlag = itemAlgo?.flag;
              const isSelected = item.ticker === stock?.ticker;

              return (
                <div
                  key={item.ticker}
                  onClick={() => onSelectStock(item)}
                  style={{
                    minWidth: '215px',
                    flexShrink: 0,
                    background: isSelected ? '#1e293b' : '#090d16',
                    border: isSelected ? `1px solid ${itemFlag?.color || '#10b981'}` : '1px solid #1e293b',
                    boxShadow: isSelected ? `0 0 14px ${itemFlag?.color || '#10b981'}35` : 'none',
                    borderRadius: '12px',
                    padding: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800, color: '#ffffff', fontSize: '14px' }}>{item.ticker}</span>
                    <span style={{ fontSize: '11px', fontWeight: 900, color: itemFlag?.color || '#10b981', background: itemFlag?.bg || 'rgba(16,185,129,0.1)', padding: '2px 7px', borderRadius: '6px', border: `1px solid ${itemFlag?.border || 'rgba(16,185,129,0.2)'}` }}>
                      {itemAlgo?.compositeScore || 80}/100
                    </span>
                  </div>
                  <p style={{ fontSize: '11px', color: '#94a3b8', margin: '3px 0 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.name}
                  </p>
                  
                  {/* Flag Tag Row */}
                  <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: '#e2e8f0' }}>
                        PKR {Number(item.price).toLocaleString()}
                      </span>
                      <span style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: item.change >= 0 ? '#10b981' : '#f43f5e', marginTop: '1px' }}>
                        {item.change >= 0 ? '+' : ''}{item.change} ({item.changePercent}%)
                      </span>
                    </div>
                    <span style={{ fontSize: '9px', fontWeight: 800, padding: '3px 8px', borderRadius: '9999px', border: `1px solid ${itemFlag?.color}`, color: itemFlag?.color, background: itemFlag?.bg, display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <span>{itemFlag?.icon}</span> {itemFlag?.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Market Table */}
        {viewMode === 'table' && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #334155' }}>
                  {['Ticker', 'Company', 'Price (PKR)', 'Change', 'Score', 'Flag Assessment', 'Action'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#64748b', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayedStocks.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#475569' }}>
                      <SlidersHorizontal style={{ width: '24px', height: '24px', marginBottom: '8px', display: 'block', margin: '0 auto 8px' }} />
                      No stocks match your current screener filters. Reset filters to restore the full market view.
                    </td>
                  </tr>
                ) : displayedStocks.map((item, idx) => {
                  const itemAlgo = item.algorithmicAssessment || evaluateStockAlgorithm(item);
                  const itemFlag = itemAlgo?.flag;
                  const isSelected = item.ticker === stock?.ticker;

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
                          {itemAlgo?.compositeScore || 80}/100
                        </span>
                      </td>
                      <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: '10px', fontWeight: 800, padding: '3px 9px', borderRadius: '9999px', border: `1px solid ${itemFlag?.color}`, color: itemFlag?.color, background: itemFlag?.bg, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <span>{itemFlag?.icon}</span> {itemFlag?.label}
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
          2. ACTIVE HERO PANEL WITH 3-TIER FLAG & ACTION SIGNALS
             (or DELISTED BANNER if security is gated)
      ================================================================ */}
      {stock?.status && stock?.status !== 'ACTIVE' ? (
        <DelistedBanner
          ticker={stock.ticker}
          delistInfo={{
            name:          stock.name,
            status:        stock.status,
            delisted_date: stock.delisted_date,
            reason:        stock.delisting_reason || 'This security is no longer actively traded on PSX.',
            successor:     stock.successor || null,
            successor_name: stock.successor_name || null
          }}
        />
      ) : (
      <div style={{ background: '#0f172a', padding: '24px', borderRadius: '20px', border: '1px solid #1e293b' }}>
        
        {/* Top Header */}
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

            {/* Action Signal Badge + RVOL + Breakout Context + Backtest Accuracy */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '12px', flexWrap: 'wrap' }}>
              
              {/* Action Signal */}
              {algo?.actionSignal && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '7px',
                  background: algo.actionSignal.bg,
                  border: `1px solid ${algo.actionSignal.border}`,
                  padding: '6px 14px', borderRadius: '10px',
                  boxShadow: `0 0 14px ${algo.actionSignal.color}20`
                }}>
                  <span style={{ fontSize: '14px' }}>{algo.actionSignal.icon}</span>
                  <span style={{ fontSize: '13px', fontWeight: 900, color: algo.actionSignal.color }}>
                    {algo.actionSignal.label}
                  </span>
                  <span style={{ fontSize: '10px', color: algo.actionSignal.color, opacity: 0.7, fontWeight: 600 }}>
                    R:R {dynamicRR}:1
                  </span>
                </div>
              )}

              {/* 1-Year Historical Hit Rate Badge */}
              {backtestStats && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  background: 'rgba(99, 102, 241, 0.12)',
                  border: '1px solid rgba(99, 102, 241, 0.35)',
                  padding: '5px 11px', borderRadius: '8px', cursor: 'pointer'
                }}
                onClick={() => setShowBacktestLogs(!showBacktestLogs)}
                title="Click to view historical backtest signals"
                >
                  <History style={{ width: '12px', height: '12px', color: '#818cf8' }} />
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#c7d2fe' }}>
                    1Y Hit Rate: <b style={{ color: '#34d399' }}>{backtestStats.hitRate}%</b>
                  </span>
                  <span style={{ fontSize: '9px', color: '#818cf8', fontWeight: 700 }}>
                    ({backtestStats.winCount}/{backtestStats.totalSignals} Wins)
                  </span>
                </div>
              )}

              {/* RVOL Badge */}
              {algo?.rvol !== undefined && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  background: algo.rvol >= 1.5 ? 'rgba(16,185,129,0.10)' : 'rgba(100,116,139,0.10)',
                  border: `1px solid ${algo.rvol >= 1.5 ? 'rgba(16,185,129,0.30)' : '#1e293b'}`,
                  padding: '5px 10px', borderRadius: '8px'
                }}>
                  <BarChart3 style={{ width: '11px', height: '11px', color: algo.rvol >= 1.5 ? '#10b981' : '#64748b' }} />
                  <span style={{ fontSize: '11px', fontWeight: 700, color: algo.rvol >= 1.5 ? '#10b981' : '#64748b' }}>
                    RVOL {algo.rvol}x
                  </span>
                </div>
              )}

              {/* 3-Tier flag */}
              <div
                onClick={() => setShowTooltip(!showTooltip)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  background: flag.bg, border: `1px solid ${flag.border}`,
                  padding: '5px 12px', borderRadius: '9px', cursor: 'pointer'
                }}
              >
                <span style={{ fontSize: '13px' }}>{flag.icon}</span>
                <span style={{ fontSize: '12px', fontWeight: 800, color: flag.color }}>
                  {flag.label} ({algo?.compositeScore}/100)
                </span>
                <Info style={{ width: '12px', height: '12px', color: flag.color, opacity: 0.8 }} />
              </div>
            </div>

            {/* Backtest Historical Signal Drawer */}
            {showBacktestLogs && backtestStats && (
              <div style={{ background: '#1e293b', border: '1px solid #334155', padding: '14px 18px', borderRadius: '12px', marginTop: '12px', maxWidth: '680px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#818cf8', fontWeight: 800, fontSize: '12px' }}>
                    <History style={{ width: '14px', height: '14px' }} />
                    Historical Backtest Performance Log (+14D & +30D Outcomes)
                  </div>
                  <span style={{ fontSize: '11px', color: '#34d399', fontWeight: 700 }}>
                    Avg +14D: {backtestStats.avgReturn14D} | +30D: {backtestStats.avgReturn30D}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', marginTop: '8px' }}>
                  {backtestStats.historyLog.map((log, i) => (
                    <div key={i} style={{ background: '#0f172a', padding: '8px 10px', borderRadius: '8px', border: '1px solid #334155' }}>
                      <div style={{ fontSize: '10px', color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
                        <span>{log.date}</span>
                        <span style={{ fontWeight: 800, color: log.outcome === 'WIN' ? '#10b981' : '#f43f5e' }}>{log.outcome}</span>
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>
                        PKR {log.entryPrice} → {log.exitPrice}
                      </div>
                      <div style={{ fontSize: '11px', fontWeight: 800, color: log.outcome === 'WIN' ? '#10b981' : '#f43f5e', marginTop: '1px' }}>
                        {log.returnPct} ({log.holdingDays}D)
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Explanatory Tooltip Box */}
            {showTooltip && (
              <div style={{ background: '#1e293b', border: `1px solid ${flag.border}`, padding: '14px 18px', borderRadius: '12px', marginTop: '12px', maxWidth: '620px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: flag.color, fontWeight: 700, fontSize: '13px', marginBottom: '6px' }}>
                  <HelpCircle style={{ width: '15px', height: '15px' }} />
                  Algorithmic Flag Assessment:
                </div>
                <p style={{ fontSize: '12px', color: '#e2e8f0', margin: 0, lineHeight: 1.5 }}>
                  {flag.summary} Evaluated on P/E ({stock.pe_ratio || 'N/A'}x), ROE ({stock.roe || 'N/A'}%), Dividend ({stock.dividend_yield || 0}%), and 24H volume ({Number(volume).toLocaleString()} shares).
                </p>
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
            <span style={{ color: '#ffffff', fontWeight: 900, fontSize: '20px' }}>PKR {Number(price).toLocaleString()}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', fontWeight: 700, color: stock.change >= 0 ? '#10b981' : '#f43f5e', marginTop: '2px' }}>
              {stock.change >= 0 ? <TrendingUp style={{ width: '12px', height: '12px' }} /> : <TrendingDown style={{ width: '12px', height: '12px' }} />}
              {stock.change >= 0 ? '+' : ''}{stock.change} ({stock.changePercent}%)
            </span>
          </div>

          <div>
            <span style={{ color: '#94a3b8', fontSize: '11px', display: 'block', fontWeight: 600 }}>LDCP / Prev Close</span>
            <span style={{ color: '#e2e8f0', fontWeight: 800, fontSize: '16px' }}>PKR {Number(ldcp).toLocaleString()}</span>
            <span style={{ color: '#64748b', fontSize: '10px', display: 'block', marginTop: '2px' }}>Open: PKR {Number(open).toLocaleString()}</span>
          </div>

          <div>
            <span style={{ color: '#94a3b8', fontSize: '11px', display: 'block', fontWeight: 600 }}>Day High / Low</span>
            <span style={{ color: '#10b981', fontWeight: 800, fontSize: '15px' }}>{Number(high).toLocaleString()}</span>
            <span style={{ color: '#f43f5e', fontSize: '12px', fontWeight: 700, display: 'block' }}>{Number(low).toLocaleString()}</span>
          </div>

          <div>
            <span style={{ color: '#94a3b8', fontSize: '11px', display: 'block', fontWeight: 600 }}>24H Total Volume</span>
            <span style={{ color: '#fbbf24', fontWeight: 800, fontSize: '16px' }}>{Number(volume).toLocaleString()}</span>
            <span style={{ color: '#64748b', fontSize: '10px', display: 'block', marginTop: '2px' }}>Shares Traded</span>
          </div>

          <div>
            <span style={{ color: '#94a3b8', fontSize: '11px', display: 'block', fontWeight: 600 }}>P/E & P/B Multiples</span>
            <span style={{ color: '#06b6d4', fontWeight: 800, fontSize: '16px' }}>
              {stock.pe_ratio > 0 ? `${stock.pe_ratio}x` : <span style={{ color: '#64748b', fontSize: '12px' }}>N/A</span>}
            </span>
            <span style={{ color: '#64748b', fontSize: '11px', display: 'block', marginTop: '2px' }}>P/B: {stock.pb_ratio > 0 ? `${stock.pb_ratio}x` : 'N/A'}</span>
          </div>

          <div>
            <span style={{ color: '#94a3b8', fontSize: '11px', display: 'block', fontWeight: 600 }}>Dividend & ROE</span>
            <span style={{ color: '#34d399', fontWeight: 800, fontSize: '16px' }}>{stock.dividend_yield >= 0 ? `${stock.dividend_yield}%` : 'N/A'}</span>
            <span style={{ color: '#64748b', fontSize: '11px', display: 'block', marginTop: '2px' }}>ROE: {stock.roe > 0 ? `${stock.roe}%` : 'N/A'}</span>
          </div>

          <div>
            <span style={{ color: '#94a3b8', fontSize: '11px', display: 'block', fontWeight: 600 }}>Algorithm Score</span>
            <span style={{ color: '#ffffff', fontWeight: 900, fontSize: '20px' }}>{algo?.compositeScore || 80} <span style={{ fontSize: '11px', color: '#64748b' }}>/100</span></span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '9px', fontWeight: 800, padding: '2px 7px', borderRadius: '9999px', border: `1px solid ${flag.color}`, color: flag.color, background: '#0f172a', marginTop: '2px' }}>
              <span>{flag.icon}</span> {flag.tier}
            </span>
          </div>

        </div>

        {/* Range Gauges */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginTop: '16px' }}>
          
          {/* Day Range Bar */}
          <div style={{ background: '#090d16', padding: '12px 16px', borderRadius: '12px', border: '1px solid #1e293b' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8', marginBottom: '6px' }}>
              <span>Day Low: <b style={{ color: '#f43f5e' }}>{Number(low).toLocaleString()}</b></span>
              <span style={{ fontWeight: 700, color: '#e2e8f0' }}>Intraday Range</span>
              <span>Day High: <b style={{ color: '#10b981' }}>{Number(high).toLocaleString()}</b></span>
            </div>
            <div style={{ position: 'relative', width: '100%', height: '8px', background: '#334155', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${dayRangePos}%`, height: '100%', background: 'linear-gradient(to right, #f43f5e, #10b981)', borderRadius: '4px' }} />
            </div>
          </div>

          {/* 52-Week Range Bar */}
          <div style={{ background: '#090d16', padding: '12px 16px', borderRadius: '12px', border: '1px solid #1e293b' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8', marginBottom: '6px' }}>
              <span>52W Low: <b style={{ color: '#f43f5e' }}>{Number(low52).toLocaleString()}</b></span>
              <span style={{ fontWeight: 700, color: '#e2e8f0' }}>52-Week Range ({yearRangePos}%)</span>
              <span>52W High: <b style={{ color: '#10b981' }}>{Number(high52).toLocaleString()}</b></span>
            </div>
            <div style={{ position: 'relative', width: '100%', height: '8px', background: '#334155', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${yearRangePos}%`, height: '100%', background: 'linear-gradient(to right, #6366f1, #06b6d4, #10b981)', borderRadius: '4px' }} />
            </div>
          </div>

        </div>

        {/* ⚠️ Penny Stock Warning Banner */}
        {algo?.isPennyStock && (
          <div style={{
            marginTop: '16px',
            background: 'rgba(249, 115, 22, 0.1)',
            border: '1px solid rgba(249, 115, 22, 0.4)',
            borderRadius: '12px',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px'
          }}>
            <ShieldAlert style={{ width: '20px', height: '20px', color: '#f97316', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#fb923c', marginBottom: '4px' }}>
                ⚠️ High Volatility Speculative Asset — Price below PKR 5.00
              </div>
              <p style={{ fontSize: '12px', color: '#fdba74', margin: 0, lineHeight: 1.5 }}>
                This stock is classified as a <b>Penny Stock</b> (PKR {price.toFixed(2)} per share). PSX penny stocks are prone to extreme intraday price swings, circuit breaker halts, and thin exit liquidity.
                Algorithmic score has been capped at <b>65/100</b> regardless of volume. <b>Risk only capital you can afford to lose entirely.</b>
              </p>
            </div>
          </div>
        )}

      </div>
      )} {/* end of ternary: ACTIVE hero panel vs DelistedBanner */}

      {/* ================================================================
          3. TRADE STRATEGY, CAPITAL ALLOCATION & CUSTOM RISK CALCULATOR
      ================================================================ */}
      <div style={{ background: '#0f172a', padding: '20px 24px', borderRadius: '20px', border: '1px solid #1e293b' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', paddingBottom: '12px', borderBottom: '1px solid #1e293b', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Target style={{ width: '16px', height: '16px', color: '#6366f1' }} />
            <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
              Trade Strategy & Risk-Reward Allocation
            </h3>
            {algo?.isPennyStock && (
              <span style={{ fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '9999px', background: 'rgba(249,115,22,0.15)', color: '#fb923c', border: '1px solid rgba(249,115,22,0.4)' }}>
                ⚠️ SPECULATIVE
              </span>
            )}
          </div>

          {/* Calculator Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={() => {
                setIsCustomMode(!isCustomMode);
                if (!isCustomMode) {
                  setCustomTarget(String(activeTargetPrice));
                  setCustomStopLoss(String(activeStopLoss));
                }
              }}
              style={{
                background: isCustomMode ? 'rgba(99,102,241,0.2)' : '#1e293b',
                border: isCustomMode ? '1px solid rgba(99,102,241,0.5)' : '1px solid #334155',
                color: isCustomMode ? '#a5b4fc' : '#94a3b8',
                padding: '4px 10px', borderRadius: '8px', cursor: 'pointer',
                fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px'
              }}
            >
              <Calculator style={{ width: '13px', height: '13px' }} />
              {isCustomMode ? 'Using Custom Risk Targets' : 'Custom Target Calculator'}
            </button>

            {isCustomMode && (
              <button
                onClick={() => {
                  setCustomTarget('');
                  setCustomStopLoss('');
                  setIsCustomMode(false);
                }}
                style={{
                  background: '#1e293b', border: '1px solid #334155', color: '#f87171',
                  padding: '4px 8px', borderRadius: '8px', cursor: 'pointer', fontSize: '11px', fontWeight: 700
                }}
              >
                Reset Auto
              </button>
            )}
          </div>
        </div>

        {/* Custom Input Drawer */}
        {isCustomMode && (
          <div style={{ display: 'flex', gap: '14px', marginBottom: '16px', background: 'rgba(99,102,241,0.06)', border: '1px dashed rgba(99,102,241,0.3)', padding: '12px 16px', borderRadius: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#a5b4fc' }}>Custom Target (PKR):</label>
              <input
                type="number"
                value={customTarget}
                onChange={e => setCustomTarget(e.target.value)}
                style={{ background: '#1e293b', border: '1px solid #334155', color: '#ffffff', padding: '5px 10px', borderRadius: '7px', fontSize: '12px', fontWeight: 700, width: '110px', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#fca5a5' }}>Custom Stop-Loss (PKR):</label>
              <input
                type="number"
                value={customStopLoss}
                onChange={e => setCustomStopLoss(e.target.value)}
                style={{ background: '#1e293b', border: '1px solid #334155', color: '#ffffff', padding: '5px 10px', borderRadius: '7px', fontSize: '12px', fontWeight: 700, width: '110px', outline: 'none' }}
              />
            </div>

            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
              Recalculating Risk/Reward & Position allocation live...
            </span>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px' }}>
          
          {/* Target Price */}
          <div style={{ background: 'rgba(99, 102, 241, 0.08)', padding: '14px 16px', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <TrendingUp style={{ width: '13px', height: '13px', color: '#818cf8' }} />
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Resistance Target</span>
            </div>
            <div style={{ fontSize: '20px', fontWeight: 900, color: '#a5b4fc' }}>
              PKR {Number(activeTargetPrice).toLocaleString()}
            </div>
            <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 700, marginTop: '3px' }}>
              +{dynamicUpsidePct}% Upside
            </div>
          </div>

          {/* Stop-Loss */}
          <div style={{ background: 'rgba(239, 68, 68, 0.08)', padding: '14px 16px', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <ShieldAlert style={{ width: '13px', height: '13px', color: '#f87171' }} />
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Stop-Loss Level</span>
            </div>
            <div style={{ fontSize: '20px', fontWeight: 900, color: '#fca5a5' }}>
              PKR {Number(activeStopLoss).toLocaleString()}
            </div>
            <div style={{ fontSize: '11px', color: '#f43f5e', fontWeight: 700, marginTop: '3px' }}>
              -{dynamicDownsidePct}% Max Downside
            </div>
          </div>

          {/* Risk/Reward Ratio */}
          <div style={{ background: 'rgba(6, 182, 212, 0.08)', padding: '14px 16px', borderRadius: '12px', border: '1px solid rgba(6, 182, 212, 0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <Gauge style={{ width: '13px', height: '13px', color: '#22d3ee' }} />
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Risk / Reward</span>
            </div>
            <div style={{ fontSize: '20px', fontWeight: 900, color: (dynamicRR >= 2.0) ? '#10b981' : (dynamicRR >= 1.2) ? '#fbbf24' : '#f87171' }}>
              {dynamicRR >= 1 ? dynamicRR : '< 1'}:1
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, marginTop: '3px' }}>
              {dynamicRR >= 2.0 ? '🚀 High Conviction' : dynamicRR >= 1.2 ? '⚖️ Moderate Setup' : '❌ Wait for Pullback'}
            </div>
          </div>

          {/* Portfolio Allocation */}
          <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '14px 16px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <Wallet style={{ width: '13px', height: '13px', color: '#34d399' }} />
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Portfolio Sizing</span>
            </div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#6ee7b7', lineHeight: 1.3 }}>
              {algo?.tradeStrategy?.allocation || '—'}
            </div>
          </div>

          {/* Time Horizon */}
          <div style={{ background: 'rgba(245, 158, 11, 0.08)', padding: '14px 16px', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <Clock style={{ width: '13px', height: '13px', color: '#fbbf24' }} />
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Time Horizon</span>
            </div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#fde68a', lineHeight: 1.3 }}>
              {algo?.tradeStrategy?.horizon || '—'}
            </div>
          </div>

        </div>
      </div>

      {/* ================================================================
          4. 3-POINT VERDICT BOX
      ================================================================ */}
      <div style={{ background: '#0f172a', borderRadius: '20px', border: '1px solid #1e293b', overflow: 'hidden' }}>
        
        {/* Header */}
        <div style={{ padding: '16px 22px', borderBottom: '1px solid #1e293b', background: 'rgba(99,102,241,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers style={{ width: '16px', height: '16px', color: '#818cf8' }} />
            <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff', margin: 0 }}>3-Point Investment Verdict</h3>
          </div>
          {algo?.strategyLabel && (
            <span style={{ fontSize: '10px', fontWeight: 700, color: '#818cf8', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', padding: '3px 9px', borderRadius: '9999px' }}>
              {algo.strategyLabel}
            </span>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 0 }}>

          {/* 🟢 Why Buy */}
          <div style={{ padding: '18px 20px', borderRight: '1px solid #1e293b', borderBottom: '1px solid #1e293b' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '12px' }}>
              <CheckCircle style={{ width: '15px', height: '15px', color: '#10b981' }} />
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.05em' }}>🟢 Why Buy?</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(algo?.verdict?.whyBuy || algo?.pros || []).map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '7px' }}>
                  <CheckCircle2 style={{ width: '13px', height: '13px', color: '#34d399', flexShrink: 0, marginTop: '2px' }} />
                  <p style={{ fontSize: '12px', color: '#d1fae5', margin: 0, lineHeight: 1.45 }}>{item}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 🟡 Neutral */}
          <div style={{ padding: '18px 20px', borderRight: '1px solid #1e293b', borderBottom: '1px solid #1e293b' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '12px' }}>
              <HelpCircle style={{ width: '15px', height: '15px', color: '#f59e0b' }} />
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>🟡 Neutral Points</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(algo?.verdict?.neutral || []).map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '7px' }}>
                  <Info style={{ width: '13px', height: '13px', color: '#fbbf24', flexShrink: 0, marginTop: '2px' }} />
                  <p style={{ fontSize: '12px', color: '#fef3c7', margin: 0, lineHeight: 1.45 }}>{item}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 🔴 Why Avoid */}
          <div style={{ padding: '18px 20px', borderBottom: '1px solid #1e293b' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '12px' }}>
              <AlertTriangle style={{ width: '15px', height: '15px', color: '#ef4444' }} />
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.05em' }}>🔴 Why Avoid / Risks?</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(algo?.verdict?.whyAvoid || algo?.cons || []).map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '7px' }}>
                  <AlertTriangle style={{ width: '13px', height: '13px', color: '#f87171', flexShrink: 0, marginTop: '2px' }} />
                  <p style={{ fontSize: '12px', color: '#fee2e2', margin: 0, lineHeight: 1.45 }}>{item}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ⚡ What Would Change This Rating? */}
          <div style={{ padding: '18px 20px', gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '12px' }}>
              <Zap style={{ width: '15px', height: '15px', color: '#818cf8' }} />
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>⚡ What Would Change This Rating?</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {(algo?.verdict?.catalysts || []).map((item, i) => (
                <div key={i} style={{
                  background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
                  borderRadius: '10px', padding: '8px 12px',
                  display: 'flex', alignItems: 'flex-start', gap: '7px',
                  flex: '1 1 260px'
                }}>
                  <ArrowUpRight style={{ width: '13px', height: '13px', color: '#818cf8', flexShrink: 0, marginTop: '2px' }} />
                  <p style={{ fontSize: '12px', color: '#c7d2fe', margin: 0, lineHeight: 1.45 }}>{item}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ================================================================
          5. MACRO & GEMINI AI SENTIMENT INDICATOR
      ================================================================ */}
      {macroSentiment && (
        <div style={{ background: '#0f172a', padding: '20px 24px', borderRadius: '20px', border: '1px solid #1e293b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px', paddingBottom: '12px', borderBottom: '1px solid #1e293b' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Globe style={{ width: '16px', height: '16px', color: '#38bdf8' }} />
              <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                Macro & Market Sentiment Indicator
              </h3>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: macroSentiment.sentimentColor, background: macroSentiment.sentimentBg, padding: '3px 10px', borderRadius: '9999px', border: `1px solid ${macroSentiment.sentimentColor}44` }}>
                {macroSentiment.sentimentIcon} {macroSentiment.sentimentLabel} ({macroSentiment.sentimentScore}/100)
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
            {macroSentiment.macroFactors.map((fac, i) => (
              <div key={i} style={{ background: '#090d16', padding: '12px 14px', borderRadius: '10px', border: '1px solid #1e293b' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8', marginBottom: '4px' }}>
                  {fac.title}
                </div>
                <p style={{ fontSize: '12px', color: '#cbd5e1', margin: 0, lineHeight: 1.45 }}>
                  {fac.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================================================================
          6. SECTOR PEER COMPARISON MATRIX
      ================================================================ */}
      <PeerComparison
        selectedStock={stock}
        allStocks={stocks}
        onSelectStock={onSelectStock}
      />

      {/* ================================================================
          7. 6-MONTH CHART & ALGORITHMIC SUB-SCORE BREAKDOWN
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
                    <stop offset="5%" stopColor={flag.color} stopOpacity={0.4}/>
                    <stop offset="95%" stopColor={flag.color} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '10px', color: '#fff', fontSize: '12px' }}
                  formatter={(val) => [`PKR ${val}`, 'Price']}
                />
                <Area type="monotone" dataKey="price" stroke={flag.color} strokeWidth={2.5} fillOpacity={1} fill="url(#priceGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Algorithmic Sub-Score Gauges */}
        <div style={{ background: '#0f172a', padding: '20px', borderRadius: '18px', border: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '10px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '7px', margin: 0 }}>
              <BarChart3 style={{ width: '15px', height: '15px', color: '#6366f1' }} />
              Algorithmic Sub-Scores
            </h3>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8' }}>Score / 100</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {subScoresList.map((sub) => {
              const Icon = sub.icon;
              return (
                <div key={sub.name} style={{ background: '#090d16', padding: '10px 12px', borderRadius: '10px', border: '1px solid #1e293b' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                      <Icon style={{ width: '14px', height: '14px', color: sub.color }} />
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#cbd5e1' }}>{sub.name}</span>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 900, color: '#ffffff', background: '#1e293b', padding: '2px 7px', borderRadius: '5px', border: '1px solid #334155' }}>
                      {sub.score}/100
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '7px', background: '#334155', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${sub.score}%`, background: sub.barColor, borderRadius: '3px', transition: 'width 0.5s ease' }} />
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
