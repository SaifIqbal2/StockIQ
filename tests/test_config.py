"""Tests for initialization and test infrastructure."""

import pytest
from loguru import logger


def test_imports():
    """Test that all modules can be imported."""
    try:
        from src.config import settings
        from src.database.models import Company
        from src.calculations.financial_metrics import FinancialMetrics
        from src.calculations.scoring_engine import ScoringEngine
        from src.utils.validators import StockValidator
        from src.utils.helpers import NumericHelper
        
        assert settings is not None
        assert Company is not None
        assert FinancialMetrics is not None
        assert ScoringEngine is not None
        assert StockValidator is not None
        assert NumericHelper is not None
        
    except ImportError as e:
        pytest.fail(f"Failed to import module: {str(e)}")


def test_config_loading():
    """Test that configuration loads correctly."""
    from src.config import settings
    
    assert settings.DEBUG is not None
    assert settings.LOG_LEVEL is not None
    assert settings.CACHE_TTL > 0
    assert len(settings.KSE100_TICKERS) > 0
    assert len(settings.STRATEGY_PRESETS) > 0


def test_metric_categories():
    """Test financial metric categories."""
    from src.config import settings
    
    categories = settings.METRIC_CATEGORIES
    assert 'profitability' in categories
    assert 'valuation' in categories
    assert 'liquidity' in categories
    assert 'solvency' in categories
    assert len(categories) == 10


def test_strategy_presets():
    """Test investment strategy presets."""
    from src.config import settings
    
    strategies = settings.STRATEGY_PRESETS
    
    for strategy_name, config in strategies.items():
        assert 'description' in config
        assert 'weights' in config
        
        # Check weights sum to approximately 1.0
        total_weight = sum(config['weights'].values())
        assert abs(total_weight - 1.0) < 0.01, f"Strategy {strategy_name} weights don't sum to 1.0"
