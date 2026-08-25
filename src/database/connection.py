"""Database connection and initialization."""

from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from loguru import logger
from src.config import settings

# Declarative base for models
Base = declarative_base()


class DatabaseConnection:
    """Database connection manager."""

    def __init__(self):
        """Initialize database connection."""
        self.engine = None
        self.async_engine = None
        self.SessionLocal = None

    async def init(self):
        """Initialize async database engine and session factory."""
        try:
            logger.info(f"Connecting to database: {settings.DATABASE_URL[:50]}...")

            # Create async engine
            self.async_engine = create_async_engine(
                settings.DATABASE_URL,
                echo=settings.DEBUG,
                pool_size=10,
                max_overflow=20,
                pool_pre_ping=True,
            )

            # Create session factory
            self.SessionLocal = async_sessionmaker(
                self.async_engine, class_=AsyncSession, expire_on_commit=False
            )

            # Create tables
            async with self.async_engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)

            logger.info("✓ Database connection initialized")

        except Exception as e:
            logger.error(f"✗ Database connection failed: {str(e)}", exc_info=True)
            raise

    async def close(self):
        """Close database connection."""
        if self.async_engine:
            await self.async_engine.dispose()
            logger.info("✓ Database connection closed")

    async def get_session(self):
        """Get database session."""
        if self.SessionLocal is None:
            raise RuntimeError("Database not initialized. Call init() first.")
        return self.SessionLocal()


# Global connection instance
db_connection = DatabaseConnection()


async def init_db():
    """Initialize database."""
    await db_connection.init()


async def get_db_session():
    """Get database session for dependency injection."""
    async with db_connection.SessionLocal() as session:
        yield session
