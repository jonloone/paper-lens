"""
Database connection management for NexusOne backend
"""

import asyncpg
import os
from typing import Optional

# Global database pool
_db_pool: Optional[asyncpg.Pool] = None


async def get_db_pool() -> asyncpg.Pool:
    """
    Get or create database connection pool
    """
    global _db_pool

    if _db_pool is None:
        # Read connection string from environment
        database_url = os.getenv(
            'DATABASE_URL',
            'postgresql://postgres:postgres@localhost:5432/nexusone'
        )

        _db_pool = await asyncpg.create_pool(
            database_url,
            min_size=2,
            max_size=10,
            command_timeout=60
        )

    return _db_pool


async def close_db_pool():
    """
    Close database connection pool
    """
    global _db_pool

    if _db_pool is not None:
        await _db_pool.close()
        _db_pool = None
