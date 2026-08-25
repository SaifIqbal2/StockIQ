"""Application configuration and settings management."""

from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Database
    DATABASE_URL: str
    SUPABASE_URL: Optional[str] = None
    SUPABASE_KEY: Optional[str] = None

    # Redis Cache
    REDIS_URL: str = "redis://localhost:6379/0"
    UPSTASH_REDIS_URL: Optional[str] = None

    # API Keys
    GEMINI_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None

    # PSX URLs
    PSX_BASE_URL: str = "https://www.psx.com.pk"
    PSX_ANNOUNCEMENTS_URL: str = "https://www.psx.com.pk/announcements"
    SECP_BASE_URL: str = "https://www.secp.gov.pk"

    # Application Settings
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"
    CACHE_TTL: int = 300  # 5 minutes for live prices
    FINANCIAL_CACHE_TTL: int = 86400  # 24 hours for financial data
    RATE_LIMIT: int = 10
    RATE_LIMIT_PERIOD: int = 86400

    # Server Settings
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    WORKERS: int = 4

    # CORS Settings
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:8000"

    # AI Settings
    AI_MODEL: str = "gemini-1.5-flash"
    AI_TEMPERATURE: float = 0.3
    AI_MAX_TOKENS: int = 500
    AI_TIMEOUT: int = 30

    # Monitoring
    ENABLE_MONITORING: bool = False
    PROMETHEUS_PORT: int = 9090

    # KSE-100 Tickers (30 major stocks)
    KSE100_TICKERS: list = [
        "OGDC",
        "PPL",
        "POL",
        "MARI",
        "PSO",
        "APL",
        "HASCOL",
        "SHEL",
        "HBL",
        "UBL",
        "MCB",
        "ABL",
        "BAHL",
        "MEBL",
        "NBP",
        "BAFL",
        "ENGRO",
        "FATIMA",
        "FFC",
        "FFBL",
        "EFERT",
        "LUCK",
        "DGKC",
        "MLCF",
        "PIOC",
        "CHCC",
        "FCCL",
        "KOHC",
        "HUBC",
        "KAPCO",
        "KEL",
        "NPL",
        "NML",
        "NCL",
        "GATM",
        "ICI",
        "SEARL",
        "AGP",
        "TRG",
        "SYS",
        "AVN",
        "NETSOL",
        "NESTLE",
        "UNILEVER",
        "COLG",
        "PTC",
        "ASTL",
        "ISL",
        "MUGHAL",
        "JUBILEE",
        "EFU",
        "IGI",
        "FEROZ",
        "HINOON",
        "GLAXO",
        "INDU",
        "HCAR",
        "PSMC",
    ]

    # Financial Metrics Categories
    METRIC_CATEGORIES: dict = {
        "profitability": ["ROE", "ROA", "ROIC", "Net Margin", "Operating Margin"],
        "valuation": ["P/E Ratio", "P/B Ratio", "EV/EBITDA", "Price/Sales"],
        "liquidity": ["Current Ratio", "Quick Ratio", "Cash Ratio", "Working Capital"],
        "solvency": ["Debt/Equity", "Interest Coverage", "Debt/Assets"],
        "growth": ["Revenue Growth", "EPS Growth", "Asset Growth", "Equity Growth"],
        "efficiency": ["Asset Turnover", "Receivables Turnover", "Inventory Turnover"],
        "quality": ["Dividend Payout", "Free Cash Flow", "Operating Cash Flow"],
        "momentum": ["Price Momentum", "Volume Trend", "Technical Score"],
        "dividend": ["Dividend Yield", "Payout Ratio", "Dividend Growth"],
        "risk": ["Beta", "Volatility", "Downside Risk", "VaR"],
    }

    # Strategy Configurations
    STRATEGY_PRESETS: dict = {
        "value": {
            "description": "Focus on undervalued stocks with strong fundamentals",
            "weights": {
                "valuation": 0.30,
                "profitability": 0.25,
                "dividend": 0.15,
                "growth": 0.10,
                "quality": 0.10,
                "liquidity": 0.05,
                "momentum": 0.05,
                "efficiency": 0.00,
                "solvency": 0.00,
                "risk": 0.00,
            },
        },
        "growth": {
            "description": "Focus on companies with strong growth trajectory",
            "weights": {
                "growth": 0.35,
                "momentum": 0.20,
                "profitability": 0.15,
                "efficiency": 0.10,
                "valuation": 0.10,
                "quality": 0.05,
                "dividend": 0.00,
                "liquidity": 0.05,
                "solvency": 0.00,
                "risk": 0.00,
            },
        },
        "quality": {
            "description": "Focus on high-quality companies with stable operations",
            "weights": {
                "profitability": 0.25,
                "quality": 0.25,
                "solvency": 0.20,
                "efficiency": 0.10,
                "liquidity": 0.10,
                "growth": 0.05,
                "momentum": 0.00,
                "valuation": 0.05,
                "dividend": 0.00,
                "risk": 0.00,
            },
        },
        "dividend": {
            "description": "Focus on dividend-paying stocks for income",
            "weights": {
                "dividend": 0.35,
                "valuation": 0.20,
                "profitability": 0.15,
                "quality": 0.15,
                "solvency": 0.10,
                "liquidity": 0.05,
                "growth": 0.00,
                "momentum": 0.00,
                "efficiency": 0.00,
                "risk": 0.00,
            },
        },
        "garp": {
            "description": "Growth At Reasonable Price - balance of growth and value",
            "weights": {
                "growth": 0.25,
                "valuation": 0.20,
                "profitability": 0.20,
                "quality": 0.15,
                "efficiency": 0.10,
                "momentum": 0.05,
                "liquidity": 0.05,
                "dividend": 0.00,
                "solvency": 0.00,
                "risk": 0.00,
            },
        },
        "conservative": {
            "description": "Low-risk strategy focused on stability",
            "weights": {
                "solvency": 0.25,
                "quality": 0.20,
                "profitability": 0.20,
                "liquidity": 0.15,
                "dividend": 0.10,
                "valuation": 0.05,
                "efficiency": 0.05,
                "growth": 0.00,
                "momentum": 0.00,
                "risk": 0.00,
            },
        },
        "custom": {
            "description": "Custom user-defined strategy weights",
            "weights": {
                "profitability": 0.10,
                "valuation": 0.10,
                "liquidity": 0.10,
                "solvency": 0.10,
                "growth": 0.10,
                "efficiency": 0.10,
                "quality": 0.10,
                "momentum": 0.10,
                "dividend": 0.10,
                "risk": 0.10,
            },
        },
    }

    # P&L Scenario Multipliers
    PNL_SCENARIOS: dict = {
        "bull": {
            "description": "Optimistic scenario - strong growth and expansion",
            "multiplier": 1.5,
            "probability": 0.25,
        },
        "base": {
            "description": "Base case - normalized growth continuation",
            "multiplier": 1.0,
            "probability": 0.50,
        },
        "bear": {
            "description": "Pessimistic scenario - contraction and challenges",
            "multiplier": 0.7,
            "probability": 0.25,
        },
    }

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"


# Initialize settings
settings = Settings()
