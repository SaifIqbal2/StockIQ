"""Stock scoring engine for multi-criteria analysis."""

from typing import Dict, Optional
from loguru import logger
from src.config import settings
from src.calculations.financial_metrics import FinancialMetrics
from src.utils.helpers import NumericHelper


class ScoringEngine:
    """Calculate comprehensive stock scores."""

    # Score ranges
    MIN_SCORE = 0
    MAX_SCORE = 100
    MID_SCORE = 50

    # Metric benchmarks for scoring
    BENCHMARKS = {
        'ROE': {'poor': 0.05, 'fair': 0.10, 'good': 0.15, 'excellent': 0.25},
        'ROA': {'poor': 0.02, 'fair': 0.05, 'good': 0.08, 'excellent': 0.15},
        'Net Margin': {'poor': 0.02, 'fair': 0.05, 'good': 0.10, 'excellent': 0.20},
        'Current Ratio': {'poor': 1.0, 'fair': 1.5, 'good': 2.0, 'excellent': 3.0},
        'Quick Ratio': {'poor': 0.5, 'fair': 1.0, 'good': 1.5, 'excellent': 2.0},
        'Debt/Equity': {'excellent': 0.5, 'good': 1.0, 'fair': 1.5, 'poor': 2.5},
        'Interest Coverage': {'poor': 2.0, 'fair': 5.0, 'good': 10.0, 'excellent': 20.0},
        'Asset Turnover': {'poor': 0.5, 'fair': 1.0, 'good': 1.5, 'excellent': 2.5},
    }

    @staticmethod
    def normalize_score(value: float, metric_name: str, inverse: bool = False) -> float:
        """
        Normalize a metric value to 0-100 score.

        Args:
            value: Metric value
            metric_name: Name of metric for benchmark lookup
            inverse: If True, lower values get higher scores

        Returns:
            Score from 0-100
        """
        if value is None or (isinstance(value, float) and value != value):  # NaN check
            return ScoringEngine.MID_SCORE

        # Get benchmarks for this metric
        benchmarks = ScoringEngine.BENCHMARKS.get(metric_name, {})

        if not benchmarks:
            # Default scaling: map value to 0-100
            # Assuming values typically range from -1 to 1
            score = max(0, min(100, (value + 1) * 50))
            return score

        # Extract benchmark thresholds
        poor = benchmarks.get('poor', 0)
        fair = benchmarks.get('fair', poor * 2)
        good = benchmarks.get('good', fair * 1.5)
        excellent = benchmarks.get('excellent', good * 1.5)

        # Score based on value relative to benchmarks
        if inverse:
            # Lower is better (e.g., Debt/Equity)
            if value <= poor:
                return 100
            elif value <= fair:
                return 75
            elif value <= good:
                return 50
            elif value <= excellent:
                return 25
            else:
                return 0
        else:
            # Higher is better (e.g., ROE)
            if value >= excellent:
                return 100
            elif value >= good:
                return 75
            elif value >= fair:
                return 50
            elif value >= poor:
                return 25
            else:
                return 0

    @staticmethod
    def score_profitability(metrics: Dict[str, float]) -> float:
        """Score profitability category (0-100)."""
        scores = []

        if 'ROE' in metrics:
            scores.append(ScoringEngine.normalize_score(metrics['ROE'], 'ROE'))
        if 'ROA' in metrics:
            scores.append(ScoringEngine.normalize_score(metrics['ROA'], 'ROA'))
        if 'Net Margin' in metrics:
            scores.append(ScoringEngine.normalize_score(metrics['Net Margin'], 'Net Margin'))

        return sum(scores) / len(scores) if scores else ScoringEngine.MID_SCORE

    @staticmethod
    def score_valuation(metrics: Dict[str, float], pe_ratio: Optional[float] = None) -> float:
        """
        Score valuation category (0-100).
        Lower P/E and P/B are better for value investors.
        """
        scores = []

        # P/E Ratio: Inverse scoring (lower is better for value)
        if 'P/E Ratio' in metrics and metrics['P/E Ratio'] > 0:
            pe = metrics['P/E Ratio']
            # Map PE range: 0-40 (excellent) to 40+ (poor)
            if pe < 10:
                scores.append(100)
            elif pe < 15:
                scores.append(75)
            elif pe < 25:
                scores.append(50)
            elif pe < 35:
                scores.append(25)
            else:
                scores.append(0)

        # P/B Ratio: Inverse scoring
        if 'P/B Ratio' in metrics and metrics['P/B Ratio'] > 0:
            pb = metrics['P/B Ratio']
            if pb < 1.0:
                scores.append(100)
            elif pb < 1.5:
                scores.append(75)
            elif pb < 2.5:
                scores.append(50)
            elif pb < 3.5:
                scores.append(25)
            else:
                scores.append(0)

        return sum(scores) / len(scores) if scores else ScoringEngine.MID_SCORE

    @staticmethod
    def score_liquidity(metrics: Dict[str, float]) -> float:
        """Score liquidity category (0-100)."""
        scores = []

        if 'Current Ratio' in metrics:
            scores.append(ScoringEngine.normalize_score(metrics['Current Ratio'], 'Current Ratio'))
        if 'Quick Ratio' in metrics:
            scores.append(ScoringEngine.normalize_score(metrics['Quick Ratio'], 'Quick Ratio'))

        return sum(scores) / len(scores) if scores else ScoringEngine.MID_SCORE

    @staticmethod
    def score_solvency(metrics: Dict[str, float]) -> float:
        """Score solvency category (0-100)."""
        scores = []

        if 'Debt/Equity' in metrics:
            # Inverse: lower debt is better
            de_ratio = metrics['Debt/Equity']
            if de_ratio < 0.5:
                scores.append(100)
            elif de_ratio < 1.0:
                scores.append(75)
            elif de_ratio < 1.5:
                scores.append(50)
            elif de_ratio < 2.5:
                scores.append(25)
            else:
                scores.append(0)

        if 'Interest Coverage' in metrics:
            scores.append(ScoringEngine.normalize_score(metrics['Interest Coverage'], 'Interest Coverage'))

        return sum(scores) / len(scores) if scores else ScoringEngine.MID_SCORE

    @staticmethod
    def score_growth(growth_metrics: Dict[str, float]) -> float:
        """Score growth category (0-100)."""
        # Growth metrics typically include YoY growth percentages
        scores = []

        for metric_name, value in growth_metrics.items():
            # Higher growth is better
            if isinstance(value, (int, float)) and value is not None:
                # Map growth: -50% (0) to 50%+ (100)
                growth_pct = value * 100
                score = max(0, min(100, growth_pct + 50))
                scores.append(score)

        return sum(scores) / len(scores) if scores else ScoringEngine.MID_SCORE

    @staticmethod
    def score_efficiency(metrics: Dict[str, float]) -> float:
        """Score operational efficiency category (0-100)."""
        scores = []

        if 'Asset Turnover' in metrics:
            scores.append(ScoringEngine.normalize_score(metrics['Asset Turnover'], 'Asset Turnover'))

        if 'Receivables Turnover' in metrics:
            rt = metrics['Receivables Turnover']
            # Higher is better
            if rt > 5:
                scores.append(100)
            elif rt > 3:
                scores.append(75)
            elif rt > 1:
                scores.append(50)
            else:
                scores.append(25)

        return sum(scores) / len(scores) if scores else ScoringEngine.MID_SCORE

    @staticmethod
    def score_quality(metrics: Dict[str, float]) -> float:
        """Score earnings quality and cash flow (0-100)."""
        scores = []

        # Cash Flow to Net Income: Higher ratio indicates better quality
        if 'CF to NI' in metrics:
            cf_ratio = metrics['CF to NI']
            if cf_ratio > 1.0:
                scores.append(100)
            elif cf_ratio > 0.8:
                scores.append(75)
            elif cf_ratio > 0.5:
                scores.append(50)
            elif cf_ratio > 0:
                scores.append(25)
            else:
                scores.append(0)

        return sum(scores) / len(scores) if scores else ScoringEngine.MID_SCORE

    @staticmethod
    def score_dividend(metrics: Dict[str, float]) -> float:
        """Score dividend attractiveness (0-100)."""
        scores = []

        if 'Payout Ratio' in metrics:
            payout = metrics['Payout Ratio']
            # Sustainable range is 20-60%
            if 0.2 <= payout <= 0.6:
                scores.append(100)
            elif payout < 0.2:
                scores.append(75)  # Low payout, room for growth
            elif payout <= 0.8:
                scores.append(50)
            else:
                scores.append(25)

        if 'Dividend Per Share' in metrics and metrics['Dividend Per Share'] > 0:
            scores.append(75)  # Company pays dividends

        return sum(scores) / len(scores) if scores else ScoringEngine.MID_SCORE

    @staticmethod
    def calculate_category_scores(financials: Dict, current_price: float = 0,
                                  growth_metrics: Optional[Dict] = None) -> Dict[str, float]:
        """
        Calculate all 10-category scores.

        Args:
            financials: Financial data dictionary
            current_price: Current stock price
            growth_metrics: Growth metrics dictionary

        Returns:
            Dictionary with all category scores
        """
        logger.info("Calculating category scores")

        # Calculate all metrics
        all_metrics = FinancialMetrics.calculate_all_metrics(financials, current_price)

        # Flatten metrics
        flat_metrics = {}
        for category, metrics in all_metrics.items():
            flat_metrics.update(metrics)

        # Calculate category scores
        scores = {
            'profitability': ScoringEngine.score_profitability(flat_metrics),
            'valuation': ScoringEngine.score_valuation(flat_metrics),
            'liquidity': ScoringEngine.score_liquidity(flat_metrics),
            'solvency': ScoringEngine.score_solvency(flat_metrics),
            'growth': ScoringEngine.score_growth(growth_metrics or {}),
            'efficiency': ScoringEngine.score_efficiency(flat_metrics),
            'quality': ScoringEngine.score_quality(flat_metrics),
            'dividend': ScoringEngine.score_dividend(flat_metrics),
            'momentum': ScoringEngine.MID_SCORE,  # Placeholder
            'risk': ScoringEngine.MID_SCORE,  # Placeholder
        }

        logger.info(f"✓ Calculated category scores")
        return scores

    @staticmethod
    def calculate_strategy_score(category_scores: Dict[str, float], strategy: str = 'value') -> Dict:
        """
        Calculate overall score for a specific strategy.

        Args:
            category_scores: Dictionary of category scores
            strategy: Strategy name

        Returns:
            Dictionary with strategy score and recommendation
        """
        logger.info(f"Calculating score for strategy: {strategy}")

        if strategy not in settings.STRATEGY_PRESETS:
            logger.warning(f"Unknown strategy: {strategy}, using 'value'")
            strategy = 'value'

        strategy_config = settings.STRATEGY_PRESETS[strategy]
        weights = strategy_config['weights']

        # Calculate weighted score
        overall_score = 0
        for category, weight in weights.items():
            score = category_scores.get(category, ScoringEngine.MID_SCORE)
            overall_score += score * weight

        # Determine recommendation
        if overall_score >= 75:
            recommendation = "STRONG BUY"
        elif overall_score >= 65:
            recommendation = "BUY"
        elif overall_score >= 55:
            recommendation = "HOLD"
        elif overall_score >= 40:
            recommendation = "SELL"
        else:
            recommendation = "STRONG SELL"

        logger.info(f"✓ Strategy score: {overall_score:.1f} ({recommendation})")

        return {
            'strategy': strategy,
            'overall_score': overall_score,
            'recommendation': recommendation,
            'category_scores': category_scores,
            'weights': weights,
        }
