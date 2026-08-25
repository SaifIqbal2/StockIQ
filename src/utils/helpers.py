"""Utility helper functions."""

from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import math
from loguru import logger


class DateTimeHelper:
    """DateTime utility functions."""

    @staticmethod
    def get_fiscal_year(date: datetime = None) -> int:
        """
        Get fiscal year for a date. Assumes calendar year.

        Args:
            date: Date to get fiscal year for (default: today)

        Returns:
            Fiscal year
        """
        if date is None:
            date = datetime.now()

        return date.year

    @staticmethod
    def get_fiscal_quarter(date: datetime = None) -> str:
        """
        Get fiscal quarter for a date.

        Args:
            date: Date to get quarter for (default: today)

        Returns:
            Quarter string (Q1, Q2, Q3, Q4)
        """
        if date is None:
            date = datetime.now()

        quarter = (date.month - 1) // 3 + 1
        return f"Q{quarter}"

    @staticmethod
    def get_time_period_string(days: int) -> str:
        """
        Convert days to human-readable period.

        Args:
            days: Number of days

        Returns:
            Period string
        """
        if days <= 1:
            return "1D"
        elif days <= 7:
            return "1W"
        elif days <= 30:
            return "1M"
        elif days <= 365:
            years = days // 365
            return f"{years}Y"
        else:
            years = days // 365
            return f"{years}Y"


class NumericHelper:
    """Numeric utility functions."""

    @staticmethod
    def format_currency(value: float, currency: str = "PKR", decimals: int = 2) -> str:
        """
        Format value as currency string.

        Args:
            value: Value to format
            currency: Currency code
            decimals: Decimal places

        Returns:
            Formatted currency string
        """
        if value is None:
            return f"{currency} 0.00"

        formatted = f"{value:,.{decimals}f}"
        return f"{currency} {formatted}"

    @staticmethod
    def format_percentage(value: float, decimals: int = 2) -> str:
        """
        Format value as percentage string.

        Args:
            value: Value to format (e.g., 0.25 for 25%)
            decimals: Decimal places

        Returns:
            Formatted percentage string
        """
        if value is None:
            return "0.00%"

        percent = value * 100
        return f"{percent:.{decimals}f}%"

    @staticmethod
    def format_large_number(value: float, decimals: int = 2) -> str:
        """
        Format large number with K, M, B suffix.

        Args:
            value: Value to format
            decimals: Decimal places

        Returns:
            Formatted string
        """
        if value is None:
            return "0"

        abs_value = abs(value)

        if abs_value >= 1_000_000_000:
            return f"{value / 1_000_000_000:.{decimals}f}B"
        elif abs_value >= 1_000_000:
            return f"{value / 1_000_000:.{decimals}f}M"
        elif abs_value >= 1_000:
            return f"{value / 1_000:.{decimals}f}K"
        else:
            return f"{value:.{decimals}f}"

    @staticmethod
    def round_to_nearest(value: float, nearest: float = 0.05) -> float:
        """
        Round value to nearest specified increment.

        Args:
            value: Value to round
            nearest: Round to nearest (e.g., 0.05 for nearest nickel)

        Returns:
            Rounded value
        """
        if nearest == 0:
            return value

        return round(value / nearest) * nearest

    @staticmethod
    def safe_divide(numerator: float, denominator: float, default: float = 0) -> float:
        """
        Safely divide two numbers, returning default if denominator is 0.

        Args:
            numerator: Numerator
            denominator: Denominator
            default: Default value if denominator is 0

        Returns:
            Result or default
        """
        if denominator == 0:
            return default

        return numerator / denominator

    @staticmethod
    def calculate_cagr(beginning_value: float, ending_value: float, years: int) -> float:
        """
        Calculate Compound Annual Growth Rate.

        Args:
            beginning_value: Starting value
            ending_value: Ending value
            years: Number of years

        Returns:
            CAGR as decimal (e.g., 0.15 for 15%)
        """
        if beginning_value <= 0 or years <= 0:
            return 0

        return (ending_value / beginning_value) ** (1 / years) - 1

    @staticmethod
    def calculate_return(initial: float, final: float) -> float:
        """
        Calculate simple return.

        Args:
            initial: Initial value
            final: Final value

        Returns:
            Return as decimal
        """
        if initial == 0:
            return 0

        return (final - initial) / initial

    @staticmethod
    def calculate_variance(values: List[float]) -> float:
        """
        Calculate variance.

        Args:
            values: List of values

        Returns:
            Variance
        """
        if not values or len(values) < 2:
            return 0

        mean = sum(values) / len(values)
        variance = sum((x - mean) ** 2 for x in values) / len(values)

        return variance

    @staticmethod
    def calculate_std_dev(values: List[float]) -> float:
        """
        Calculate standard deviation.

        Args:
            values: List of values

        Returns:
            Standard deviation
        """
        variance = NumericHelper.calculate_variance(values)
        return math.sqrt(variance)


class DataHelper:
    """Data manipulation utilities."""

    @staticmethod
    def normalize_dict_keys(data: dict, lowercase: bool = True) -> dict:
        """
        Normalize dictionary keys.

        Args:
            data: Dictionary to normalize
            lowercase: Convert keys to lowercase

        Returns:
            Dictionary with normalized keys
        """
        return {
            (key.lower() if lowercase else key): value
            for key, value in data.items()
        }

    @staticmethod
    def flatten_dict(data: dict, parent_key: str = '', sep: str = '_') -> dict:
        """
        Flatten nested dictionary.

        Args:
            data: Dictionary to flatten
            parent_key: Parent key prefix
            sep: Separator for nested keys

        Returns:
            Flattened dictionary
        """
        items = []
        for k, v in data.items():
            new_key = f"{parent_key}{sep}{k}" if parent_key else k
            if isinstance(v, dict):
                items.extend(DataHelper.flatten_dict(v, new_key, sep=sep).items())
            else:
                items.append((new_key, v))

        return dict(items)

    @staticmethod
    def merge_dicts(*dicts: dict) -> dict:
        """
        Merge multiple dictionaries.

        Args:
            dicts: Dictionaries to merge

        Returns:
            Merged dictionary
        """
        result = {}
        for d in dicts:
            result.update(d)

        return result

    @staticmethod
    def filter_dict(data: dict, keys: List[str]) -> dict:
        """
        Filter dictionary to only include specified keys.

        Args:
            data: Dictionary to filter
            keys: Keys to include

        Returns:
            Filtered dictionary
        """
        return {k: v for k, v in data.items() if k in keys}

    @staticmethod
    def exclude_dict(data: dict, keys: List[str]) -> dict:
        """
        Filter dictionary to exclude specified keys.

        Args:
            data: Dictionary to filter
            keys: Keys to exclude

        Returns:
            Filtered dictionary
        """
        return {k: v for k, v in data.items() if k not in keys}


class CacheHelper:
    """Cache utility functions."""

    @staticmethod
    def generate_cache_key(prefix: str, *args, **kwargs) -> str:
        """
        Generate cache key from prefix and arguments.

        Args:
            prefix: Key prefix
            args: Positional arguments
            kwargs: Keyword arguments

        Returns:
            Cache key string
        """
        parts = [prefix]

        # Add positional arguments
        for arg in args:
            parts.append(str(arg))

        # Add keyword arguments sorted for consistency
        for k in sorted(kwargs.keys()):
            parts.append(f"{k}={kwargs[k]}")

        return ":".join(parts)

    @staticmethod
    def is_cache_expired(cached_time: datetime, ttl_seconds: int) -> bool:
        """
        Check if cache is expired.

        Args:
            cached_time: Time when cache was created
            ttl_seconds: Time to live in seconds

        Returns:
            True if expired, False otherwise
        """
        expiry_time = cached_time + timedelta(seconds=ttl_seconds)
        return datetime.now() > expiry_time


class LoggingHelper:
    """Logging utility functions."""

    @staticmethod
    def log_dict(name: str, data: dict, level: str = "info"):
        """
        Log dictionary in readable format.

        Args:
            name: Name of dictionary
            data: Dictionary to log
            level: Log level (info, debug, warning, error)
        """
        log_func = getattr(logger, level)
        log_func(f"{name}:")
        for key, value in data.items():
            log_func(f"  {key}: {value}")

    @staticmethod
    def log_performance(func_name: str, execution_time: float):
        """
        Log function execution time.

        Args:
            func_name: Function name
            execution_time: Execution time in seconds
        """
        logger.debug(f"{func_name} executed in {execution_time:.3f}s")
