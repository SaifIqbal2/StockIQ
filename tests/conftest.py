"""Pytest configuration and fixtures."""

import pytest
import sys
from loguru import logger


@pytest.fixture(scope="session", autouse=True)
def setup_logging():
    """Setup logging for tests."""
    logger.remove()
    logger.add(sys.stderr, level="INFO")


@pytest.fixture
def mock_financials():
    """Provide mock financial data."""
    return {
        'net_income': 1000000,
        'revenue': 10000000,
        'total_assets': 50000000,
        'total_equity': 20000000,
        'total_liabilities': 30000000,
        'current_assets': 10000000,
        'current_liabilities': 5000000,
        'operating_income': 2000000,
        'interest_expense': 200000,
        'cash': 2000000,
        'accounts_receivable': 1500000,
        'inventory': 2000000,
        'cost_of_goods_sold': 7000000,
        'dividend_per_share': 5,
        'operating_cash_flow': 1500000,
        'free_cash_flow': 1000000,
    }


@pytest.fixture
def mock_stock_data():
    """Provide mock stock data."""
    return {
        'ticker': 'TEST',
        'name': 'Test Company',
        'sector': 'Technology',
        'current_price': 100,
        'previous_close': 95,
        'volume': 1000000,
        'market_cap': 1000000000,
        'shares_outstanding': 10000000,
    }
