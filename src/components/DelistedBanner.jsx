import React from 'react';
import {
  ShieldOff, AlertOctagon, ArrowRight, Calendar, Info,
  TrendingDown, XCircle, Building2
} from 'lucide-react';

/**
 * DelistedBanner
 * Renders a full-width warning panel for delisted or suspended PSX securities.
 * All Buy / Trade action buttons must be hidden when this is shown.
 *
 * Props:
 *   ticker       {string}  — PSX ticker code
 *   delistInfo   {object}  — { name, status, delisted_date, reason, successor, successor_name }
 */
export function DelistedBanner({ ticker, delistInfo }) {
  if (!delistInfo) return null;

  const isDelisted  = delistInfo.status === 'DELISTED';
  const isSuspended = delistInfo.status === 'SUSPENDED';

  const accentColor  = isDelisted ? '#ef4444' : '#f97316';
  const accentBg     = isDelisted ? 'rgba(239,68,68,0.08)' : 'rgba(249,115,22,0.08)';
  const accentBorder = isDelisted ? 'rgba(239,68,68,0.30)' : 'rgba(249,115,22,0.30)';
  const badgeText    = isDelisted ? 'DELISTED SECURITY' : 'TRADING SUSPENDED';
  const Icon         = isDelisted ? XCircle : AlertOctagon;

  const formattedDate = delistInfo.delisted_date
    ? new Date(delistInfo.delisted_date).toLocaleDateString('en-PK', {
        year: 'numeric', month: 'long', day: 'numeric'
      })
    : null;

  return (
    <div style={{
      background: accentBg,
      border: `1px solid ${accentBorder}`,
      borderRadius: '20px',
      padding: '28px 32px',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
        <div style={{
          width: '48px', height: '48px', borderRadius: '14px',
          background: `${accentColor}18`,
          border: `1px solid ${accentColor}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0
        }}>
          <Icon style={{ width: '24px', height: '24px', color: accentColor }} />
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
            <span style={{
              fontSize: '11px', fontWeight: 900, letterSpacing: '0.10em',
              color: accentColor,
              background: `${accentColor}18`,
              border: `1px solid ${accentColor}44`,
              padding: '3px 10px', borderRadius: '9999px'
            }}>
              {badgeText}
            </span>
            <span style={{
              fontSize: '11px', fontWeight: 700, color: '#64748b',
              background: '#1e293b', border: '1px solid #334155',
              padding: '3px 10px', borderRadius: '9999px'
            }}>
              PSX · {ticker}
            </span>
          </div>

          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#f1f5f9', margin: 0 }}>
            {delistInfo.name || ticker}
          </h2>
        </div>

        {/* No-Trade Shield */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: '10px', padding: '8px 14px'
        }}>
          <ShieldOff style={{ width: '16px', height: '16px', color: '#f87171' }} />
          <span style={{ fontSize: '12px', fontWeight: 800, color: '#f87171' }}>
            Trading Disabled
          </span>
        </div>
      </div>

      {/* ── Status Cards Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>

        {/* Effective Date */}
        {formattedDate && (
          <div style={{
            background: '#0f172a', border: '1px solid #1e293b',
            borderRadius: '12px', padding: '14px 16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <Calendar style={{ width: '13px', height: '13px', color: '#64748b' }} />
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {isDelisted ? 'Delisted Date' : 'Suspended Since'}
              </span>
            </div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: '#e2e8f0' }}>
              {formattedDate}
            </div>
          </div>
        )}

        {/* Status */}
        <div style={{
          background: '#0f172a', border: '1px solid #1e293b',
          borderRadius: '12px', padding: '14px 16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <TrendingDown style={{ width: '13px', height: '13px', color: '#64748b' }} />
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Market Status
            </span>
          </div>
          <div style={{
            fontSize: '14px', fontWeight: 800,
            color: isDelisted ? '#f87171' : '#fb923c'
          }}>
            {isDelisted ? '🔴 No Longer Listed' : '🟠 Suspended'}
          </div>
        </div>

        {/* Successor (if any) */}
        {delistInfo.successor && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16,185,129,0.2)',
            borderRadius: '12px', padding: '14px 16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <ArrowRight style={{ width: '13px', height: '13px', color: '#10b981' }} />
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Succeeded By
              </span>
            </div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: '#34d399' }}>
              {delistInfo.successor}
              <span style={{ display: 'block', fontSize: '11px', color: '#94a3b8', fontWeight: 600, marginTop: '2px' }}>
                {delistInfo.successor_name}
              </span>
            </div>
          </div>
        )}

        {/* Exchange */}
        <div style={{
          background: '#0f172a', border: '1px solid #1e293b',
          borderRadius: '12px', padding: '14px 16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <Building2 style={{ width: '13px', height: '13px', color: '#64748b' }} />
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Exchange
            </span>
          </div>
          <div style={{ fontSize: '15px', fontWeight: 800, color: '#e2e8f0' }}>
            Pakistan Stock Exchange (PSX)
          </div>
        </div>

      </div>

      {/* ── Reason / Amalgamation Details ── */}
      <div style={{
        background: '#090d16', border: '1px solid #1e293b',
        borderRadius: '14px', padding: '16px 20px',
        display: 'flex', gap: '12px', alignItems: 'flex-start'
      }}>
        <Info style={{ width: '18px', height: '18px', color: '#64748b', flexShrink: 0, marginTop: '2px' }} />
        <div>
          <div style={{ fontSize: '12px', fontWeight: 800, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {isDelisted ? 'Corporate Action Details' : 'Suspension Notice'}
          </div>
          <p style={{ fontSize: '13px', color: '#cbd5e1', margin: 0, lineHeight: 1.6 }}>
            {delistInfo.reason}
          </p>
        </div>
      </div>

      {/* ── Disclaimer ── */}
      <div style={{
        fontSize: '11px', color: '#475569', lineHeight: 1.5,
        borderTop: '1px solid #1e293b', paddingTop: '12px'
      }}>
        ⚠️ <b style={{ color: '#64748b' }}>Disclaimer:</b> This security is classified as <b style={{ color: accentColor }}>{delistInfo.status}</b> and is not available for trading on the Pakistan Stock Exchange. StockIQ has automatically disabled all investment guidance, Buy signals, and trading flags for this ticker. Historical data is shown for reference only. Consult your broker or SECP for regulatory details.
      </div>

    </div>
  );
}
