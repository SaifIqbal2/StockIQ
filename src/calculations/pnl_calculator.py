"""P&L scenario calculator for investment analysis."""

from typing import Dict, Optional
from loguru import logger
from src.config import settings


class PnLCalculator:
    """Calculate profit/loss scenarios for investments."""

    @staticmethod
    def calculate_pnl_scenarios(
        ticker: str,
        entry_price: float,
        quantity: float,
        target_prices: Optional[Dict[str, float]] = None,
    ) -> Dict:
        """
        Calculate P&L for bull, base, and bear scenarios.

        Args:
            ticker: Stock ticker
            entry_price: Entry/purchase price
            quantity: Number of shares
            target_prices: Optional custom target prices for scenarios

        Returns:
            Dictionary with P&L calculations for each scenario
        """
        logger.info(f"Calculating P&L scenarios for {ticker} @ {entry_price}")

        # If target prices not provided, calculate from multipliers
        if not target_prices:
            target_prices = {
                'bull': entry_price * settings.PNL_SCENARIOS['bull']['multiplier'],
                'base': entry_price * settings.PNL_SCENARIOS['base']['multiplier'],
                'bear': entry_price * settings.PNL_SCENARIOS['bear']['multiplier'],
            }

        results = {}

        for scenario_name, multiplier in [('bull', 1.5), ('base', 1.0), ('bear', 0.7)]:
            exit_price = target_prices.get(scenario_name, entry_price * multiplier)
            scenario_config = settings.PNL_SCENARIOS.get(scenario_name, {})

            pnl_absolute = (exit_price - entry_price) * quantity
            pnl_percentage = ((exit_price - entry_price) / entry_price) * 100 if entry_price > 0 else 0

            results[scenario_name] = {
                'scenario': scenario_name,
                'description': scenario_config.get('description', ''),
                'probability': scenario_config.get('probability', 0),
                'entry_price': entry_price,
                'exit_price': exit_price,
                'quantity': quantity,
                'pnl_absolute': pnl_absolute,
                'pnl_percentage': pnl_percentage,
                'investment_value': entry_price * quantity,
                'exit_value': exit_price * quantity,
                'roi': pnl_percentage,
            }

        logger.info(f"✓ Calculated P&L scenarios for {ticker}")
        return results

    @staticmethod
    def calculate_break_even(
        entry_price: float, quantity: float, fees: float = 0, tax_rate: float = 0.15
    ) -> Dict:
        """
        Calculate break-even price.

        Args:
            entry_price: Entry/purchase price
            quantity: Number of shares
            fees: Total transaction fees
            tax_rate: Capital gains tax rate

        Returns:
            Dictionary with break-even analysis
        """
        investment_value = entry_price * quantity
        total_cost = investment_value + fees
        effective_entry_price = total_cost / quantity if quantity > 0 else 0

        # Break-even excluding taxes
        break_even_price = effective_entry_price

        # Break-even including taxes
        # If we want to recover cost after tax, we need:
        # (exit_price - entry_price) * (1 - tax_rate) = fees + tax
        # Simplified: exit_price = entry_price + tax_adjusted_cost
        tax_adjusted_cost = fees / (1 - tax_rate) if quantity > 0 else 0
        break_even_with_tax = effective_entry_price + (tax_adjusted_cost / quantity if quantity > 0 else 0)

        return {
            'entry_price': entry_price,
            'effective_entry_price': effective_entry_price,
            'break_even_price': break_even_price,
            'break_even_with_tax': break_even_with_tax,
            'required_gain_percentage': (
                ((break_even_price - entry_price) / entry_price * 100) if entry_price > 0 else 0
            ),
            'required_gain_with_tax': (
                ((break_even_with_tax - entry_price) / entry_price * 100) if entry_price > 0 else 0
            ),
        }

    @staticmethod
    def calculate_position_sizing(
        portfolio_value: float,
        risk_tolerance: float = 0.02,
        entry_price: float = 100,
        stop_loss_price: float = 90,
    ) -> Dict:
        """
        Calculate optimal position size based on risk management.

        Args:
            portfolio_value: Total portfolio value
            risk_tolerance: Acceptable risk as % of portfolio (default 2%)
            entry_price: Entry price
            stop_loss_price: Stop loss price

        Returns:
            Dictionary with position sizing recommendations
        """
        # Calculate risk per share
        risk_per_share = entry_price - stop_loss_price

        if risk_per_share <= 0:
            logger.warning("Stop loss price must be below entry price")
            return {'error': 'Invalid stop loss price'}

        # Calculate number of shares we can buy
        max_risk_amount = portfolio_value * risk_tolerance
        quantity = max_risk_amount / risk_per_share if risk_per_share > 0 else 0

        # Calculate position size as % of portfolio
        investment_amount = quantity * entry_price
        position_size_pct = (investment_amount / portfolio_value * 100) if portfolio_value > 0 else 0

        return {
            'portfolio_value': portfolio_value,
            'risk_tolerance_percent': risk_tolerance * 100,
            'max_risk_amount': max_risk_amount,
            'entry_price': entry_price,
            'stop_loss_price': stop_loss_price,
            'risk_per_share': risk_per_share,
            'recommended_quantity': int(quantity),
            'investment_amount': investment_amount,
            'position_size_percent': position_size_pct,
        }

    @staticmethod
    def calculate_expected_return(
        scenarios: Dict, weights: Optional[Dict[str, float]] = None
    ) -> Dict:
        """
        Calculate probability-weighted expected return.

        Args:
            scenarios: Dictionary with scenario data
            weights: Optional custom probability weights (bull, base, bear)

        Returns:
            Dictionary with expected return analysis
        """
        # Use default weights from config if not provided
        if not weights:
            weights = {
                'bull': settings.PNL_SCENARIOS['bull']['probability'],
                'base': settings.PNL_SCENARIOS['base']['probability'],
                'bear': settings.PNL_SCENARIOS['bear']['probability'],
            }

        expected_pnl = 0
        expected_return_pct = 0

        for scenario_name, weight in weights.items():
            if scenario_name in scenarios:
                scenario = scenarios[scenario_name]
                expected_pnl += scenario['pnl_absolute'] * weight
                expected_return_pct += scenario['pnl_percentage'] * weight

        return {
            'expected_pnl': expected_pnl,
            'expected_return_percent': expected_return_pct,
            'probability_weights': weights,
        }

    @staticmethod
    def calculate_drawdown(high_price: float, low_price: float, current_price: float) -> Dict:
        """
        Calculate drawdown metrics.

        Args:
            high_price: Highest price (peak)
            low_price: Lowest price (trough)
            current_price: Current price

        Returns:
            Dictionary with drawdown metrics
        """
        # Maximum drawdown
        max_drawdown = (low_price - high_price) / high_price if high_price > 0 else 0

        # Current drawdown from peak
        current_drawdown = (current_price - high_price) / high_price if high_price > 0 else 0

        # Recovery needed
        recovery_pct = (high_price - current_price) / current_price * 100 if current_price > 0 else 0

        return {
            'high_price': high_price,
            'low_price': low_price,
            'current_price': current_price,
            'max_drawdown_percent': max_drawdown * 100,
            'current_drawdown_percent': current_drawdown * 100,
            'recovery_percent_needed': recovery_pct,
        }

    @staticmethod
    def calculate_compound_return(
        initial_investment: float,
        final_value: float,
        years: float,
    ) -> Dict:
        """
        Calculate compound annual growth rate (CAGR).

        Args:
            initial_investment: Starting amount
            final_value: Ending amount
            years: Time period in years

        Returns:
            Dictionary with compound return analysis
        """
        if initial_investment <= 0 or years <= 0:
            return {'error': 'Invalid input values'}

        # CAGR = (Ending Value / Beginning Value)^(1/years) - 1
        cagr = (final_value / initial_investment) ** (1 / years) - 1
        total_return = (final_value - initial_investment) / initial_investment

        return {
            'initial_investment': initial_investment,
            'final_value': final_value,
            'years': years,
            'total_return_percent': total_return * 100,
            'cagr_percent': cagr * 100,
            'absolute_gain': final_value - initial_investment,
        }
