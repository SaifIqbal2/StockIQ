"""CRUD operations for database models."""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from datetime import datetime
from typing import List, Optional
from loguru import logger

from src.database.models import (
    Company,
    FinancialData,
    PriceData,
    StockScore,
    User,
    Portfolio,
    Holding,
    Watchlist,
    InvestmentThesis,
)


# ============================================================================
# Company Operations
# ============================================================================


async def create_company(session: AsyncSession, company_data: dict) -> Company:
    """Create a new company."""
    company = Company(**company_data)
    session.add(company)
    await session.commit()
    await session.refresh(company)
    logger.info(f"Created company: {company.ticker}")
    return company


async def get_company_by_ticker(session: AsyncSession, ticker: str) -> Optional[Company]:
    """Get company by ticker symbol."""
    result = await session.execute(select(Company).where(Company.ticker == ticker))
    return result.scalar_one_or_none()


async def get_company_by_id(session: AsyncSession, company_id: int) -> Optional[Company]:
    """Get company by ID."""
    result = await session.execute(select(Company).where(Company.id == company_id))
    return result.scalar_one_or_none()


async def get_all_companies(session: AsyncSession, skip: int = 0, limit: int = 100) -> List[Company]:
    """Get all active companies."""
    result = await session.execute(
        select(Company)
        .where(Company.is_active == True)
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()


async def update_company(session: AsyncSession, company_id: int, update_data: dict) -> Optional[Company]:
    """Update company information."""
    company = await get_company_by_id(session, company_id)
    if company:
        for key, value in update_data.items():
            setattr(company, key, value)
        company.updated_at = datetime.utcnow()
        await session.commit()
        await session.refresh(company)
        logger.info(f"Updated company: {company.ticker}")
    return company


# ============================================================================
# Financial Data Operations
# ============================================================================


async def create_financial_data(session: AsyncSession, financial_data: dict) -> FinancialData:
    """Create financial data record."""
    fin_data = FinancialData(**financial_data)
    session.add(fin_data)
    await session.commit()
    await session.refresh(fin_data)
    logger.info(f"Created financial data for company_id: {fin_data.company_id}")
    return fin_data


async def get_latest_financials(
    session: AsyncSession, company_id: int, fiscal_year: Optional[int] = None
) -> Optional[FinancialData]:
    """Get latest financial data for a company."""
    query = select(FinancialData).where(FinancialData.company_id == company_id)
    if fiscal_year:
        query = query.where(FinancialData.fiscal_year == fiscal_year)
    query = query.order_by(FinancialData.updated_at.desc()).limit(1)
    result = await session.execute(query)
    return result.scalar_one_or_none()


async def get_financial_history(
    session: AsyncSession, company_id: int, years: int = 5
) -> List[FinancialData]:
    """Get financial history for a company."""
    result = await session.execute(
        select(FinancialData)
        .where(FinancialData.company_id == company_id)
        .order_by(FinancialData.fiscal_year.desc())
        .limit(years)
    )
    return result.scalars().all()


# ============================================================================
# Price Data Operations
# ============================================================================


async def create_price_data(session: AsyncSession, price_data: dict) -> PriceData:
    """Create price data record."""
    price = PriceData(**price_data)
    session.add(price)
    await session.commit()
    await session.refresh(price)
    return price


async def get_latest_price(session: AsyncSession, company_id: int) -> Optional[PriceData]:
    """Get latest price for a company."""
    result = await session.execute(
        select(PriceData)
        .where(PriceData.company_id == company_id)
        .order_by(PriceData.date.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()


async def get_price_history(
    session: AsyncSession, company_id: int, days: int = 365
) -> List[PriceData]:
    """Get price history for a company."""
    result = await session.execute(
        select(PriceData)
        .where(PriceData.company_id == company_id)
        .order_by(PriceData.date.desc())
        .limit(days)
    )
    return result.scalars().all()


# ============================================================================
# Stock Score Operations
# ============================================================================


async def create_stock_score(session: AsyncSession, score_data: dict) -> StockScore:
    """Create stock score record."""
    score = StockScore(**score_data)
    session.add(score)
    await session.commit()
    await session.refresh(score)
    logger.info(f"Created score for company_id: {score.company_id}, strategy: {score.strategy}")
    return score


async def get_latest_score(
    session: AsyncSession, company_id: int, strategy: str
) -> Optional[StockScore]:
    """Get latest score for a company and strategy."""
    result = await session.execute(
        select(StockScore)
        .where(
            (StockScore.company_id == company_id)
            & (StockScore.strategy == strategy)
        )
        .order_by(StockScore.created_at.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()


async def get_all_scores(
    session: AsyncSession, company_id: int
) -> List[StockScore]:
    """Get all scores for a company."""
    result = await session.execute(
        select(StockScore)
        .where(StockScore.company_id == company_id)
        .order_by(StockScore.strategy)
    )
    return result.scalars().all()


# ============================================================================
# User Operations
# ============================================================================


async def create_user(session: AsyncSession, user_data: dict) -> User:
    """Create a new user."""
    user = User(**user_data)
    session.add(user)
    await session.commit()
    await session.refresh(user)
    logger.info(f"Created user: {user.username}")
    return user


async def get_user_by_username(session: AsyncSession, username: str) -> Optional[User]:
    """Get user by username."""
    result = await session.execute(select(User).where(User.username == username))
    return result.scalar_one_or_none()


async def get_user_by_email(session: AsyncSession, email: str) -> Optional[User]:
    """Get user by email."""
    result = await session.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


# ============================================================================
# Portfolio Operations
# ============================================================================


async def create_portfolio(session: AsyncSession, portfolio_data: dict) -> Portfolio:
    """Create a new portfolio."""
    portfolio = Portfolio(**portfolio_data)
    session.add(portfolio)
    await session.commit()
    await session.refresh(portfolio)
    logger.info(f"Created portfolio: {portfolio.name}")
    return portfolio


async def get_user_portfolios(session: AsyncSession, user_id: int) -> List[Portfolio]:
    """Get all portfolios for a user."""
    result = await session.execute(
        select(Portfolio).where(Portfolio.user_id == user_id)
    )
    return result.scalars().all()


# ============================================================================
# Watchlist Operations
# ============================================================================


async def create_watchlist(session: AsyncSession, watchlist_data: dict) -> Watchlist:
    """Create a new watchlist."""
    watchlist = Watchlist(**watchlist_data)
    session.add(watchlist)
    await session.commit()
    await session.refresh(watchlist)
    logger.info(f"Created watchlist: {watchlist.name}")
    return watchlist


async def add_to_watchlist(
    session: AsyncSession, watchlist_id: int, ticker: str
) -> Optional[Watchlist]:
    """Add a ticker to a watchlist."""
    watchlist = await session.get(Watchlist, watchlist_id)
    if watchlist:
        if ticker not in watchlist.stock_tickers:
            watchlist.stock_tickers.append(ticker)
            await session.commit()
            await session.refresh(watchlist)
    return watchlist


async def remove_from_watchlist(
    session: AsyncSession, watchlist_id: int, ticker: str
) -> Optional[Watchlist]:
    """Remove a ticker from a watchlist."""
    watchlist = await session.get(Watchlist, watchlist_id)
    if watchlist and ticker in watchlist.stock_tickers:
        watchlist.stock_tickers.remove(ticker)
        await session.commit()
        await session.refresh(watchlist)
    return watchlist


# ============================================================================
# Investment Thesis Operations
# ============================================================================


async def create_investment_thesis(
    session: AsyncSession, thesis_data: dict
) -> InvestmentThesis:
    """Create a new investment thesis."""
    thesis = InvestmentThesis(**thesis_data)
    session.add(thesis)
    await session.commit()
    await session.refresh(thesis)
    logger.info(f"Created thesis: {thesis.title}")
    return thesis


async def get_user_thesis_list(session: AsyncSession, user_id: int) -> List[InvestmentThesis]:
    """Get all thesis records for a user."""
    result = await session.execute(
        select(InvestmentThesis)
        .where(InvestmentThesis.user_id == user_id)
        .order_by(InvestmentThesis.created_at.desc())
    )
    return result.scalars().all()
