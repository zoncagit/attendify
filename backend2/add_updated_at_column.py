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
            AND TABLE_NAME = 'groups' 
            AND COLUMN_NAME = 'updated_at'
        """, (DB_NAME,))
        
        if not cursor.fetchone():
            # Add the updated_at column
            print("Adding updated_at column to groups table...")
            cursor.execute("""
                ALTER TABLE `groups` 
                ADD COLUMN `updated_at` TIMESTAMP NULL DEFAULT NULL 
                ON UPDATE CURRENT_TIMESTAMP
            """)
            connection.commit()
            print("Successfully added updated_at column to groups table")
        else:
            print("updated_at column already exists in groups table")
            
except Exception as e:
    print(f"Error: {e}")
    
finally:
    if 'connection' in locals() and connection.open:
        connection.close()
        print("Database connection closed")
