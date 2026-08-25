# StockIQ Project Setup Guide

## Quick Start

Your complete StockIQ Python project has been generated in `c:\Users\Ayat Laptop\Desktop\StockIQ\`

## Project Structure

```
StockIQ/
├── src/                        # Main application code
│   ├── main.py               # FastAPI entry point
│   ├── config.py             # Configuration management
│   ├── database/             # Database models and operations
│   ├── scrapers/             # Data scrapers (PSX, SECP)
│   ├── data_fetchers/        # External data integration (yFinance)
│   ├── parsers/              # PDF and data parsing
│   ├── calculations/         # Financial metrics and scoring
│   ├── ai/                   # AI integration (Gemini API)
│   ├── api/routes/           # API endpoints
│   ├── cache/                # Redis caching
│   └── utils/                # Utilities and validators
├── tests/                      # Test suite
├── scripts/                    # Initialization and utility scripts
├── requirements.txt            # Python dependencies
├── docker-compose.yml          # Multi-container setup
├── Dockerfile                  # Container image definition
├── .env.example               # Environment variables template
└── README.md                  # Full documentation
```

## Installation Steps

### 1. Local Setup (Without Docker)

```bash
cd StockIQ

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup environment
cp .env.example .env

# Edit .env with your API keys:
# - DATABASE_URL=postgresql://...
# - GEMINI_API_KEY=...
# - Other API keys...

# Initialize database
python scripts/init_db.py

# Run the application
python -m src.main
```

Visit: http://localhost:8000/api/docs

### 2. Docker Setup (Recommended)

```bash
cd StockIQ

# Build and run with Docker Compose
docker-compose up -d

# Initialize database (first time only)
docker-compose exec app python scripts/init_db.py

# Populate PSX tickers (optional)
docker-compose exec app python scripts/populate_tickers.py
```

Access:
- API: http://localhost:8000
- API Docs: http://localhost:8000/api/docs
- Prometheus: http://localhost:9090

### 3. Development Environment

```bash
# Install development dependencies
pip install -r requirements-dev.txt

# Run tests
pytest

# Run with coverage
pytest --cov=src tests/

# Format code
black src/ tests/

# Run linting
flake8 src/
mypy src/
```

## Key Components

### 1. Financial Metrics (src/calculations/financial_metrics.py)
- ROE, ROA, ROIC, P/E, P/B ratios
- Liquidity, solvency, efficiency metrics
- Cash flow analysis

### 2. Scoring Engine (src/calculations/scoring_engine.py)
- 10-category scoring system
- Strategy-specific weighting (7 presets)
- Recommendation generation

### 3. Database Models (src/database/models.py)
- Company financials
- Price history
- User portfolios
- Stock scores

### 4. API Routes
- `/api/analysis/{ticker}` - Stock analysis
- `/api/dashboard` - Market overview
- `/api/advisor/suggestions` - Investment recommendations
- `/api/pnl/calculate` - P&L scenarios
- `/api/thesis/` - Investment thesis management

### 5. Utilities
- Validators for input validation
- Helpers for calculations
- Exception handling
- Cache management

## Configuration

### Environment Variables (.env)

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/stockiq
SUPABASE_URL=your_supabase_url

# Cache
REDIS_URL=redis://localhost:6379/0

# API Keys
GEMINI_API_KEY=your_gemini_key
OPENAI_API_KEY=your_openai_key

# Application
DEBUG=False
LOG_LEVEL=INFO
CACHE_TTL=300
AI_MODEL=gemini-1.5-flash
```

## Strategy Presets

The application includes 7 pre-configured investment strategies:

1. **Value** - Focus on undervalued stocks
2. **Growth** - High growth companies
3. **Quality** - Stable, high-quality businesses
4. **Dividend** - Income-generating stocks
5. **GARP** - Growth at Reasonable Price
6. **Conservative** - Low-risk, stable stocks
7. **Custom** - User-defined weights

## Running Tests

```bash
# All tests
pytest

# Specific test file
pytest tests/test_calculations.py

# With verbose output
pytest -v

# With coverage report
pytest --cov=src --cov-report=html
```

## Next Steps

1. **Configure Database**
   - Set up PostgreSQL or use Supabase
   - Update DATABASE_URL in .env

2. **Add API Keys**
   - Google Gemini API key for AI
   - OpenAI API key (optional)

3. **Populate Data**
   - Run `python scripts/populate_tickers.py` to add PSX tickers
   - Implement data scrapers for live data

4. **Test the API**
   - Visit http://localhost:8000/api/docs
   - Try sample requests

5. **Customize**
   - Modify strategy weights
   - Add custom financial metrics
   - Implement PSX-specific scrapers

## Common Commands

```bash
# Start the application
python -m src.main

# Initialize database
python scripts/init_db.py

# Run migrations
python scripts/migrate_db.py

# Run tests
pytest

# Format code
black src/

# Type checking
mypy src/

# Linting
flake8 src/
```

## Troubleshooting

### Database Connection Error
- Ensure PostgreSQL is running
- Check DATABASE_URL in .env
- Verify credentials

### Redis Connection Error
- Ensure Redis is running
- Check REDIS_URL in .env
- On Docker: `docker-compose logs redis`

### API Key Errors
- Verify API keys in .env
- Check API key permissions
- Ensure API endpoints are accessible

### Port Already in Use
- Change PORT in .env
- Or: `lsof -i :8000` to find process

## Support & Documentation

- Full API docs: http://localhost:8000/api/docs
- Detailed README: See README.md
- Test examples: See tests/ directory

## Architecture

The application follows a layered architecture:

1. **API Layer** - FastAPI routes
2. **Business Logic** - Calculations, scoring, analysis
3. **Data Layer** - Database models and CRUD operations
4. **Integration Layer** - External APIs, scrapers, cache
5. **Utility Layer** - Validators, helpers, exceptions

## Performance Optimization

- Financial metrics cached for 24 hours
- Prices cached for 5 minutes
- Database connection pooling
- Async operations throughout
- Batch processing for bulk data

## Security Considerations

- All API keys in .env (not committed)
- Input validation on all endpoints
- Database query parameterization
- Rate limiting (configured)
- CORS configured
- Error handling (no sensitive data leaked)

## Next Development Steps

1. Implement actual scrapers for PSX data
2. Connect to real financial databases
3. Add frontend UI (React/Vue.js)
4. Implement machine learning predictions
5. Add backtesting functionality
6. Implement user authentication
7. Add portfolio optimization
8. Real-time WebSocket updates

---

**Happy analyzing! 📊📈**
