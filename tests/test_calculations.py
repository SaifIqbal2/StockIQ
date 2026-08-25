"""Tests for financial calculations."""

import pytest
from src.calculations.financial_metrics import FinancialMetrics
from src.calculations.scoring_engine import ScoringEngine
from src.calculations.pnl_calculator import PnLCalculator


class TestFinancialMetrics:
    """Test financial metrics calculations."""

    def test_calculate_profitability_metrics(self):
        """Test profitability metrics calculation."""
        financials = {
            'net_income': 1000,
            'total_equity': 5000,
            'total_assets': 10000,
            'revenue': 50000,
            'operating_income': 5000,
            'cost_of_goods_sold': 30000,
        }

        metrics = FinancialMetrics.calculate_profitability_metrics(financials)

        assert 'ROE' in metrics
        assert 'ROA' in metrics
        assert 'Net Margin' in metrics

        # ROE = 1000 / 5000 = 0.2
        assert metrics['ROE'] == 0.2
        # ROA = 1000 / 10000 = 0.1
        assert metrics['ROA'] == 0.1
        # Net Margin = 1000 / 50000 = 0.02
        assert metrics['Net Margin'] == 0.02

    def test_calculate_liquidity_metrics(self):
        """Test liquidity metrics calculation."""
        financials = {
            'current_assets': 5000,
            'current_liabilities': 2500,
            'inventory': 1000,
            'cash': 2000,
        }

        metrics = FinancialMetrics.calculate_liquidity_metrics(financials)

        assert 'Current Ratio' in metrics
        assert 'Quick Ratio' in metrics
        # Current Ratio = 5000 / 2500 = 2.0
        assert metrics['Current Ratio'] == 2.0

    def test_calculate_solvency_metrics(self):
        """Test solvency metrics calculation."""
        financials = {
            'total_liabilities': 3000,
            'total_equity': 5000,
            'operating_income': 2000,
            'interest_expense': 200,
            'total_assets': 8000,
        }

        metrics = FinancialMetrics.calculate_solvency_metrics(financials)

        assert 'Debt/Equity' in metrics
        assert 'Interest Coverage' in metrics
        # Debt/Equity = 3000 / 5000 = 0.6
        assert metrics['Debt/Equity'] == 0.6


class TestScoringEngine:
    """Test scoring engine."""

    def test_normalize_score(self):
        """Test score normalization."""
        # Test direct metric
        score = ScoringEngine.normalize_score(0.20, 'ROE')
        assert 50 <= score <= 100

        # Test inverse metric
        score = ScoringEngine.normalize_score(0.5, 'Debt/Equity', inverse=True)
        assert 50 <= score <= 100

    def test_score_profitability(self):
        """Test profitability scoring."""
        metrics = {
            'ROE': 0.15,
            'ROA': 0.08,
            'Net Margin': 0.10,
        }

        score = ScoringEngine.score_profitability(metrics)
        assert 0 <= score <= 100

    def test_score_valuation(self):
        """Test valuation scoring."""
        metrics = {
            'P/E Ratio': 15,
            'P/B Ratio': 1.5,
        }

        score = ScoringEngine.score_valuation(metrics)
        assert 0 <= score <= 100


class TestPnLCalculator:
    """Test P&L calculations."""

    def test_calculate_pnl_scenarios(self):
        """Test P&L scenario calculation."""
        pnl = PnLCalculator.calculate_pnl_scenarios(
            ticker='TEST',
            entry_price=100,
            quantity=10,
        )

        assert 'bull' in pnl
        assert 'base' in pnl
        assert 'bear' in pnl

        # Check base case should have no change
        assert pnl['base']['pnl_percentage'] == 0

    def test_calculate_break_even(self):
        """Test break-even calculation."""
        be = PnLCalculator.calculate_break_even(
            entry_price=100,
            quantity=10,
            fees=50,
        )

        assert 'break_even_price' in be
        assert be['break_even_price'] >= 100

    def test_calculate_position_sizing(self):
        """Test position sizing calculation."""
        sizing = PnLCalculator.calculate_position_sizing(
            portfolio_value=100000,
            risk_tolerance=0.02,
            entry_price=100,
            stop_loss_price=95,
        )

        assert 'recommended_quantity' in sizing
        assert sizing['recommended_quantity'] > 0
        assert 'position_size_percent' in sizing

    def test_calculate_cagr(self):
        """Test CAGR calculation."""
        cagr_data = PnLCalculator.calculate_compound_return(
            initial_investment=10000,
            final_value=20000,
            years=5,
        )

        assert 'cagr_percent' in cagr_data
        assert cagr_data['cagr_percent'] > 0
