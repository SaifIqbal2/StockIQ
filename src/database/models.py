"""SQLAlchemy models for database."""

from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.dialects.postgresql import JSON, ARRAY
from sqlalchemy.orm import relationship
from datetime import datetime
from src.database.connection import Base


class Company(Base):
    """Company model for PSX stocks."""

    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String(10), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    sector = Column(String(100), index=True)
    subsector = Column(String(100))
    exchange = Column(String(10), default="PSX")
    market_cap = Column(Float)
    shares_outstanding = Column(Float)
    listed_date = Column(DateTime)
    description = Column(Text)
    website = Column(String(255))
    is_active = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    financials = relationship("FinancialData", back_populates="company")
    prices = relationship("PriceData", back_populates="company")
    scores = relationship("StockScore", back_populates="company")

    def __repr__(self):
        return f"<Company(ticker='{self.ticker}', name='{self.name}')>"


class FinancialData(Base):
    """Financial metrics for companies."""

    __tablename__ = "financial_data"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), index=True, nullable=False)
    fiscal_year = Column(Integer, nullable=False)
    fiscal_period = Column(String(20), default="FY")  # FY, Q1, Q2, Q3, Q4

    # Income Statement
    revenue = Column(Float)
    cost_of_goods_sold = Column(Float)
    gross_profit = Column(Float)
    operating_expenses = Column(Float)
    operating_income = Column(Float)
    interest_expense = Column(Float)
    tax_expense = Column(Float)
    net_income = Column(Float)

    # Balance Sheet
    total_assets = Column(Float)
    current_assets = Column(Float)
    cash = Column(Float)
    accounts_receivable = Column(Float)
    inventory = Column(Float)
    total_liabilities = Column(Float)
    current_liabilities = Column(Float)
    long_term_debt = Column(Float)
    total_equity = Column(Float)

    # Cash Flow
    operating_cash_flow = Column(Float)
    investing_cash_flow = Column(Float)
    financing_cash_flow = Column(Float)
    free_cash_flow = Column(Float)

    # Per Share
    earnings_per_share = Column(Float)
    book_value_per_share = Column(Float)
    dividend_per_share = Column(Float)

    # Additional metrics
    metrics = Column(JSON)  # Flexible storage for other metrics
    source = Column(String(50))  # e.g., "SECP", "yfinance", "manual"
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    company = relationship("Company", back_populates="financials")

    def __repr__(self):
        return f"<FinancialData(company_id={self.company_id}, fiscal_year={self.fiscal_year})>"


class PriceData(Base):
    """Historical price data."""

    __tablename__ = "price_data"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), index=True, nullable=False)
    date = Column(DateTime, index=True, nullable=False)
    open_price = Column(Float)
    high_price = Column(Float)
    low_price = Column(Float)
    close_price = Column(Float)
    volume = Column(Integer)
    adjusted_close = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    company = relationship("Company", back_populates="prices")

    def __repr__(self):
        return f"<PriceData(ticker='{self.company_id}', date='{self.date}')>"


class StockScore(Base):
    """Calculated stock scores."""

    __tablename__ = "stock_scores"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), index=True, nullable=False)
    strategy = Column(String(20), index=True)  # value, growth, quality, etc.

    # Category Scores (0-100)
    profitability_score = Column(Float)
    valuation_score = Column(Float)
    liquidity_score = Column(Float)
    solvency_score = Column(Float)
    growth_score = Column(Float)
    efficiency_score = Column(Float)
    quality_score = Column(Float)
    momentum_score = Column(Float)
    dividend_score = Column(Float)
    risk_score = Column(Float)

    # Overall Score
    overall_score = Column(Float)
    recommendation = Column(String(20))  # Buy, Hold, Sell, Neutral

    # Detailed scores
    scores = Column(JSON)  # Store all scores in JSON
    calculation_date = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    company = relationship("Company", back_populates="scores")

    def __repr__(self):
        return f"<StockScore(company_id={self.company_id}, strategy='{self.strategy}')>"


class User(Base):
    """User account model."""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255))
    is_active = Column(Boolean, default=True, index=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    portfolios = relationship("Portfolio", back_populates="user")
    watchlists = relationship("Watchlist", back_populates="user")

    def __repr__(self):
        return f"<User(username='{self.username}', email='{self.email}')>"


class Portfolio(Base):
    """User portfolio/holdings."""

    __tablename__ = "portfolios"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    initial_investment = Column(Float)
    current_value = Column(Float)
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="portfolios")
    holdings = relationship("Holding", back_populates="portfolio")

    def __repr__(self):
        return f"<Portfolio(user_id={self.user_id}, name='{self.name}')>"


class Holding(Base):
    """Individual stock holding in a portfolio."""

    __tablename__ = "holdings"

    id = Column(Integer, primary_key=True, index=True)
    portfolio_id = Column(Integer, ForeignKey("portfolios.id"), index=True, nullable=False)
    company_id = Column(Integer, ForeignKey("companies.id"), index=True, nullable=False)
    quantity = Column(Float, nullable=False)
    average_cost = Column(Float, nullable=False)
    purchase_date = Column(DateTime)
    current_price = Column(Float)
    allocation_percentage = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    portfolio = relationship("Portfolio", back_populates="holdings")

    def __repr__(self):
        return f"<Holding(portfolio_id={self.portfolio_id}, company_id={self.company_id})>"


class Watchlist(Base):
    """User watchlist."""

    __tablename__ = "watchlists"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    stock_tickers = Column(ARRAY(String), default=[])
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="watchlists")

    def __repr__(self):
        return f"<Watchlist(user_id={self.user_id}, name='{self.name}')>"


class InvestmentThesis(Base):
    """Saved investment thesis and analysis."""

    __tablename__ = "investment_thesis"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    company_id = Column(Integer, ForeignKey("companies.id"), index=True, nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    strategy = Column(String(50))
    investment_horizon = Column(String(50))  # Short-term, Medium-term, Long-term
    target_price = Column(Float)
    risk_assessment = Column(Text)
    analysis_data = Column(JSON)
    is_public = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<InvestmentThesis(id={self.id}, title='{self.title}')>"
