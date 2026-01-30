import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent / "data" / "memory.db"
DB_PATH.parent.mkdir(exist_ok=True)


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_database(schema_sql: str | None = None):
    """Initialize database with provided schema (full DDL string)."""
    if schema_sql is None:
        raise ValueError("schema_sql is required")

    conn = get_connection()
    cursor = conn.cursor()
    cursor.executescript(schema_sql)
    conn.commit()
    conn.close()

