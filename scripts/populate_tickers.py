#!/usr/bin/env python
"""Populate PSX company tickers in database."""

import asyncio
import sys
from loguru import logger

logger.remove()
logger.add(
    sys.stderr,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan> - <level>{message}</level>",
)


async def main():
    """Populate company tickers."""
    try:
        logger.info("=" * 50)
        logger.info("Populating PSX Company Tickers")
        logger.info("=" * 50)

        from src.database.connection import db_connection
        from src.database.crud import create_company
        from src.config import settings

        # Connect to database
        await db_connection.init()

        # Create companies
        session = await db_connection.get_session()

        for ticker in settings.KSE100_TICKERS:
            company_data = {
                'ticker': ticker,
                'name': f"{ticker} Company",
                'sector': 'Unknown',
                'exchange': 'PSX',
                'is_active': True,
            }

            try:
                company = await create_company(session, company_data)
                logger.info(f"✓ Created: {ticker}")
            except Exception as e:
                logger.warning(f"Skipped {ticker}: {str(e)}")

        logger.info(f"✓ Populated {len(settings.KSE100_TICKERS)} company tickers")

        await db_connection.close()

        return 0

    except Exception as e:
        logger.error(f"✗ Ticker population failed: {str(e)}", exc_info=True)
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
