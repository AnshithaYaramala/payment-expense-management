import os
import sqlite3

DB_PATH = os.path.join(os.path.dirname(__file__), 'payment_system.db')
SCHEMA_PATH = os.path.join(os.path.dirname(__file__), 'schema.sql')

def get_db_connection():
    """
    Returns a database connection.
    Defaults to SQLite for zero-configuration out-of-the-box local running.
    Can be configured for MySQL via environment variables.
    """
    db_type = os.getenv("DB_TYPE", "sqlite").lower()

    if db_type == "mysql":
        import pymysql
        conn = pymysql.connect(
            host=os.getenv("MYSQL_HOST", "localhost"),
            user=os.getenv("MYSQL_USER", "root"),
            password=os.getenv("MYSQL_PASSWORD", ""),
            database=os.getenv("MYSQL_DB", "payment_expense_db"),
            cursorclass=pymysql.cursors.DictCursor,
            autocommit=False
        )
        return conn

    # Default: SQLite
    conn = sqlite3.connect(DB_PATH, timeout=10)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def init_db():
    """
    Initializes the database schema if tables do not exist.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    with open(SCHEMA_PATH, 'r', encoding='utf-8') as f:
        schema_sql = f.read()

    # Split and execute individual statements
    statements = [stmt.strip() for stmt in schema_sql.split(';') if stmt.strip()]
    for stmt in statements:
        try:
            cursor.execute(stmt)
        except Exception as e:
            # Table might already exist
            pass

    conn.commit()
    conn.close()
