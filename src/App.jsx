import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { StockOverview } from './components/StockOverview';
import { PortfolioTracker } from './components/PortfolioTracker';
import { WatchlistManager } from './components/WatchlistManager';
import { AIAnalystModal } from './components/AIAnalystModal';
import { AuthModal } from './components/AuthModal';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { 
  fetchTopScoringStocks, 
  fetchUserWatchlist, 
  fetchUserPortfolio, 
  subscribeToLivePrices 
} from './services/dataService';
import { TrendingUp, ShieldCheck, Zap, BarChart2, Loader2 } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState('stocks');
  const [stocks, setStocks] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  
  // User Auth & State
  const [user, setUser] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);

  // User Portfolios & Watchlist
  const [watchlist, setWatchlist] = useState([]);
  const [holdings, setHoldings] = useState([]);

  // Load stocks and user data
  const loadData = async (currentUser) => {
    setLoading(true);
    try {
      const topStocks = await fetchTopScoringStocks();
      setStocks(topStocks);
      if (topStocks && topStocks.length > 0) {
        setSelectedStock(topStocks[0]);
      }

      const userWatch = await fetchUserWatchlist(currentUser?.id);
      setWatchlist(userWatch);

      const userPort = await fetchUserPortfolio(currentUser?.id);
      setHoldings(userPort);
    } catch (e) {
      console.error('Error loading PSX data:', e);
    } finally {
      setLoading(false);
    }
  };

  // Listen to Supabase Auth State
  useEffect(() => {
    loadData(null);

    if (!isSupabaseConfigured) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) loadData(u);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) loadData(u);
    });

    // Realtime Live Prices Subscription
    const unsubscribe = subscribeToLivePrices((updatedPrice) => {
      if (!updatedPrice || !updatedPrice.ticker) return;
      setStocks(prevStocks => 
        prevStocks.map(s => {
          if (s.ticker === updatedPrice.ticker) {
            return {
              ...s,
              price: Number(updatedPrice.price || s.price),
              change: Number(updatedPrice.change || s.change),
              changePercent: Number(updatedPrice.change_percent || s.changePercent)
            };
          }
          return s;
        })
      );
    });

    return () => {
      subscription.unsubscribe();
      unsubscribe();
    };
  }, []);

  // Filter stocks by search query
  const filteredStocks = stocks.filter(s => 
    s.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.sector.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddToWatchlist = (stock) => {
    if (!watchlist.find(w => w.ticker === stock.ticker)) {
      setWatchlist([...watchlist, stock]);
    }
    setActiveTab('watchlist');
  };

  const handleRemoveFromWatchlist = (ticker) => {
    setWatchlist(watchlist.filter(w => w.ticker !== ticker));
  };

  const handleAddHolding = (newHolding) => {
    setHoldings([...holdings, newHolding]);
  };

  const handleRemoveHolding = (id) => {
    setHoldings(holdings.filter(h => h.id !== id));
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#030712', color: '#f3f4f6', display: 'flex', flexDirection: 'column' }}>
      
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        user={user}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        onOpenAI={() => setIsAIOpen(true)}
      />

      {/* Hero Market Banner */}
      <div style={{ background: '#0f172a', borderBottom: '1px solid #1e293b', padding: '10px 24px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px', fontSize: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', color: '#94a3b8' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f3f4f6', fontWeight: 700 }}>
              <TrendingUp style={{ width: '14px', height: '14px', color: '#10b981' }} />
              KSE-100: <span style={{ color: '#10b981', fontWeight: 900 }}>78,450.20 (+1.25%)</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Zap style={{ width: '14px', height: '14px', color: '#fbbf24' }} />
              PSX Market Volume: 485.2M Shares
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck style={{ width: '14px', height: '14px', color: '#22d3ee' }} />
              Live Supabase DB Integration Active
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontWeight: 600 }}>
            <BarChart2 style={{ width: '14px', height: '14px', color: '#818cf8' }} />
            <span>10-Category Strategy Fit System</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main style={{ flex: 1, maxWidth: '1280px', width: '100%', margin: '0 auto', padding: '32px 24px', boxSizing: 'border-box' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 16px', gap: '16px', color: '#cbd5e1' }}>
            <Loader2 style={{ width: '36px', height: '36px', color: '#10b981', animation: 'spin 1s linear infinite' }} />
            <p style={{ fontSize: '15px', fontWeight: 700 }}>Connecting to Supabase & Fetching Real-Time PSX Data...</p>
          </div>
        ) : (
          <>
            {activeTab === 'stocks' && (
              <StockOverview
                stocks={filteredStocks}
                selectedStock={selectedStock}
                onSelectStock={setSelectedStock}
                onOpenAI={() => setIsAIOpen(true)}
                onAddToWatchlist={handleAddToWatchlist}
              />
            )}

            {activeTab === 'portfolio' && (
              <PortfolioTracker
                holdings={holdings}
                onAddHolding={handleAddHolding}
                onRemoveHolding={handleRemoveHolding}
                availableStocks={stocks}
              />
            )}

            {activeTab === 'watchlist' && (
              <WatchlistManager
                watchlist={watchlist}
                onRemoveFromWatchlist={handleRemoveFromWatchlist}
                onSelectStock={(stock) => {
                  setSelectedStock(stock);
                  setActiveTab('stocks');
                }}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #1e293b', background: '#090d16', padding: '24px', textAlign: 'center', fontSize: '12px', color: '#94a3b8' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            © 2026 <span style={{ color: '#10b981', fontWeight: 800 }}>StockIQ Pakistan</span>. Analytical Strategy Fitness Engine.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', fontWeight: 600 }}>
            <span style={{ cursor: 'pointer', color: '#cbd5e1' }}>Compliance Policy</span>
            <span style={{ cursor: 'pointer', color: '#cbd5e1' }}>SECP Terms</span>
            <span style={{ cursor: 'pointer', color: '#cbd5e1' }}>Privacy</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AIAnalystModal
        isOpen={isAIOpen}
        onClose={() => setIsAIOpen(false)}
        stock={selectedStock}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={(u) => setUser(u)}
      />

    </div>
  );
}
