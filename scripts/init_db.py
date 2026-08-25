#!/usr/bin/env python
"""Initialize database with schema."""

import asyncio
import sys
from loguru import logger

# Configure logging
logger.remove()
logger.add(
    sys.stderr,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan> - <level>{message}</level>",
)


async def main():
    """Initialize database."""
    try:
        logger.info("=" * 50)
        logger.info("Initializing StockIQ Database")
        logger.info("=" * 50)

        # Import database connection
        from src.database.connection import init_db

        # Initialize database
        await init_db()

        logger.info("✓ Database initialization complete")
        logger.info("=" * 50)

        return 0

    except Exception as e:
        logger.error(f"✗ Database initialization failed: {str(e)}", exc_info=True)
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
