import React from 'react';
import { TrendingUp, Search, Bookmark, PieChart, Sparkles, User, LogOut, ShieldAlert } from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';

export function Navbar({ activeTab, setActiveTab, searchQuery, setSearchQuery, user, onOpenAuth, onLogout, onOpenAI }) {
  return (
    <header style={{ background: '#0f172a', borderBottom: '1px solid #1e293b', padding: '14px 24px', sticky: 'top', top: 0, zIndex: 40 }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        
        {/* Brand Logo & PSX Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(to top right, #10b981, #0d9488, #6366f1)', padding: '2px', flexShrink: 0 }}>
            <div style={{ width: '100%', height: '100%', background: '#030712', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyCenter: 'center' }}>
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
        <div style={{ position: 'relative', minWidth: '280px', flex: '1 1 280px', maxWidth: '360px' }}>
          <Search style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#94a3b8', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Search symbol (LUCK, ENGRO, SYS)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '10px 16px 10px 40px', fontSize: '14px', color: '#ffffff', outline: 'none', boxSizing: 'border-box' }}
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

          <button
            onClick={onOpenAI}
            style={{ background: 'linear-gradient(to right, #4f46e5, #7c3aed)', border: 'none', color: '#ffffff', padding: '9px 16px', borderRadius: '10px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)' }}
          >
            <Sparkles style={{ width: '16px', height: '16px', color: '#fde047' }} />
            AI Analyst
          </button>

          <div style={{ height: '24px', width: '1px', background: '#334155', margin: '0 4px' }} />

          {/* Supabase User Auth Button */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ padding: '6px 12px', borderRadius: '10px', background: '#1e293b', border: '1px solid #334155', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#cbd5e1' }}>
                <User style={{ width: '14px', height: '14px', color: '#10b981' }} />
                {user.email?.split('@')[0]}
              </div>
              <button
                onClick={onLogout}
                title="Logout"
                style={{ padding: '8px', borderRadius: '10px', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <LogOut style={{ width: '16px', height: '16px' }} />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              style={{ background: '#1e293b', border: '1px solid #334155', color: '#ffffff', padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
            >
              Sign In
            </button>
          )}
        </div>
      </div>

      {/* Supabase Status Banner if unconfigured */}
      {!isSupabaseConfigured && (
        <div style={{ marginTop: '10px', padding: '4px 12px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', color: '#fbbf24', fontSize: '12px', display: 'flex', alignItems: 'center', justifyCenter: 'center', gap: '8px', maxWidth: '1280px', margin: '10px auto 0 auto' }}>
          <ShieldAlert style={{ width: '14px', height: '14px', flexShrink: 0 }} />
          <span>Demo Mode (Supabase environment variables unconfigured. Local scoring engine active).</span>
        </div>
      )}
    </header>
  );
}
