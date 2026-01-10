"""
Database migration script to add new fields to existing tables.
Run this script to update the database schema with new columns.

Usage:
    python backend/migrations/add_new_fields.py
"""
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text, inspect
from app.config import settings

def run_migration():
    """Add new columns to existing tables if they don't exist."""
    engine = create_engine(settings.database_url)
    inspector = inspect(engine)
    
    with engine.connect() as conn:
        # Check and add columns to 'classes' table
        class_columns = [col['name'] for col in inspector.get_columns('classes')]
        
        if 'subject' not in class_columns:
            print("Adding 'subject' column to 'classes' table...")
            conn.execute(text("ALTER TABLE classes ADD COLUMN subject VARCHAR(100)"))
            print("✓ Added 'subject' column")
        else:
            print("✓ 'subject' column already exists")
        
        if 'attendance_settings' not in class_columns:
            print("Adding 'attendance_settings' column to 'classes' table...")
            # SQLite uses TEXT for JSON, MySQL/PostgreSQL can use JSON
            try:
                conn.execute(text("ALTER TABLE classes ADD COLUMN attendance_settings JSON DEFAULT '{\"warning_threshold\": 3, \"low_percentage_threshold\": 75}'"))
            except Exception:
                # Fallback for SQLite
                conn.execute(text("ALTER TABLE classes ADD COLUMN attendance_settings TEXT DEFAULT '{\"warning_threshold\": 3, \"low_percentage_threshold\": 75}'"))
            print("✓ Added 'attendance_settings' column")
        else:
            print("✓ 'attendance_settings' column already exists")
        
        # Check and add columns to 'users' table
        user_columns = [col['name'] for col in inspector.get_columns('users')]
        
        if 'profile_photo' not in user_columns:
            print("Adding 'profile_photo' column to 'users' table...")
            conn.execute(text("ALTER TABLE users ADD COLUMN profile_photo VARCHAR(255)"))
            print("✓ Added 'profile_photo' column")
        else:
            print("✓ 'profile_photo' column already exists")
        
        conn.commit()
        print("\n✓ Migration completed successfully!")


if __name__ == "__main__":
    print("Running database migration...")
    print("=" * 50)
    run_migration()
