import React from 'react';
import { TrendingUp, Search, Bookmark, PieChart, Sparkles, User, LogOut, ShieldAlert, Globe } from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';

export function Navbar({ activeTab, setActiveTab, searchQuery, setSearchQuery, user, onOpenAuth, onLogout, onOpenAI }) {
  return (
    <header style={{ background: '#0f172a', borderBottom: '1px solid #1e293b', padding: '12px 24px', position: 'sticky', top: 0, zIndex: 40 }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        
        {/* Main Nav Bar Row */}
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          
          {/* Brand Logo & PSX Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(to top right, #10b981, #0d9488, #6366f1)', padding: '2px', flexShrink: 0 }}>
              <div style={{ width: '100%', height: '100%', background: '#030712', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp style={{ width: '20px', height: '20px', color: '#10b981', margin: 'auto' }} />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 800, fontSize: '20px', letterSpacing: '-0.025em', color: '#ffffff' }}>
                  Stock<span style={{ color: '#10b981' }}>IQ</span>
                </span>
                <span style={{ fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '9999px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)', textTransform: 'uppercase' }}>
                  PSX Live
                </span>
              </div>
              <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0, fontWeight: 500 }}>Pakistan Stock Intelligence</p>
            </div>
          </div>

          {/* Global Stock Search */}
          <div style={{ position: 'relative', minWidth: '260px', flex: '1 1 260px', maxWidth: '340px' }}>
            <Search style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#94a3b8', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Search symbol (LUCK, ENGRO, SYS)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '9px 16px 9px 40px', fontSize: '13px', color: '#ffffff', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {/* Navigation Actions & Supabase Auth */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setActiveTab('stocks')}
              style={{
                background: activeTab === 'stocks' ? 'rgba(16, 185, 129, 0.15)' : '#1e293b',
                border: activeTab === 'stocks' ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid #334155',
                color: activeTab === 'stocks' ? '#10b981' : '#cbd5e1',
                padding: '8px 14px',
                borderRadius: '10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                fontWeight: 700
              }}
            >
              <TrendingUp style={{ width: '16px', height: '16px' }} />
              Stocks
            </button>

            <button
              onClick={() => setActiveTab('portfolio')}
              style={{
                background: activeTab === 'portfolio' ? 'rgba(16, 185, 129, 0.15)' : '#1e293b',
                border: activeTab === 'portfolio' ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid #334155',
                color: activeTab === 'portfolio' ? '#10b981' : '#cbd5e1',
                padding: '8px 14px',
                borderRadius: '10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                fontWeight: 700
              }}
            >
              <PieChart style={{ width: '16px', height: '16px' }} />
              Portfolio
            </button>

            <button
              onClick={() => setActiveTab('watchlist')}
              style={{
                background: activeTab === 'watchlist' ? 'rgba(16, 185, 129, 0.15)' : '#1e293b',
                border: activeTab === 'watchlist' ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid #334155',
                color: activeTab === 'watchlist' ? '#10b981' : '#cbd5e1',
                padding: '8px 14px',
                borderRadius: '10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                fontWeight: 700
              }}
            >
              <Bookmark style={{ width: '16px', height: '16px' }} />
              Watchlist
            </button>

            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>{user.email?.split('@')[0]}</span>
                <button
                  onClick={onLogout}
                  style={{ background: '#1e293b', border: '1px solid #334155', color: '#f87171', padding: '8px 12px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 700 }}
                >
                  <LogOut style={{ width: '14px', height: '14px' }} /> Logout
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                style={{ background: '#1e293b', border: '1px solid #334155', color: '#e2e8f0', padding: '8px 14px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700 }}
              >
                <User style={{ width: '15px', height: '15px' }} /> Sign In
              </button>
            )}
          </div>

        </div>

        {/* Global Macro Sentiment Pulse Bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px',
          background: 'rgba(15, 23, 42, 0.6)', border: '1px solid #1e293b', padding: '6px 14px', borderRadius: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: '#e2e8f0' }}>
            <Globe style={{ width: '13px', height: '13px', color: '#38bdf8' }} />
            <span>🇵🇰 PSX Macro Sentiment:</span>
            <span style={{ color: '#10b981', fontWeight: 800 }}>🟢 Bullish (78/100)</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', color: '#94a3b8' }}>
            <span>SBP Policy Rate: <b style={{ color: '#34d399' }}>13.0% (Easing)</b></span>
            <span>Inflation: <b style={{ color: '#38bdf8' }}>6.8% YoY</b></span>
            <span>IMF EFF Program: <b style={{ color: '#a5b4fc' }}>Active & Stable</b></span>
          </div>
        </div>

      </div>
    </header>
  );
}
