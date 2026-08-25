"""Financial metrics calculations."""

from typing import Dict, Optional
from loguru import logger
from src.utils.helpers import NumericHelper


class FinancialMetrics:
    """Calculate financial metrics from raw financial data."""

    @staticmethod
    def calculate_profitability_metrics(financials: Dict) -> Dict[str, float]:
        """
        Calculate profitability metrics.

        Args:
            financials: Dictionary with financial data

        Returns:
            Dictionary with profitability metrics
        """
        metrics = {}

        # ROE (Return on Equity) = Net Income / Total Equity
        metrics['ROE'] = NumericHelper.safe_divide(
            financials.get('net_income', 0),
            financials.get('total_equity', 0)
        )

        # ROA (Return on Assets) = Net Income / Total Assets
        metrics['ROA'] = NumericHelper.safe_divide(
            financials.get('net_income', 0),
            financials.get('total_assets', 0)
        )

        # ROIC (Return on Invested Capital) = Net Income / (Total Assets - Current Liabilities)
        invested_capital = (
            financials.get('total_assets', 0) -
            financials.get('current_liabilities', 0)
        )
        metrics['ROIC'] = NumericHelper.safe_divide(
            financials.get('net_income', 0),
            invested_capital
        )

        # Net Profit Margin = Net Income / Revenue
        metrics['Net Margin'] = NumericHelper.safe_divide(
            financials.get('net_income', 0),
            financials.get('revenue', 0)
        )

        # Operating Profit Margin = Operating Income / Revenue
        metrics['Operating Margin'] = NumericHelper.safe_divide(
            financials.get('operating_income', 0),
            financials.get('revenue', 0)
        )

        # Gross Profit Margin = (Revenue - COGS) / Revenue
        gross_profit = (
            financials.get('revenue', 0) -
            financials.get('cost_of_goods_sold', 0)
        )
        metrics['Gross Margin'] = NumericHelper.safe_divide(
            gross_profit,
            financials.get('revenue', 0)
        )

        return metrics

    @staticmethod
    def calculate_valuation_metrics(
        financials: Dict, current_price: float, shares_outstanding: Optional[float] = None
    ) -> Dict[str, float]:
        """
        Calculate valuation metrics.

        Args:
            financials: Dictionary with financial data
            current_price: Current stock price
            shares_outstanding: Number of shares outstanding

        Returns:
            Dictionary with valuation metrics
        """
        metrics = {}

        if shares_outstanding and shares_outstanding > 0:
            eps = NumericHelper.safe_divide(
                financials.get('net_income', 0),
                shares_outstanding
            )
            book_value_per_share = NumericHelper.safe_divide(
                financials.get('total_equity', 0),
                shares_outstanding
            )
        else:
            eps = financials.get('earnings_per_share', 0)
            book_value_per_share = financials.get('book_value_per_share', 0)

        # P/E Ratio
        metrics['P/E Ratio'] = NumericHelper.safe_divide(current_price, eps)

        # P/B Ratio (Price to Book)
        metrics['P/B Ratio'] = NumericHelper.safe_divide(current_price, book_value_per_share)

        # EV/EBITDA = Market Cap / (EBIT + Depreciation)
        # Simplified version using net income
        if shares_outstanding:
            market_cap = current_price * shares_outstanding
        else:
            market_cap = 0

        ebitda = (
            financials.get('operating_income', 0) +
            financials.get('interest_expense', 0)
        )
        metrics['EV/EBITDA'] = NumericHelper.safe_divide(market_cap, ebitda)

        # Price to Sales = Market Cap / Revenue
        metrics['Price/Sales'] = NumericHelper.safe_divide(market_cap, financials.get('revenue', 0))

        return metrics

    @staticmethod
    def calculate_liquidity_metrics(financials: Dict) -> Dict[str, float]:
        """
        Calculate liquidity metrics.

        Args:
            financials: Dictionary with financial data

        Returns:
            Dictionary with liquidity metrics
        """
        metrics = {}

        # Current Ratio = Current Assets / Current Liabilities
        metrics['Current Ratio'] = NumericHelper.safe_divide(
            financials.get('current_assets', 0),
            financials.get('current_liabilities', 0)
        )

        # Quick Ratio = (Current Assets - Inventory) / Current Liabilities
        quick_assets = (
            financials.get('current_assets', 0) -
            financials.get('inventory', 0)
        )
        metrics['Quick Ratio'] = NumericHelper.safe_divide(
            quick_assets,
            financials.get('current_liabilities', 0)
        )

        # Cash Ratio = Cash / Current Liabilities
        metrics['Cash Ratio'] = NumericHelper.safe_divide(
            financials.get('cash', 0),
            financials.get('current_liabilities', 0)
        )

        # Working Capital = Current Assets - Current Liabilities
        metrics['Working Capital'] = (
            financials.get('current_assets', 0) -
            financials.get('current_liabilities', 0)
        )

        return metrics

    @staticmethod
    def calculate_solvency_metrics(financials: Dict) -> Dict[str, float]:
        """
        Calculate solvency metrics.

        Args:
            financials: Dictionary with financial data

        Returns:
            Dictionary with solvency metrics
        """
        metrics = {}

        # Debt to Equity Ratio = Total Liabilities / Total Equity
        metrics['Debt/Equity'] = NumericHelper.safe_divide(
            financials.get('total_liabilities', 0),
            financials.get('total_equity', 0)
        )

        # Interest Coverage Ratio = EBIT / Interest Expense
        metrics['Interest Coverage'] = NumericHelper.safe_divide(
            financials.get('operating_income', 0),
            financials.get('interest_expense', 0)
        )

        # Debt to Assets Ratio = Total Liabilities / Total Assets
        metrics['Debt/Assets'] = NumericHelper.safe_divide(
            financials.get('total_liabilities', 0),
            financials.get('total_assets', 0)
        )

        # Equity Ratio = Total Equity / Total Assets
        metrics['Equity Ratio'] = NumericHelper.safe_divide(
            financials.get('total_equity', 0),
            financials.get('total_assets', 0)
        )

        return metrics

    @staticmethod
    def calculate_efficiency_metrics(financials: Dict) -> Dict[str, float]:
        """
        Calculate efficiency metrics.

        Args:
            financials: Dictionary with financial data

        Returns:
            Dictionary with efficiency metrics
        """
        metrics = {}

        # Asset Turnover = Revenue / Average Total Assets
        metrics['Asset Turnover'] = NumericHelper.safe_divide(
            financials.get('revenue', 0),
            financials.get('total_assets', 0)
        )

        # Receivables Turnover = Revenue / Accounts Receivable
        metrics['Receivables Turnover'] = NumericHelper.safe_divide(
            financials.get('revenue', 0),
            financials.get('accounts_receivable', 0)
        )

        # Inventory Turnover = COGS / Inventory
        metrics['Inventory Turnover'] = NumericHelper.safe_divide(
            financials.get('cost_of_goods_sold', 0),
            financials.get('inventory', 0)
        )

        # Days Sales Outstanding (DSO) = 365 / Receivables Turnover
        dso_turnover = metrics['Receivables Turnover']
        metrics['DSO'] = NumericHelper.safe_divide(365, dso_turnover)

        return metrics

    @staticmethod
    def calculate_cash_flow_metrics(financials: Dict) -> Dict[str, float]:
        """
        Calculate cash flow metrics.

        Args:
            financials: Dictionary with financial data

        Returns:
            Dictionary with cash flow metrics
        """
        metrics = {}

        # Free Cash Flow = Operating Cash Flow - Capital Expenditures
        metrics['Free Cash Flow'] = financials.get('free_cash_flow', 0)

        # Operating Cash Flow
        metrics['Operating Cash Flow'] = financials.get('operating_cash_flow', 0)

        # Cash Flow to Net Income = Operating Cash Flow / Net Income
        metrics['CF to NI'] = NumericHelper.safe_divide(
            financials.get('operating_cash_flow', 0),
            financials.get('net_income', 0)
        )

        # Free Cash Flow to Revenue = Free Cash Flow / Revenue
        metrics['FCF to Revenue'] = NumericHelper.safe_divide(
            financials.get('free_cash_flow', 0),
            financials.get('revenue', 0)
        )

        return metrics

    @staticmethod
    def calculate_dividend_metrics(financials: Dict, shares_outstanding: Optional[float] = None) -> Dict[str, float]:
        """
        Calculate dividend metrics.

        Args:
            financials: Dictionary with financial data
            shares_outstanding: Number of shares outstanding

        Returns:
            Dictionary with dividend metrics
        """
        metrics = {}

        dividend_per_share = financials.get('dividend_per_share', 0)

        # Dividend Payout Ratio = Dividend / Net Income
        metrics['Payout Ratio'] = NumericHelper.safe_divide(
            dividend_per_share * (shares_outstanding or 1),
            financials.get('net_income', 0)
        )

        # Dividend per share
        metrics['Dividend Per Share'] = dividend_per_share

        return metrics

    @staticmethod
    def calculate_all_metrics(financials: Dict, current_price: float = 0,
                              shares_outstanding: Optional[float] = None) -> Dict[str, Dict[str, float]]:
        """
        Calculate all financial metrics.

        Args:
            financials: Dictionary with financial data
            current_price: Current stock price
            shares_outstanding: Number of shares outstanding

        Returns:
            Dictionary with all metric categories
        """
        logger.info("Calculating all financial metrics")

        all_metrics = {
            'profitability': FinancialMetrics.calculate_profitability_metrics(financials),
            'valuation': FinancialMetrics.calculate_valuation_metrics(
                financials, current_price, shares_outstanding
            ),
            'liquidity': FinancialMetrics.calculate_liquidity_metrics(financials),
            'solvency': FinancialMetrics.calculate_solvency_metrics(financials),
            'efficiency': FinancialMetrics.calculate_efficiency_metrics(financials),
            'cash_flow': FinancialMetrics.calculate_cash_flow_metrics(financials),
            'dividend': FinancialMetrics.calculate_dividend_metrics(financials, shares_outstanding),
        }

        logger.info(f"✓ Calculated {len(all_metrics)} metric categories")
        return all_metrics
