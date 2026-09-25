-- =================================================================
-- StockIQ Supabase Schema (UUID Standardized & RLS Policies)
-- =================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Re-runnable setup; existing application data is preserved.

-- 1. Companies Table (PSX Stocks)
CREATE TABLE IF NOT EXISTS public.companies (
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
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'DELISTED', 'SUSPENDED')),
    delisted_date DATE,
    delisting_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_companies_ticker ON public.companies(ticker);
CREATE INDEX IF NOT EXISTS idx_companies_sector ON public.companies(sector);
CREATE INDEX IF NOT EXISTS idx_companies_status ON public.companies(status);

ALTER TABLE public.companies
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    ADD COLUMN IF NOT EXISTS delisted_date DATE,
    ADD COLUMN IF NOT EXISTS delisting_reason TEXT;

-- 2. Live Prices Table (Real-time Market Figures)
CREATE TABLE IF NOT EXISTS public.live_prices (
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
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'DELISTED', 'SUSPENDED')),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.live_prices
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';
CREATE INDEX IF NOT EXISTS idx_live_prices_status ON public.live_prices(status);

-- Centralized server-updated cache consumed by the public React dashboard.
CREATE TABLE IF NOT EXISTS public.stocks (
    symbol VARCHAR(20) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    sector VARCHAR(100),
    price NUMERIC NOT NULL CHECK (price > 0),
    volume BIGINT NOT NULL CHECK (volume >= 0),
    change NUMERIC NOT NULL,
    previous_close NUMERIC,
    change_percent NUMERIC,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_stocks_updated_at ON public.stocks(updated_at DESC);

ALTER TABLE public.stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stocks REPLICA IDENTITY FULL;
DROP POLICY IF EXISTS "Public can read stock cache" ON public.stocks;
CREATE POLICY "Public can read stock cache" ON public.stocks
    FOR SELECT TO anon, authenticated USING (true);
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE public.stocks FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE public.stocks FROM authenticated;
GRANT SELECT ON TABLE public.stocks TO anon, authenticated;
GRANT ALL ON TABLE public.stocks TO service_role;

-- The lease avoids duplicate PSX fetches when many visitors trigger together.
CREATE TABLE IF NOT EXISTS public.psx_scrape_lock (
    lock_id BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (lock_id),
    locked_until TIMESTAMPTZ
);
INSERT INTO public.psx_scrape_lock (lock_id, locked_until)
VALUES (TRUE, NULL)
ON CONFLICT (lock_id) DO NOTHING;
REVOKE ALL ON TABLE public.psx_scrape_lock FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.psx_scrape_lock TO service_role;

CREATE OR REPLACE FUNCTION public.claim_psx_scrape()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_lock_until TIMESTAMPTZ;
    newest_stock_update TIMESTAMPTZ;
BEGIN
    SELECT locked_until INTO current_lock_until
    FROM public.psx_scrape_lock
    WHERE lock_id = TRUE
    FOR UPDATE;

    IF current_lock_until IS NOT NULL AND current_lock_until > NOW() THEN
        RETURN FALSE;
    END IF;

    SELECT MAX(updated_at) INTO newest_stock_update FROM public.stocks;
    IF newest_stock_update IS NOT NULL AND newest_stock_update > NOW() - INTERVAL '20 seconds' THEN
        RETURN FALSE;
    END IF;

    UPDATE public.psx_scrape_lock
    SET locked_until = NOW() + INTERVAL '60 seconds'
    WHERE lock_id = TRUE;
    RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.release_psx_scrape()
RETURNS VOID
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
    UPDATE public.psx_scrape_lock SET locked_until = NULL WHERE lock_id = TRUE;
$$;

REVOKE ALL ON FUNCTION public.claim_psx_scrape() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.release_psx_scrape() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_psx_scrape() TO service_role;
GRANT EXECUTE ON FUNCTION public.release_psx_scrape() TO service_role;

-- Seed the cache from existing market data without replacing fresher cache rows.
INSERT INTO public.stocks (symbol, name, sector, price, volume, change, previous_close, change_percent, updated_at)
SELECT lp.ticker, c.name, c.sector, lp.price, COALESCE(lp.volume, 0),
       COALESCE(lp.change, 0), lp.previous_close, lp.change_percent,
       COALESCE(lp.updated_at, NOW())
FROM public.live_prices AS lp
JOIN public.companies AS c ON c.ticker = lp.ticker
WHERE lp.price > 0 AND COALESCE(c.status, 'ACTIVE') = 'ACTIVE'
ON CONFLICT (symbol) DO NOTHING;

-- 3. Financial Data Table
CREATE TABLE IF NOT EXISTS public.financial_data (
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

CREATE INDEX IF NOT EXISTS idx_financial_company_year
    ON public.financial_data(company_id, fiscal_year DESC);

-- 4. Price Data Table (Historical Prices)
CREATE TABLE IF NOT EXISTS public.price_data (
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

CREATE INDEX IF NOT EXISTS idx_price_company_date ON public.price_data(company_id, date DESC);

-- 5. Calculated Stock Scores Table
CREATE TABLE IF NOT EXISTS public.stock_scores (
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

CREATE INDEX IF NOT EXISTS idx_scores_company_strategy_date
    ON public.stock_scores(company_id, strategy, calculation_date DESC);

-- 6. User Portfolios Table
CREATE TABLE IF NOT EXISTS public.portfolios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    initial_investment NUMERIC DEFAULT 0,
    current_value NUMERIC,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Holdings Table
CREATE TABLE IF NOT EXISTS public.holdings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID REFERENCES public.portfolios(id) ON DELETE CASCADE NOT NULL,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    ticker VARCHAR(10),
    shares NUMERIC NOT NULL,
    average_buy_price NUMERIC NOT NULL,
    purchase_date TIMESTAMPTZ,
    current_price NUMERIC,
    allocation_percentage NUMERIC,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. User Watchlists Table
CREATE TABLE IF NOT EXISTS public.watchlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) DEFAULT 'Default Watchlist',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Watchlist Items Table
CREATE TABLE IF NOT EXISTS public.watchlist_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    watchlist_id UUID REFERENCES public.watchlists(id) ON DELETE CASCADE NOT NULL,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    ticker VARCHAR(10),
    added_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.investment_thesis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    strategy VARCHAR(50),
    investment_horizon VARCHAR(50),
    target_price NUMERIC,
    risk_assessment TEXT,
    analysis_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.portfolios
    ADD COLUMN IF NOT EXISTS current_value NUMERIC,
    ADD COLUMN IF NOT EXISTS is_default BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.holdings
    ADD COLUMN IF NOT EXISTS purchase_date TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS current_price NUMERIC,
    ADD COLUMN IF NOT EXISTS allocation_percentage NUMERIC;

CREATE INDEX IF NOT EXISTS idx_portfolios_user ON public.portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_holdings_portfolio ON public.holdings(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_watchlists_user ON public.watchlists(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_items_watchlist ON public.watchlist_items(watchlist_id);
CREATE INDEX IF NOT EXISTS idx_thesis_user_created ON public.investment_thesis(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_thesis_company ON public.investment_thesis(company_id);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'companies_status_check') THEN
        ALTER TABLE public.companies ADD CONSTRAINT companies_status_check
            CHECK (status IN ('ACTIVE', 'DELISTED', 'SUSPENDED'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'live_prices_status_check') THEN
        ALTER TABLE public.live_prices ADD CONSTRAINT live_prices_status_check
            CHECK (status IN ('ACTIVE', 'DELISTED', 'SUSPENDED'));
    END IF;
END $$;

-- RLS POLICIES
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_thesis ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read and sync on companies" ON public.companies;
DROP POLICY IF EXISTS "Allow public read and sync on live_prices" ON public.live_prices;
DROP POLICY IF EXISTS "Allow public read on financial_data" ON public.financial_data;
DROP POLICY IF EXISTS "Allow public read on price_data" ON public.price_data;
DROP POLICY IF EXISTS "Allow public read on stock_scores" ON public.stock_scores;
DROP POLICY IF EXISTS "Market data is readable" ON public.companies;
DROP POLICY IF EXISTS "Market data is readable" ON public.live_prices;
DROP POLICY IF EXISTS "Market data is readable" ON public.financial_data;
DROP POLICY IF EXISTS "Market data is readable" ON public.price_data;
DROP POLICY IF EXISTS "Market data is readable" ON public.stock_scores;
CREATE POLICY "Market data is readable" ON public.companies FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Market data is readable" ON public.live_prices FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Market data is readable" ON public.financial_data FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Market data is readable" ON public.price_data FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Market data is readable" ON public.stock_scores FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Users can manage own portfolios" ON public.portfolios;
DROP POLICY IF EXISTS "Users can manage holdings in own portfolios" ON public.holdings;
DROP POLICY IF EXISTS "Users can manage own watchlists" ON public.watchlists;
DROP POLICY IF EXISTS "Users can manage items in own watchlists" ON public.watchlist_items;
DROP POLICY IF EXISTS "Users can manage own investment thesis" ON public.investment_thesis;
CREATE POLICY "Users can manage own portfolios" ON public.portfolios FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage holdings in own portfolios" ON public.holdings FOR ALL USING (
    EXISTS (SELECT 1 FROM public.portfolios WHERE portfolios.id = holdings.portfolio_id AND portfolios.user_id = auth.uid())
);

CREATE POLICY "Users can manage own watchlists" ON public.watchlists FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage items in own watchlists" ON public.watchlist_items FOR ALL USING (
    EXISTS (SELECT 1 FROM public.watchlists WHERE watchlists.id = watchlist_items.watchlist_id AND watchlists.user_id = auth.uid())
);
CREATE POLICY "Users can manage own investment thesis" ON public.investment_thesis
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Enable Realtime Replication for live_prices
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'live_prices'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.live_prices;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'stocks'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.stocks;
    END IF;
END $$;

-- SEED DATA
INSERT INTO public.companies (ticker, name, sector, market_cap, shares_outstanding, description)
VALUES 
    ('LUCK', 'Lucky Cement Limited', 'Cement', 142980000000, 323000000, 'Leading cement manufacturer in Pakistan with diversified international operations.'),
    ('ENGRO', 'Engro Corporation Limited', 'Fertilizer & Conglomerate', 279500000000, 576000000, 'Premier Pakistani conglomerate operating in fertilizers, petrochemicals, energy, and telecom infrastructure.'),
    ('SYS', 'Systems Limited', 'Technology', 120000000000, 290000000, 'Pakistan pioneer global technology service provider offering digital transformation solutions.'),
    ('OGDC', 'Oil & Gas Development Company Ltd', 'Oil & Gas Exploration', 540000000000, 4300000000, 'National oil and gas exploration flagship company of Pakistan.'),
    ('MARI', 'Mari Petroleum Company Limited', 'Oil & Gas Exploration', 460000000000, 133000000, 'High-yielding oil & gas discovery and development major operating key gas fields.'),
    ('HBL', 'Habib Bank Limited', 'Commercial Banks', 190000000000, 1466000000, 'Largest commercial bank in Pakistan providing retail and corporate banking nationwide.'),
    ('MEBL', 'Meezan Bank Limited', 'Islamic Banking', 310000000000, 1780000000, 'Pakistan premier Islamic commercial bank offering Shariah-compliant retail and investment solutions.')
ON CONFLICT (ticker) DO NOTHING;

INSERT INTO public.live_prices (ticker, price, previous_close, change, change_percent, volume, pe_ratio, pb_ratio, roe, dividend_yield)
VALUES 
    ('LUCK', 442.69, 438.50, 4.19, 0.95, 1420500, 6.8, 1.1, 18.5, 4.2),
    ('ENGRO', 485.38, 481.10, 4.28, 0.89, 2150000, 5.4, 0.95, 21.4, 12.8),
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

-- Preserve known delisted/suspended security states on every setup run.
UPDATE public.companies
SET status = 'DELISTED',
    delisted_date = '2024-01-01',
    delisting_reason = 'Amalgamated into Fauji Fertilizer Company Limited (FFCL) effective 2024.'
WHERE ticker = 'FFBL';

UPDATE public.companies
SET status = 'DELISTED',
    delisted_date = '2023-06-01',
    delisting_reason = 'Legacy PTCL share class removed from the active PSX board following restructuring.'
WHERE ticker IN ('PTCLA', 'PTCLB');

UPDATE public.companies
SET status = 'SUSPENDED',
    delisting_reason = 'Trading suspended pending completion of the KE privatisation transaction.'
WHERE ticker = 'KEL';

UPDATE public.live_prices
SET status = CASE
    WHEN ticker IN ('FFBL', 'PTCLA', 'PTCLB') THEN 'DELISTED'
    WHEN ticker = 'KEL' THEN 'SUSPENDED'
    ELSE status
END
WHERE ticker IN ('FFBL', 'PTCLA', 'PTCLB', 'KEL');