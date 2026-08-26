import React, { useMemo, useState } from 'react';
import {
  SlidersHorizontal, X, ChevronDown, Wallet, Clock,
  TrendingUp, Layers, RotateCcw, Search, Percent, DollarSign, Award, Sliders
} from 'lucide-react';
import {
  HORIZON_OPTIONS, BUDGET_PRESETS, STRATEGY_OPTIONS,
  PE_OPTIONS, DIV_OPTIONS, ROE_OPTIONS,
  DEFAULT_FILTERS, extractSectors, calcBuyQty, applyFilters
} from '../services/filterEngine';

// ─── Reusable styled select ───────────────────────────────────────────────
function FilterSelect({ icon: Icon, value, onChange, options, id, minWidth = '165px' }) {
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      {Icon && (
        <Icon style={{
          position: 'absolute', left: '10px', width: '13px', height: '13px',
          color: '#64748b', pointerEvents: 'none', zIndex: 1
        }} />
      )}
      <select
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          background: '#1e293b',
          border: '1px solid #334155',
          color: '#e2e8f0',
          fontSize: '12px',
          fontWeight: 600,
          padding: Icon ? '7px 28px 7px 28px' : '7px 28px 7px 10px',
          borderRadius: '9px',
          cursor: 'pointer',
          outline: 'none',
          appearance: 'none',
          WebkitAppearance: 'none',
          minWidth: minWidth,
          transition: 'border-color 0.15s ease'
        }}
        onFocus={e => e.target.style.borderColor = '#6366f1'}
        onBlur={e => e.target.style.borderColor = '#334155'}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <ChevronDown style={{
        position: 'absolute', right: '8px', width: '12px', height: '12px',
        color: '#64748b', pointerEvents: 'none'
      }} />
    </div>
  );
}

// ─── Main StockFilterBar Component ───────────────────────────────────────
export function StockFilterBar({ allStocks = [], filters = DEFAULT_FILTERS, onFiltersChange, filteredCount }) {
  const [collapsed, setCollapsed] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const sectors = useMemo(() => extractSectors(allStocks), [allStocks]);
  const sectorOptions = [
    { value: 'all', label: 'All Sectors' },
    ...sectors.map(s => ({ value: s, label: s }))
  ];

  const isFiltered = (
    filters.horizon     !== 'all' ||
    filters.sector      !== 'all' ||
    filters.strategy    !== 'all' ||
    Boolean(filters.maxPE)        ||
    Boolean(filters.minDivYield)  ||
    Boolean(filters.minROE)       ||
    (filters.budget && Number(filters.budget) > 0)
  );

  function set(key, value) {
    onFiltersChange({ ...filters, [key]: value });
  }

  function resetAll() {
    onFiltersChange({ ...DEFAULT_FILTERS });
  }

  // Buy qty estimate for the selected budget vs average price
  const avgPrice = filteredCount > 0
    ? (allStocks
        .filter(s => Number(s.price) > 0)
        .slice(0, 10)
        .reduce((sum, s) => sum + Number(s.price), 0) / 10)
    : 0;

  const budgetBuyQty = filters.budget && Number(filters.budget) > 0
    ? calcBuyQty(avgPrice, filters.budget)
    : null;

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0d1a2d 0%, #0f1e35 100%)',
      border: '1px solid #1e3a5f',
      borderRadius: '16px',
      overflow: 'hidden',
      boxShadow: '0 4px 24px rgba(0,0,0,0.3)'
    }}>

      {/* ── Header Bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 18px',
        borderBottom: collapsed ? 'none' : '1px solid #1e293b',
        background: 'rgba(99, 102, 241, 0.06)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <SlidersHorizontal style={{ width: '15px', height: '15px', color: '#818cf8' }} />
          <span style={{ fontSize: '13px', fontWeight: 800, color: '#e2e8f0' }}>
            Advanced Stock Screener & Filter Engine
          </span>
          {isFiltered && (
            <span style={{
              fontSize: '10px', fontWeight: 800, padding: '2px 8px',
              borderRadius: '9999px', background: 'rgba(99,102,241,0.2)',
              color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.4)'
            }}>
              ACTIVE FILTERS
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Filtered count badge */}
          <span style={{
            fontSize: '12px', fontWeight: 700,
            color: isFiltered ? '#10b981' : '#64748b'
          }}>
            {filteredCount} {filteredCount === 1 ? 'stock' : 'stocks'} matched
          </span>

          {/* Toggle Advanced */}
          <button
            onClick={() => setShowAdvanced(a => !a)}
            style={{
              background: showAdvanced ? 'rgba(99,102,241,0.2)' : '#1e293b',
              border: showAdvanced ? '1px solid rgba(99,102,241,0.5)' : '1px solid #334155',
              color: showAdvanced ? '#a5b4fc' : '#94a3b8',
              padding: '4px 9px', borderRadius: '7px',
              cursor: 'pointer', fontSize: '11px', fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: '4px'
            }}
          >
            <Sliders style={{ width: '12px', height: '12px' }} />
            {showAdvanced ? 'Hide Ratios' : 'Granular Ratios'}
          </button>

          {isFiltered && (
            <button
              onClick={resetAll}
              title="Reset all filters"
              style={{
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                color: '#f87171', padding: '4px 10px', borderRadius: '8px',
                cursor: 'pointer', fontSize: '11px', fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: '4px'
              }}
            >
              <RotateCcw style={{ width: '11px', height: '11px' }} />
              Reset
            </button>
          )}

          <button
            onClick={() => setCollapsed(c => !c)}
            style={{
              background: '#1e293b', border: '1px solid #334155',
              color: '#94a3b8', padding: '4px 8px', borderRadius: '7px',
              cursor: 'pointer', fontSize: '11px', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: '4px'
            }}
          >
            <ChevronDown style={{
              width: '13px', height: '13px',
              transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease'
            }} />
            {collapsed ? 'Show' : 'Hide'}
          </button>
        </div>
      </div>

      {/* ── Filter Controls ── */}
      {!collapsed && (
        <div style={{ padding: '14px 18px' }}>
          
          {/* Primary Controls Row */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: '12px',
            alignItems: 'flex-end'
          }}>

            {/* 1. Time Horizon */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', paddingLeft: '2px' }}>
                Time Horizon
              </label>
              <FilterSelect
                id="filter-horizon"
                icon={Clock}
                value={filters.horizon}
                onChange={v => set('horizon', v)}
                options={HORIZON_OPTIONS}
              />
            </div>

            {/* 2. Investment Budget */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', paddingLeft: '2px' }}>
                Investment Budget (PKR)
              </label>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <div style={{ position: 'relative' }}>
                  <Wallet style={{
                    position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)',
                    width: '13px', height: '13px', color: '#64748b', pointerEvents: 'none'
                  }} />
                  <input
                    id="filter-budget"
                    type="number"
                    min="0"
                    placeholder="e.g. 100000"
                    value={filters.budget}
                    onChange={e => set('budget', e.target.value)}
                    style={{
                      background: '#1e293b', border: '1px solid #334155',
                      color: '#e2e8f0', fontSize: '12px', fontWeight: 600,
                      padding: '7px 10px 7px 28px', borderRadius: '9px',
                      outline: 'none', width: '115px',
                      transition: 'border-color 0.15s ease'
                    }}
                    onFocus={e => e.target.style.borderColor = '#6366f1'}
                    onBlur={e => e.target.style.borderColor = '#334155'}
                  />
                </div>

                <div style={{ display: 'flex', gap: '3px' }}>
                  {BUDGET_PRESETS.map(p => (
                    <button
                      key={p.value}
                      onClick={() => set('budget', String(p.value))}
                      style={{
                        background: Number(filters.budget) === p.value
                          ? 'rgba(99,102,241,0.25)' : '#1e293b',
                        border: Number(filters.budget) === p.value
                          ? '1px solid rgba(99,102,241,0.5)' : '1px solid #334155',
                        color: Number(filters.budget) === p.value ? '#a5b4fc' : '#94a3b8',
                        fontSize: '11px', fontWeight: 700,
                        padding: '5px 8px', borderRadius: '7px', cursor: 'pointer'
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {budgetBuyQty !== null && budgetBuyQty > 0 && (
                <div style={{ fontSize: '10px', color: '#10b981', fontWeight: 600, paddingLeft: '2px' }}>
                  ≈ {budgetBuyQty.toLocaleString()} shares buyable (avg PKR {avgPrice.toFixed(0)})
                </div>
              )}
            </div>

            {/* 3. Sector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', paddingLeft: '2px' }}>
                Sector / Industry
              </label>
              <FilterSelect
                id="filter-sector"
                icon={Layers}
                value={filters.sector}
                onChange={v => set('sector', v)}
                options={sectorOptions}
              />
            </div>

            {/* 4. Risk Strategy */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', paddingLeft: '2px' }}>
                Risk Strategy
              </label>
              <FilterSelect
                id="filter-strategy"
                icon={TrendingUp}
                value={filters.strategy}
                onChange={v => set('strategy', v)}
                options={STRATEGY_OPTIONS}
              />
            </div>

          </div>

          {/* Granular Ratios Drawer */}
          {showAdvanced && (
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: '12px',
              marginTop: '14px', paddingTop: '12px',
              borderTop: '1px dashed #1e3a5f',
              background: 'rgba(15, 23, 42, 0.5)',
              padding: '12px 14px', borderRadius: '10px'
            }}>
              
              {/* Max P/E */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '10px', fontWeight: 700, color: '#22d3ee', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Max P/E Valuation Limit
                </label>
                <FilterSelect
                  id="filter-pe"
                  icon={DollarSign}
                  value={filters.maxPE || ''}
                  onChange={v => set('maxPE', v)}
                  options={PE_OPTIONS}
                  minWidth="150px"
                />
              </div>

              {/* Min Dividend Yield */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '10px', fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Min Dividend Yield %
                </label>
                <FilterSelect
                  id="filter-div"
                  icon={Percent}
                  value={filters.minDivYield || ''}
                  onChange={v => set('minDivYield', v)}
                  options={DIV_OPTIONS}
                  minWidth="150px"
                />
              </div>

              {/* Min ROE */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '10px', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Min Return on Equity (ROE)
                </label>
                <FilterSelect
                  id="filter-roe"
                  icon={Award}
                  value={filters.minROE || ''}
                  onChange={v => set('minROE', v)}
                  options={ROE_OPTIONS}
                  minWidth="150px"
                />
              </div>

            </div>
          )}

          {/* Active Filter Chips Summary */}
          {isFiltered && (
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: '6px',
              marginTop: '12px', paddingTop: '10px',
              borderTop: '1px solid #1e293b'
            }}>
              <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, alignSelf: 'center' }}>Active Filters:</span>

              {filters.horizon !== 'all' && (
                <FilterChip
                  label={HORIZON_OPTIONS.find(o => o.value === filters.horizon)?.label}
                  onRemove={() => set('horizon', 'all')}
                  color="#818cf8"
                />
              )}
              {Number(filters.budget) > 0 && (
                <FilterChip
                  label={`Budget ≤ PKR ${Number(filters.budget).toLocaleString()}`}
                  onRemove={() => set('budget', '')}
                  color="#34d399"
                />
              )}
              {filters.sector !== 'all' && (
                <FilterChip
                  label={filters.sector}
                  onRemove={() => set('sector', 'all')}
                  color="#22d3ee"
                />
              )}
              {filters.strategy !== 'all' && (
                <FilterChip
                  label={STRATEGY_OPTIONS.find(o => o.value === filters.strategy)?.label}
                  onRemove={() => set('strategy', 'all')}
                  color="#fbbf24"
                />
              )}
              {filters.maxPE && (
                <FilterChip
                  label={`P/E < ${filters.maxPE}x`}
                  onRemove={() => set('maxPE', '')}
                  color="#22d3ee"
                />
              )}
              {filters.minDivYield && (
                <FilterChip
                  label={`Yield > ${filters.minDivYield}%`}
                  onRemove={() => set('minDivYield', '')}
                  color="#fbbf24"
                />
              )}
              {filters.minROE && (
                <FilterChip
                  label={`ROE > ${filters.minROE}%`}
                  onRemove={() => set('minROE', '')}
                  color="#34d399"
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FilterChip({ label, onRemove, color }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      background: `${color}18`, border: `1px solid ${color}44`,
      color: color, fontSize: '11px', fontWeight: 700,
      padding: '3px 8px', borderRadius: '9999px'
    }}>
      {label}
      <button
        onClick={onRemove}
        style={{
          background: 'none', border: 'none', color: color,
          cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center'
        }}
      >
        <X style={{ width: '11px', height: '11px' }} />
      </button>
    </div>
  );
}
