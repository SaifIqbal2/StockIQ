"""FastAPI application entry point and initialization."""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
from loguru import logger
import sys
from datetime import datetime

from src.config import settings

# Configure logging
logger.remove()
logger.add(
    sys.stderr,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan> - <level>{message}</level>",
    level=settings.LOG_LEVEL,
)
logger.add(
    "logs/stockiq.log",
    rotation="500 MB",
    retention="10 days",
    format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name} - {message}",
)

# Initialize FastAPI app
app = FastAPI(
    title="StockIQ Pakistan API",
    description="AI-Powered PSX Stock Analysis Platform",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# Configure CORS
allowed_origins = settings.ALLOWED_ORIGINS.split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Exception handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Handle HTTP exceptions."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail,
            "status_code": exc.status_code,
            "timestamp": datetime.now().isoformat(),
        },
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """Handle general exceptions."""
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "status_code": 500,
            "timestamp": datetime.now().isoformat(),
        },
    )


# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize application on startup."""
    logger.info("=" * 50)
    logger.info("🚀 Starting StockIQ Pakistan API")
    logger.info(f"Version: 1.0.0")
    logger.info(f"Environment: {'Development' if settings.DEBUG else 'Production'}")
    logger.info(f"Log Level: {settings.LOG_LEVEL}")
    logger.info("=" * 50)

    try:
        # Initialize database connection
        logger.info("Initializing database connection...")
        # TODO: Uncomment when database module is ready
        # from src.database.connection import init_db
        # await init_db()
        logger.info("✓ Database initialized")

        # Initialize cache
        logger.info("Initializing cache...")
        # TODO: Uncomment when cache module is ready
        # from src.cache.redis_client import cache_client
        # await cache_client.ping()
        logger.info("✓ Cache initialized")

        logger.info("✓ Application startup complete")

    except Exception as e:
        logger.error(f"✗ Startup error: {str(e)}", exc_info=True)
        raise


# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Clean up on shutdown."""
    logger.info("🛑 Shutting down StockIQ Pakistan API")
    # TODO: Add cleanup code
    logger.info("✓ Shutdown complete")


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "name": "StockIQ Pakistan",
        "version": "1.0.0",
        "status": "operational",
        "timestamp": datetime.now().isoformat(),
        "environment": "development" if settings.DEBUG else "production",
        "documentation": "/api/docs",
        "endpoints": {
            "analysis": "/api/analysis/{ticker}",
            "dashboard": "/api/dashboard",
            "advisor": "/api/advisor/suggestions",
            "pnl": "/api/pnl/calculate",
            "thesis": "/api/thesis/{id}",
        },
    }


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "StockIQ API",
        "timestamp": datetime.now().isoformat(),
    }


# Root API endpoint
@app.get("/api")
async def api_root():
    """API root endpoint."""
    return {
        "service": "StockIQ Pakistan API",
        "version": "1.0.0",
        "endpoints": {
            "analysis": {
                "method": "GET",
                "path": "/api/analysis/{ticker}",
                "description": "Get complete analysis for a stock",
            },
            "dashboard": {
                "method": "GET",
                "path": "/api/dashboard",
                "description": "Get market dashboard",
            },
            "advisor": {
                "method": "POST",
                "path": "/api/advisor/suggestions",
                "description": "Get investment suggestions",
            },
            "pnl": {
                "method": "POST",
                "path": "/api/pnl/calculate",
                "description": "Calculate P&L scenarios",
            },
            "thesis": {
                "method": "GET",
                "path": "/api/thesis/{id}",
                "description": "Get investment thesis",
            },
        },
    }


# Include routers (when ready)
def include_routers():
    """Include all API routers."""
    try:
        # TODO: Uncomment when modules are ready
        # from src.api.routes import analysis, dashboard, advisor, pnl, thesis
        # app.include_router(analysis.router, prefix="/api/analysis", tags=["Analysis"])
        # app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
        # app.include_router(advisor.router, prefix="/api/advisor", tags=["Advisor"])
        # app.include_router(pnl.router, prefix="/api/pnl", tags=["P&L"])
        # app.include_router(thesis.router, prefix="/api/thesis", tags=["Thesis"])
        logger.info("✓ Routers included")
    except Exception as e:
        logger.warning(f"Some routers could not be loaded: {str(e)}")


# Include routers on startup
include_routers()


def run():
    """Run the application."""
    uvicorn.run(
        "src.main:app",
        host=settings.HOST,
        port=settings.PORT,
        workers=settings.WORKERS,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower(),
    )


if __name__ == "__main__":
    run()
