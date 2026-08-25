-- =================================================================
-- StockIQ Supabase Schema (UUID Standardized Fix)
-- =================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop conflicting old tables if needed to refresh types cleanly
DROP TABLE IF EXISTS public.watchlist_items CASCADE;
DROP TABLE IF EXISTS public.watchlists CASCADE;
DROP TABLE IF EXISTS public.holdings CASCADE;
DROP TABLE IF EXISTS public.portfolios CASCADE;
DROP TABLE IF EXISTS public.stock_scores CASCADE;
DROP TABLE IF EXISTS public.price_data CASCADE;
DROP TABLE IF EXISTS public.financial_data CASCADE;
DROP TABLE IF EXISTS public.live_prices CASCADE;
DROP TABLE IF EXISTS public.companies CASCADE;

-- 1. Companies Table (PSX Stocks)
CREATE TABLE public.companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticker VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    sector VARCHAR(100),
    subsector VARCHAR(100),
    exchange VARCHAR(10) DEFAULT 'PSX',
    market_cap NUMERIC,
    shares_outstanding NUMERIC,
    listed_date DATE,
    description TEXT,
    website VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_companies_ticker ON public.companies(ticker);
CREATE INDEX idx_companies_sector ON public.companies(sector);

-- 2. Live Prices Table (Real-time Market Figures)
CREATE TABLE public.live_prices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticker VARCHAR(10) UNIQUE NOT NULL,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    price NUMERIC NOT NULL,
    previous_close NUMERIC,
    change NUMERIC,
    change_percent NUMERIC,
    volume BIGINT,
    day_high NUMERIC,
    day_low NUMERIC,
    fifty_two_week_high NUMERIC,
    fifty_two_week_low NUMERIC,
    pe_ratio NUMERIC,
    pb_ratio NUMERIC,
    roe NUMERIC,
    dividend_yield NUMERIC,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Financial Data Table
CREATE TABLE public.financial_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    fiscal_year INT NOT NULL,
    fiscal_period VARCHAR(20) DEFAULT 'FY',
    
    revenue NUMERIC,
    cost_of_goods_sold NUMERIC,
    gross_profit NUMERIC,
    operating_expenses NUMERIC,
    operating_income NUMERIC,
    interest_expense NUMERIC,
    tax_expense NUMERIC,
    net_income NUMERIC,

    total_assets NUMERIC,
    current_assets NUMERIC,
    cash NUMERIC,
    accounts_receivable NUMERIC,
    inventory NUMERIC,
    total_liabilities NUMERIC,
    current_liabilities NUMERIC,
    long_term_debt NUMERIC,
    total_equity NUMERIC,

    operating_cash_flow NUMERIC,
    investing_cash_flow NUMERIC,
    financing_cash_flow NUMERIC,
    free_cash_flow NUMERIC,

    earnings_per_share NUMERIC,
    book_value_per_share NUMERIC,
    dividend_per_share NUMERIC,

    metrics JSONB DEFAULT '{}'::jsonb,
    source VARCHAR(50) DEFAULT 'PSX',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Price Data Table (Historical Prices)
CREATE TABLE public.price_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    open_price NUMERIC,
    high_price NUMERIC,
    low_price NUMERIC,
    close_price NUMERIC,
    volume BIGINT,
    adjusted_close NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_price_company_date ON public.price_data(company_id, date DESC);

-- 5. Calculated Stock Scores Table
CREATE TABLE public.stock_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    strategy VARCHAR(50) DEFAULT 'overall',
    
    profitability_score NUMERIC,
    valuation_score NUMERIC,
    liquidity_score NUMERIC,
    solvency_score NUMERIC,
    growth_score NUMERIC,
    efficiency_score NUMERIC,
    quality_score NUMERIC,
    momentum_score NUMERIC,
    dividend_score NUMERIC,
    risk_score NUMERIC,

    overall_score NUMERIC,
    recommendation VARCHAR(50),
    scores JSONB DEFAULT '{}'::jsonb,
    calculation_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. User Portfolios Table
CREATE TABLE public.portfolios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    initial_investment NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Holdings Table
CREATE TABLE public.holdings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID REFERENCES public.portfolios(id) ON DELETE CASCADE NOT NULL,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    ticker VARCHAR(10),
    shares NUMERIC NOT NULL,
    average_buy_price NUMERIC NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. User Watchlists Table
CREATE TABLE public.watchlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) DEFAULT 'Default Watchlist',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Watchlist Items Table
CREATE TABLE public.watchlist_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    watchlist_id UUID REFERENCES public.watchlists(id) ON DELETE CASCADE NOT NULL,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    ticker VARCHAR(10),
    added_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS POLICIES
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on companies" ON public.companies FOR SELECT USING (true);
CREATE POLICY "Allow public read on live_prices" ON public.live_prices FOR SELECT USING (true);
CREATE POLICY "Allow public read on financial_data" ON public.financial_data FOR SELECT USING (true);
CREATE POLICY "Allow public read on price_data" ON public.price_data FOR SELECT USING (true);
CREATE POLICY "Allow public read on stock_scores" ON public.stock_scores FOR SELECT USING (true);

ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own portfolios" ON public.portfolios FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage holdings in own portfolios" ON public.holdings FOR ALL USING (
    EXISTS (SELECT 1 FROM public.portfolios WHERE portfolios.id = holdings.portfolio_id AND portfolios.user_id = auth.uid())
);

CREATE POLICY "Users can manage own watchlists" ON public.watchlists FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage items in own watchlists" ON public.watchlist_items FOR ALL USING (
    EXISTS (SELECT 1 FROM public.watchlists WHERE watchlists.id = watchlist_items.watchlist_id AND watchlists.user_id = auth.uid())
);

-- Enable Realtime Replication for live_prices
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_prices;

-- SEED DATA
INSERT INTO public.companies (ticker, name, sector, market_cap, shares_outstanding, description)
VALUES 
    ('LUCK', 'Lucky Cement Limited', 'Cement', 215000000000, 323000000, 'Leading cement manufacturer in Pakistan with diversified international operations.'),
    ('ENGRO', 'Engro Corporation Limited', 'Fertilizer & Conglomerate', 185000000000, 576000000, 'Premier Pakistani conglomerate operating in fertilizers, petrochemicals, energy, and telecom infrastructure.'),
    ('SYS', 'Systems Limited', 'Technology', 120000000000, 290000000, 'Pakistan pioneer global technology service provider offering digital transformation solutions.'),
    ('OGDC', 'Oil & Gas Development Company Ltd', 'Oil & Gas Exploration', 540000000000, 4300000000, 'National oil and gas exploration flagship company of Pakistan.'),
    ('MARI', 'Mari Petroleum Company Limited', 'Oil & Gas Exploration', 460000000000, 133000000, 'High-yielding oil & gas discovery and development major operating key gas fields.'),
    ('HBL', 'Habib Bank Limited', 'Commercial Banks', 190000000000, 1466000000, 'Largest commercial bank in Pakistan providing retail and corporate banking nationwide.'),
    ('MEBL', 'Meezan Bank Limited', 'Islamic Banking', 310000000000, 1780000000, 'Pakistan premier Islamic commercial bank offering Shariah-compliant retail and investment solutions.')
ON CONFLICT (ticker) DO NOTHING;

INSERT INTO public.live_prices (ticker, price, previous_close, change, change_percent, volume, pe_ratio, pb_ratio, roe, dividend_yield)
VALUES 
    ('LUCK', 685.50, 673.10, 12.40, 1.84, 1420500, 6.8, 1.1, 18.5, 4.2),
    ('ENGRO', 340.20, 342.30, -2.10, -0.61, 2150000, 5.4, 0.95, 21.4, 12.8),
    ('SYS', 415.00, 396.50, 18.50, 4.67, 3890000, 14.2, 3.8, 28.6, 2.1),
    ('OGDC', 126.80, 125.65, 1.15, 0.92, 6450000, 3.2, 0.62, 22.8, 11.5),
    ('MARI', 2480.00, 2435.00, 45.00, 1.85, 280000, 4.8, 1.8, 42.1, 8.9),
    ('HBL', 118.40, 116.80, 1.60, 1.37, 2890000, 3.8, 0.58, 19.2, 10.2),
    ('MEBL', 225.60, 221.00, 4.60, 2.08, 4120000, 4.1, 1.65, 48.5, 9.8)
ON CONFLICT (ticker) DO UPDATE SET
    price = EXCLUDED.price,
    change = EXCLUDED.change,
    change_percent = EXCLUDED.change_percent,
    volume = EXCLUDED.volume,
    updated_at = NOW();