-- StockIQ Python backend schema (PostgreSQL / SQLAlchemy models)
-- Use this for the separate DATABASE_URL used by the Python backend.
-- Do not run alongside supabase_schema.sql in the same database: IDs and user
-- ownership differ (integer local users here vs Supabase Auth UUIDs there).

CREATE TABLE IF NOT EXISTS companies (
    id SERIAL PRIMARY KEY,
    ticker VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    sector VARCHAR(100),
    subsector VARCHAR(100),
    exchange VARCHAR(10),
    market_cap DOUBLE PRECISION,
    shares_outstanding DOUBLE PRECISION,
    listed_date TIMESTAMP WITHOUT TIME ZONE,
    description TEXT,
    website VARCHAR(255),
    is_active BOOLEAN,
    created_at TIMESTAMP WITHOUT TIME ZONE,
    updated_at TIMESTAMP WITHOUT TIME ZONE
);
CREATE INDEX IF NOT EXISTS ix_companies_id ON companies(id);
CREATE INDEX IF NOT EXISTS ix_companies_ticker ON companies(ticker);
CREATE INDEX IF NOT EXISTS ix_companies_sector ON companies(sector);
CREATE INDEX IF NOT EXISTS ix_companies_is_active ON companies(is_active);

CREATE TABLE IF NOT EXISTS financial_data (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id),
    fiscal_year INTEGER NOT NULL,
    fiscal_period VARCHAR(20),
    revenue DOUBLE PRECISION,
    cost_of_goods_sold DOUBLE PRECISION,
    gross_profit DOUBLE PRECISION,
    operating_expenses DOUBLE PRECISION,
    operating_income DOUBLE PRECISION,
    interest_expense DOUBLE PRECISION,
    tax_expense DOUBLE PRECISION,
    net_income DOUBLE PRECISION,
    total_assets DOUBLE PRECISION,
    current_assets DOUBLE PRECISION,
    cash DOUBLE PRECISION,
    accounts_receivable DOUBLE PRECISION,
    inventory DOUBLE PRECISION,
    total_liabilities DOUBLE PRECISION,
    current_liabilities DOUBLE PRECISION,
    long_term_debt DOUBLE PRECISION,
    total_equity DOUBLE PRECISION,
    operating_cash_flow DOUBLE PRECISION,
    investing_cash_flow DOUBLE PRECISION,
    financing_cash_flow DOUBLE PRECISION,
    free_cash_flow DOUBLE PRECISION,
    earnings_per_share DOUBLE PRECISION,
    book_value_per_share DOUBLE PRECISION,
    dividend_per_share DOUBLE PRECISION,
    metrics JSON,
    source VARCHAR(50),
    created_at TIMESTAMP WITHOUT TIME ZONE,
    updated_at TIMESTAMP WITHOUT TIME ZONE
);
CREATE INDEX IF NOT EXISTS ix_financial_data_id ON financial_data(id);
CREATE INDEX IF NOT EXISTS ix_financial_data_company_id ON financial_data(company_id);

CREATE TABLE IF NOT EXISTS price_data (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id),
    date TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    open_price DOUBLE PRECISION,
    high_price DOUBLE PRECISION,
    low_price DOUBLE PRECISION,
    close_price DOUBLE PRECISION,
    volume INTEGER,
    adjusted_close DOUBLE PRECISION,
    created_at TIMESTAMP WITHOUT TIME ZONE
);
CREATE INDEX IF NOT EXISTS ix_price_data_id ON price_data(id);
CREATE INDEX IF NOT EXISTS ix_price_data_company_id ON price_data(company_id);
CREATE INDEX IF NOT EXISTS ix_price_data_date ON price_data(date);

CREATE TABLE IF NOT EXISTS stock_scores (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id),
    strategy VARCHAR(20),
    profitability_score DOUBLE PRECISION,
    valuation_score DOUBLE PRECISION,
    liquidity_score DOUBLE PRECISION,
    solvency_score DOUBLE PRECISION,
    growth_score DOUBLE PRECISION,
    efficiency_score DOUBLE PRECISION,
    quality_score DOUBLE PRECISION,
    momentum_score DOUBLE PRECISION,
    dividend_score DOUBLE PRECISION,
    risk_score DOUBLE PRECISION,
    overall_score DOUBLE PRECISION,
    recommendation VARCHAR(20),
    scores JSON,
    calculation_date TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE
);
CREATE INDEX IF NOT EXISTS ix_stock_scores_id ON stock_scores(id);
CREATE INDEX IF NOT EXISTS ix_stock_scores_company_id ON stock_scores(company_id);
CREATE INDEX IF NOT EXISTS ix_stock_scores_strategy ON stock_scores(strategy);

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    is_active BOOLEAN,
    is_admin BOOLEAN,
    created_at TIMESTAMP WITHOUT TIME ZONE,
    updated_at TIMESTAMP WITHOUT TIME ZONE
);
CREATE INDEX IF NOT EXISTS ix_users_id ON users(id);
CREATE INDEX IF NOT EXISTS ix_users_username ON users(username);
CREATE INDEX IF NOT EXISTS ix_users_email ON users(email);
CREATE INDEX IF NOT EXISTS ix_users_is_active ON users(is_active);

CREATE TABLE IF NOT EXISTS portfolios (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    initial_investment DOUBLE PRECISION,
    current_value DOUBLE PRECISION,
    is_default BOOLEAN,
    created_at TIMESTAMP WITHOUT TIME ZONE,
    updated_at TIMESTAMP WITHOUT TIME ZONE
);
CREATE INDEX IF NOT EXISTS ix_portfolios_id ON portfolios(id);
CREATE INDEX IF NOT EXISTS ix_portfolios_user_id ON portfolios(user_id);

CREATE TABLE IF NOT EXISTS holdings (
    id SERIAL PRIMARY KEY,
    portfolio_id INTEGER NOT NULL REFERENCES portfolios(id),
    company_id INTEGER NOT NULL REFERENCES companies(id),
    quantity DOUBLE PRECISION NOT NULL,
    average_cost DOUBLE PRECISION NOT NULL,
    purchase_date TIMESTAMP WITHOUT TIME ZONE,
    current_price DOUBLE PRECISION,
    allocation_percentage DOUBLE PRECISION,
    created_at TIMESTAMP WITHOUT TIME ZONE,
    updated_at TIMESTAMP WITHOUT TIME ZONE
);
CREATE INDEX IF NOT EXISTS ix_holdings_id ON holdings(id);
CREATE INDEX IF NOT EXISTS ix_holdings_portfolio_id ON holdings(portfolio_id);
CREATE INDEX IF NOT EXISTS ix_holdings_company_id ON holdings(company_id);

CREATE TABLE IF NOT EXISTS watchlists (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    stock_tickers VARCHAR[] DEFAULT ARRAY[]::VARCHAR[],
    created_at TIMESTAMP WITHOUT TIME ZONE,
    updated_at TIMESTAMP WITHOUT TIME ZONE
);
CREATE INDEX IF NOT EXISTS ix_watchlists_id ON watchlists(id);
CREATE INDEX IF NOT EXISTS ix_watchlists_user_id ON watchlists(user_id);

CREATE TABLE IF NOT EXISTS investment_thesis (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    company_id INTEGER NOT NULL REFERENCES companies(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    strategy VARCHAR(50),
    investment_horizon VARCHAR(50),
    target_price DOUBLE PRECISION,
    risk_assessment TEXT,
    analysis_data JSON,
    is_public BOOLEAN,
    created_at TIMESTAMP WITHOUT TIME ZONE,
    updated_at TIMESTAMP WITHOUT TIME ZONE
);
CREATE INDEX IF NOT EXISTS ix_investment_thesis_id ON investment_thesis(id);
CREATE INDEX IF NOT EXISTS ix_investment_thesis_user_id ON investment_thesis(user_id);
CREATE INDEX IF NOT EXISTS ix_investment_thesis_company_id ON investment_thesis(company_id);
