"""Input validation utilities."""

from typing import List, Optional
import re
from src.config import settings
from src.utils.exceptions import ValidationException, InvalidStrategyError, TickerNotFoundError


class StockValidator:
    """Validators for stock-related inputs."""

    VALID_STRATEGIES = list(settings.STRATEGY_PRESETS.keys())
    VALID_EXCHANGES = ["PSX"]
    VALID_PERIODS = ["1d", "5d", "1mo", "3mo", "6mo", "1y", "2y", "5y", "10y", "max"]
    VALID_INTERVALS = ["1m", "5m", "15m", "30m", "60m", "1d", "1wk", "1mo"]
    VALID_INVESTMENT_HORIZONS = ["Short-term", "Medium-term", "Long-term"]
    VALID_RISK_TOLERANCES = ["Conservative", "Moderate", "Aggressive"]

    @staticmethod
    def validate_ticker(ticker: str) -> bool:
        """
        Validate ticker format.

        Args:
            ticker: Ticker symbol to validate

        Returns:
            True if valid, raises exception otherwise
        """
        if not ticker:
            raise ValidationException("Ticker cannot be empty")

        if not isinstance(ticker, str):
            raise ValidationException("Ticker must be a string")

        ticker = ticker.strip().upper()

        # Check if ticker exists in KSE-100 list
        if ticker not in settings.KSE100_TICKERS:
            raise TickerNotFoundError(ticker)

        return True

    @staticmethod
    def validate_strategy(strategy: str) -> bool:
        """
        Validate investment strategy.

        Args:
            strategy: Strategy name to validate

        Returns:
            True if valid, raises exception otherwise
        """
        if not strategy:
            raise ValidationException("Strategy cannot be empty")

        if strategy.lower() not in StockValidator.VALID_STRATEGIES:
            raise InvalidStrategyError(strategy)

        return True

    @staticmethod
    def validate_exchange(exchange: str) -> bool:
        """
        Validate exchange.

        Args:
            exchange: Exchange name to validate

        Returns:
            True if valid, raises exception otherwise
        """
        if exchange.upper() not in StockValidator.VALID_EXCHANGES:
            raise ValidationException(f"Invalid exchange: {exchange}")

        return True

    @staticmethod
    def validate_period(period: str) -> bool:
        """
        Validate time period.

        Args:
            period: Time period to validate

        Returns:
            True if valid, raises exception otherwise
        """
        if period not in StockValidator.VALID_PERIODS:
            raise ValidationException(f"Invalid period: {period}")

        return True

    @staticmethod
    def validate_tickers(tickers: List[str]) -> bool:
        """
        Validate list of tickers.

        Args:
            tickers: List of ticker symbols

        Returns:
            True if all valid, raises exception otherwise
        """
        if not isinstance(tickers, list):
            raise ValidationException("Tickers must be a list")

        if not tickers:
            raise ValidationException("Ticker list cannot be empty")

        for ticker in tickers:
            StockValidator.validate_ticker(ticker)

        return True

    @staticmethod
    def validate_numeric_range(
        value: float, min_val: float = 0, max_val: float = 100, name: str = "Value"
    ) -> bool:
        """
        Validate numeric value is within range.

        Args:
            value: Value to validate
            min_val: Minimum value
            max_val: Maximum value
            name: Name of the value for error message

        Returns:
            True if valid, raises exception otherwise
        """
        if not isinstance(value, (int, float)):
            raise ValidationException(f"{name} must be a number")

        if value < min_val or value > max_val:
            raise ValidationException(f"{name} must be between {min_val} and {max_val}")

        return True

    @staticmethod
    def validate_email(email: str) -> bool:
        """
        Validate email format.

        Args:
            email: Email address to validate

        Returns:
            True if valid, raises exception otherwise
        """
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(pattern, email):
            raise ValidationException(f"Invalid email format: {email}")

        return True


class DataValidator:
    """Validators for data structures."""

    @staticmethod
    def validate_financial_data(data: dict) -> bool:
        """
        Validate financial data dictionary.

        Args:
            data: Financial data to validate

        Returns:
            True if valid, raises exception otherwise
        """
        required_fields = [
            'company_id',
            'fiscal_year',
            'revenue',
            'net_income',
        ]

        for field in required_fields:
            if field not in data:
                raise ValidationException(f"Missing required field: {field}")

            if field == 'fiscal_year':
                if not isinstance(data[field], int):
                    raise ValidationException(f"{field} must be an integer")
            else:
                if not isinstance(data[field], (int, float)) and data[field] is not None:
                    raise ValidationException(f"{field} must be numeric")

        return True

    @staticmethod
    def validate_price_data(data: dict) -> bool:
        """
        Validate price data dictionary.

        Args:
            data: Price data to validate

        Returns:
            True if valid, raises exception otherwise
        """
        required_fields = ['company_id', 'date', 'close_price']

        for field in required_fields:
            if field not in data:
                raise ValidationException(f"Missing required field: {field}")

        if data.get('close_price') and data['close_price'] <= 0:
            raise ValidationException("Price must be greater than zero")

        return True


class PortfolioValidator:
    """Validators for portfolio-related inputs."""

    @staticmethod
    def validate_holding(data: dict) -> bool:
        """
        Validate holding data.

        Args:
            data: Holding data to validate

        Returns:
            True if valid, raises exception otherwise
        """
        required_fields = ['portfolio_id', 'company_id', 'quantity', 'average_cost']

        for field in required_fields:
            if field not in data:
                raise ValidationException(f"Missing required field: {field}")

        if data.get('quantity', 0) <= 0:
            raise ValidationException("Quantity must be greater than zero")

        if data.get('average_cost', 0) < 0:
            raise ValidationException("Average cost cannot be negative")

        return True

    @staticmethod
    def validate_allocation_percentages(allocations: dict) -> bool:
        """
        Validate portfolio allocation percentages.

        Args:
            allocations: Dictionary of ticker to allocation percentage

        Returns:
            True if valid, raises exception otherwise
        """
        total = sum(allocations.values())

        if abs(total - 100) > 0.01:  # Allow small floating point errors
            raise ValidationException(f"Allocations must sum to 100%, got {total}%")

        for ticker, allocation in allocations.items():
            if allocation < 0 or allocation > 100:
                raise ValidationException(
                    f"Allocation for {ticker} must be between 0 and 100%"
                )

        return True
