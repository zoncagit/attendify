import sqlite3
from pathlib import Path
from .db_config import DATABASE

def get_db_connection():
    """Create a database connection and return it."""
    db_path = DATABASE['default']['NAME']
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row  # This enables column access by name
    return conn

def init_db():
    """Initialize the database with the schema."""
    conn = get_db_connection()
    try:
        with conn:
            # Create users table
            conn.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    email TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    full_name TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Create sessions table
            conn.execute('''
                CREATE TABLE IF NOT EXISTS sessions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    token TEXT UNIQUE NOT NULL,
                    expires_at TIMESTAMP NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            ''')
            
            # Create password_reset_tokens table
            conn.execute('''
                CREATE TABLE IF NOT EXISTS password_reset_tokens (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    token TEXT UNIQUE NOT NULL,
                    expires_at TIMESTAMP NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            ''')
    finally:
        conn.close()

def execute_query(query, params=(), fetch=False):
    """Execute a query and optionally fetch results."""
    conn = get_db_connection()
    try:
        with conn:
            cursor = conn.execute(query, params)
            if fetch:
                return cursor.fetchall()
            return cursor.lastrowid
    finally:
        conn.close()

def execute_many(query, params_list):
    """Execute multiple queries with different parameters."""
    conn = get_db_connection()
    try:
        with conn:
            conn.executemany(query, params_list)
    finally:
        conn.close()
