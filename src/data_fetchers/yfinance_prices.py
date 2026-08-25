"""Yahoo Finance data fetcher for PSX stocks."""

import yfinance as yf
import pandas as pd
from typing import Dict, Optional, List
from datetime import datetime, timedelta
from loguru import logger


class YFinancePriceFetcher:
    """Fetch price data from Yahoo Finance for PSX stocks."""

    def __init__(self):
        """Initialize price fetcher."""
        self.cache = {}
        self.yf_suffix = ".KA"  # Yahoo Finance PSX suffix

    def get_psx_ticker(self, ticker: str) -> str:
        """
        Convert PSX ticker to yFinance format.

        Args:
            ticker: PSX ticker symbol

        Returns:
            Yahoo Finance formatted ticker
        """
        if ticker.endswith(self.yf_suffix):
            return ticker
        return f"{ticker}{self.yf_suffix}"

    def get_current_price(self, ticker: str) -> Dict:
        """
        Get current price for a PSX stock.

        Args:
            ticker: Stock ticker symbol

        Returns:
            Dictionary with current price and OHLCV data
        """
        try:
            yf_ticker = self.get_psx_ticker(ticker)
            logger.info(f"Fetching current price for {ticker}")

            stock = yf.Ticker(yf_ticker)
            data = stock.history(period="1d")

            if data.empty:
                logger.warning(f"No data found for {ticker}")
                return {
                    'ticker': ticker,
                    'price': None,
                    'error': 'No data available',
                }

            latest = data.iloc[-1]
            price_data = {
                'ticker': ticker,
                'price': float(latest['Close']),
                'open': float(latest['Open']),
                'high': float(latest['High']),
                'low': float(latest['Low']),
                'volume': int(latest['Volume']),
                'timestamp': datetime.now().isoformat(),
            }

            logger.info(f"✓ Current price for {ticker}: {price_data['price']}")
            return price_data

        except Exception as e:
            logger.error(f"✗ Error fetching price for {ticker}: {str(e)}")
            return {
                'ticker': ticker,
                'price': None,
                'error': str(e),
            }

    def get_historical_prices(
        self, ticker: str, period: str = "5y", interval: str = "1d"
    ) -> Optional[pd.DataFrame]:
        """
        Get historical price data.

        Args:
            ticker: Stock ticker symbol
            period: Time period (e.g., "1y", "5y", "10y")
            interval: Data interval (e.g., "1d", "1wk", "1mo")

        Returns:
            DataFrame with historical prices or None
        """
        try:
            yf_ticker = self.get_psx_ticker(ticker)
            logger.info(f"Fetching {period} historical data for {ticker}")

            stock = yf.Ticker(yf_ticker)
            data = stock.history(period=period, interval=interval)

            if data.empty:
                logger.warning(f"No historical data found for {ticker}")
                return None

            logger.info(f"✓ Fetched {len(data)} records for {ticker}")
            return data

        except Exception as e:
            logger.error(f"✗ Error fetching historical data for {ticker}: {str(e)}")
            return None

    def get_company_info(self, ticker: str) -> Dict:
        """
        Get company information.

        Args:
            ticker: Stock ticker symbol

        Returns:
            Dictionary with company information
        """
        try:
            yf_ticker = self.get_psx_ticker(ticker)
            logger.info(f"Fetching company info for {ticker}")

            stock = yf.Ticker(yf_ticker)
            info = stock.info

            company_info = {
                'ticker': ticker,
                'name': info.get('longName', ticker),
                'sector': info.get('sector', ''),
                'industry': info.get('industry', ''),
                'website': info.get('website', ''),
                'market_cap': info.get('marketCap', 0),
                'shares_outstanding': info.get('sharesOutstanding', 0),
                'dividend_yield': info.get('dividendYield', 0),
                'trailing_pe': info.get('trailingPE', 0),
                'forward_pe': info.get('forwardPE', 0),
                'price_to_book': info.get('priceToBook', 0),
                'trailing_eps': info.get('trailingEps', 0),
                'beta': info.get('beta', 0),
                'fifty_two_week_high': info.get('fiftyTwoWeekHigh', 0),
                'fifty_two_week_low': info.get('fiftyTwoWeekLow', 0),
            }

            logger.info(f"✓ Fetched info for {ticker}")
            return company_info

        except Exception as e:
            logger.error(f"✗ Error fetching info for {ticker}: {str(e)}")
            return {'ticker': ticker, 'error': str(e)}

    def get_multiple_prices(self, tickers: List[str]) -> Dict:
        """
        Get prices for multiple tickers.

        Args:
            tickers: List of ticker symbols

        Returns:
            Dictionary with prices for each ticker
        """
        results = {}
        for ticker in tickers:
            results[ticker] = self.get_current_price(ticker)
        return results

    def get_price_change(self, ticker: str, period: str = "1d") -> Dict:
        """
        Get price change for a ticker over a period.

        Args:
            ticker: Stock ticker symbol
            period: Time period

        Returns:
            Dictionary with price change information
        """
        try:
            current = self.get_current_price(ticker)
            if not current.get('price'):
                return current

            # Get historical data for comparison
            historical = self.get_historical_prices(ticker, period=period)
            if historical is None or historical.empty:
                return current

            previous_close = float(historical.iloc[0]['Close'])
            current_price = current['price']

            price_change = current_price - previous_close
            percent_change = (price_change / previous_close * 100) if previous_close != 0 else 0

            return {
                'ticker': ticker,
                'current_price': current_price,
                'previous_close': previous_close,
                'price_change': price_change,
                'percent_change': percent_change,
                'timestamp': datetime.now().isoformat(),
            }

        except Exception as e:
            logger.error(f"✗ Error calculating price change for {ticker}: {str(e)}")
            return {'ticker': ticker, 'error': str(e)}

    def get_volatility(self, ticker: str, period: str = "1y") -> Dict:
        """
        Calculate price volatility.

        Args:
            ticker: Stock ticker symbol
            period: Time period for calculation

        Returns:
            Dictionary with volatility metrics
        """
        try:
            historical = self.get_historical_prices(ticker, period=period)
            if historical is None or historical.empty:
                return {'ticker': ticker, 'error': 'No data available'}

            # Calculate daily returns
            daily_returns = historical['Close'].pct_change().dropna()

            # Calculate volatility metrics
            volatility = daily_returns.std() * (252 ** 0.5)  # Annualized
            avg_return = daily_returns.mean() * 252  # Annualized

            return {
                'ticker': ticker,
                'volatility': float(volatility),
                'annualized_return': float(avg_return),
                'sharpe_ratio': float(avg_return / volatility) if volatility > 0 else 0,
                'max_drawdown': float((historical['Close'] / historical['Close'].cummax() - 1).min()),
            }

        except Exception as e:
            logger.error(f"✗ Error calculating volatility for {ticker}: {str(e)}")
            return {'ticker': ticker, 'error': str(e)}
