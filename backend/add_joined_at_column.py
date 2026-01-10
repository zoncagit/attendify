import os
import pymysql
from urllib.parse import urlparse
from app.config.database_settings import DatabaseSettings

# Initialize database settings
db_settings = DatabaseSettings()

# Parse the database URL
db_url = urlparse(db_settings.database_url)
DB_USER = db_url.username
DB_PASSWORD = db_url.password
DB_HOST = db_url.hostname
DB_PORT = db_url.port or 3306
DB_NAME = db_url.path.lstrip('/')

try:
    # Connect to the database
    connection = pymysql.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
        cursorclass=pymysql.cursors.DictCursor
    )
    
    print("Successfully connected to the database")
    
    with connection.cursor() as cursor:
        # Check if the column already exists
        cursor.execute("""
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = %s 
            AND TABLE_NAME = 'group_users' 
            AND COLUMN_NAME = 'joined_at'
        """, (DB_NAME,))
        
        if not cursor.fetchone():
            # Add the joined_at column
            print("Adding joined_at column to group_users table...")
            cursor.execute("""
                ALTER TABLE `group_users` 
                ADD COLUMN `joined_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
            """)
            connection.commit()
            print("Successfully added joined_at column to group_users table")
        else:
            print("joined_at column already exists in group_users table")
            
except Exception as e:
    print(f"Error: {e}")
    
finally:
    if 'connection' in locals() and connection.open:
        connection.close()
        print("Database connection closed")
