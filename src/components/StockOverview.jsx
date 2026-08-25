import React from 'react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Sparkles, ShieldCheck, Activity, Award, 
  BarChart3, DollarSign, Layers, CheckCircle2, BookmarkPlus
} from 'lucide-react';
import { computeStockIQScore, getStrategyVerdict } from '../services/calculations';

export function StockOverview({ stocks, selectedStock, onSelectStock, onOpenAI, onAddToWatchlist }) {
  const stock = selectedStock || stocks[0];
  const scores = computeStockIQScore(stock);
  const verdictDetails = scores.verdictDetails || getStrategyVerdict(scores.overall);

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Top PSX Stock Selection Bar */}
      <div style={{ background: '#0f172a', padding: '20px', borderRadius: '16px', border: '1px solid #1e293b' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp style={{ width: '16px', height: '16px', color: '#10b981' }} />
            <h2 style={{ fontSize: '12px', fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
              Top Rated PSX Stocks Selector ({stocks.length})
            </h2>
          </div>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 12px', borderRadius: '9999px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            Real-Time Analytics
          </span>
        </div>

        {/* Stock Selector Cards Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
          {stocks.map((item) => {
            const itemScores = computeStockIQScore(item);
            const itemVerdict = getStrategyVerdict(itemScores.overall);
            const isSelected = item.ticker === stock.ticker;

            return (
              <div
                key={item.ticker}
                onClick={() => onSelectStock(item)}
                style={{
                  background: isSelected ? '#1e293b' : '#090d16',
                  border: isSelected ? '1px solid #10b981' : '1px solid #1e293b',
                  boxShadow: isSelected ? '0 0 15px rgba(16, 185, 129, 0.25)' : 'none',
                  borderRadius: '12px',
                  padding: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 800, color: '#ffffff', fontSize: '15px' }}>{item.ticker}</span>
                  <span style={{ fontSize: '12px', fontWeight: 900, color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '6px' }}>
                    {itemScores.overall}
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.name}
                </p>

                <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#e2e8f0' }}>
                    PKR {item.price.toLocaleString()}
                  </span>
                  <span style={{ fontSize: '9px', fontWeight: 800, padding: '2px 8px', borderRadius: '9999px', border: '1px solid', color: itemVerdict.hexColor, borderColor: itemVerdict.hexColor, background: 'rgba(15, 23, 42, 0.8)' }}>
                    {itemVerdict.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Stock Detail Layout Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        
        {/* Left Side: Stock Header, Metrics Grid & Price Chart */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Main Hero Card */}
          <div style={{ background: '#0f172a', padding: '24px', borderRadius: '20px', border: '1px solid #1e293b' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', paddingBottom: '16px', borderBottom: '1px solid #1e293b' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff', margin: 0 }}>{stock.name}</h1>
                  <span style={{ padding: '4px 10px', fontSize: '12px', fontWeight: 800, background: '#1e293b', color: '#10b981', borderRadius: '8px', border: '1px solid #334155' }}>
                    {stock.ticker}
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '6px', marginBottom: 0, maxWidth: '580px' }}>{stock.description}</p>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  onClick={() => onAddToWatchlist(stock)}
                  style={{ background: '#1e293b', border: '1px solid #334155', color: '#cbd5e1', padding: '8px 12px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  title="Save to Watchlist"
                >
                  <BookmarkPlus style={{ width: '18px', height: '18px' }} />
                </button>

                <button
                  onClick={() => onOpenAI(stock)}
                  style={{ background: 'linear-gradient(to right, #059669, #0d9488)', border: 'none', color: '#ffffff', padding: '10px 18px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)' }}
                >
                  <Sparkles style={{ width: '16px', height: '16px', color: '#fde047' }} />
                  AI Analyst
                </button>
              </div>
            </div>

            {/* Structured Stock Metric Grid Card */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '16px', background: '#1e293b', padding: '20px', borderRadius: '14px', border: '1px solid #334155', marginTop: '20px' }}>
              
              {/* Rating */}
              <div>
                <span style={{ color: '#94a3b8', fontSize: '12px', display: 'block', fontWeight: 600 }}>StockIQ Rating</span>
                <span style={{ color: '#ffffff', fontWeight: 900, fontSize: '24px' }}>{scores.overall} <span style={{ fontSize: '12px', color: '#64748b' }}>/100</span></span>
                <span style={{ display: 'inline-block', fontSize: '9px', fontWeight: 800, padding: '2px 8px', borderRadius: '9999px', border: '1px solid', color: verdictDetails.hexColor, borderColor: verdictDetails.hexColor, background: '#0f172a', marginTop: '4px' }}>
                  {verdictDetails.label}
                </span>
              </div>

              {/* Share Price */}
              <div>
                <span style={{ color: '#94a3b8', fontSize: '12px', display: 'block', fontWeight: 600 }}>Share Price</span>
                <span style={{ color: '#ffffff', fontWeight: 800, fontSize: '18px' }}>PKR {stock.price.toLocaleString()}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, color: stock.change >= 0 ? '#10b981' : '#f43f5e', marginTop: '2px' }}>
                  {stock.change >= 0 ? <TrendingUp style={{ width: '12px', height: '12px' }} /> : <TrendingDown style={{ width: '12px', height: '12px' }} />}
                  {stock.change >= 0 ? '+' : ''}{stock.change} ({stock.changePercent}%)
                </span>
              </div>

              {/* P/E Ratio */}
              <div>
                <span style={{ color: '#94a3b8', fontSize: '12px', display: 'block', fontWeight: 600 }}>P/E Ratio</span>
                <span style={{ color: '#06b6d4', fontWeight: 800, fontSize: '18px' }}>{stock.pe_ratio}x</span>
                <span style={{ color: '#64748b', fontSize: '11px', display: 'block', marginTop: '2px' }}>P/B: {stock.pb_ratio}x</span>
              </div>

              {/* Dividend Yield */}
              <div>
                <span style={{ color: '#94a3b8', fontSize: '12px', display: 'block', fontWeight: 600 }}>Dividend Yield</span>
                <span style={{ color: '#10b981', fontWeight: 800, fontSize: '18px' }}>{stock.dividend_yield}%</span>
                <span style={{ color: '#64748b', fontSize: '11px', display: 'block', marginTop: '2px' }}>ROE: {stock.roe}%</span>
              </div>

            </div>
          </div>

          {/* Interactive Historical Price Chart */}
          <div style={{ background: '#0f172a', padding: '24px', borderRadius: '20px', border: '1px solid #1e293b' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <Activity style={{ width: '16px', height: '16px', color: '#10b981' }} />
                6-Month Price Trend (PKR)
              </h3>
              <span style={{ fontSize: '12px', color: '#94a3b8', background: '#1e293b', padding: '4px 10px', borderRadius: '8px', border: '1px solid #334155' }}>
                PSX Market Data
              </span>
            </div>

            <div style={{ width: '100%', height: '240px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stock.priceHistory || []}>
                  <defs>
                    <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={verdictDetails.hexColor} stopOpacity={0.4}/>
                      <stop offset="95%" stopColor={verdictDetails.hexColor} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 12 }} domain={['auto', 'auto']} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                    formatter={(val) => [`PKR ${val}`, 'Price']}
                  />
                  <Area type="monotone" dataKey="price" stroke={verdictDetails.hexColor} strokeWidth={3} fillOpacity={1} fill="url(#priceGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Right Side: 10-Category Breakdown Gauges */}
        <div style={{ background: '#0f172a', padding: '24px', borderRadius: '20px', border: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '12px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <BarChart3 style={{ width: '16px', height: '16px', color: '#6366f1' }} />
              10-Category Breakdown
            </h3>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8' }}>Score / 100</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <div key={cat.name} style={{ background: '#090d16', padding: '12px 14px', borderRadius: '12px', border: '1px solid #1e293b' }}>
                  {/* Category Header Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Icon style={{ width: '16px', height: '16px', color: cat.color }} />
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#cbd5e1' }}>{cat.name}</span>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 900, color: '#ffffff', background: '#1e293b', padding: '2px 8px', borderRadius: '6px', border: '1px solid #334155' }}>
                      {cat.score}/100
                    </span>
                  </div>

                  {/* Horizontal Progress Gauge */}
                  <div style={{ width: '100%', height: '8px', background: '#334155', borderRadius: '4px', overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        height: '100%', 
                        width: `${cat.score}%`, 
                        background: cat.barColor, 
                        borderRadius: '4px',
                        transition: 'width 0.5s ease'
                      }}
                    />
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
