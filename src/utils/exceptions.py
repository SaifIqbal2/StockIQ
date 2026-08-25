"""Custom exception classes."""


class StockIQException(Exception):
    """Base exception for StockIQ application."""

    pass


class DatabaseException(StockIQException):
    """Database-related exceptions."""

    pass


class DataFetchException(StockIQException):
    """Data fetching exceptions."""

    pass


class ValidationException(StockIQException):
    """Input validation exceptions."""

    pass


class CacheException(StockIQException):
    """Cache-related exceptions."""

    pass


class APIException(StockIQException):
    """API-related exceptions."""

    pass


class TickerNotFoundError(StockIQException):
    """Raised when a ticker is not found."""

    def __init__(self, ticker: str):
        self.ticker = ticker
        super().__init__(f"Ticker '{ticker}' not found")


class InvalidStrategyError(ValidationException):
    """Raised when an invalid strategy is provided."""

    def __init__(self, strategy: str):
        self.strategy = strategy
        super().__init__(f"Invalid strategy: '{strategy}'")


class InsufficientDataError(DataFetchException):
    """Raised when insufficient data is available for calculations."""

    def __init__(self, message: str = "Insufficient data available"):
        super().__init__(message)


class TimeoutError(APIException):
    """Raised when an operation times out."""

    def __init__(self, operation: str):
        super().__init__(f"Operation '{operation}' timed out")


class RateLimitError(APIException):
    """Raised when rate limit is exceeded."""

    def __init__(self, message: str = "Rate limit exceeded"):
        super().__init__(message)
