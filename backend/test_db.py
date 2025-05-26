import pymysql
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Test database connection
try:
    # Test connection using pymysql
    print("Testing database connection with pymysql...")
    connection = pymysql.connect(
        host='127.0.0.1',
        user='root',
        password='fouad',
        database='atedendefify',
        port=3306
    )
    print("Successfully connected to MySQL database using pymysql!")
    connection.close()
    
    # Test connection using SQLAlchemy
    print("\nTesting database connection with SQLAlchemy...")
    SQLALCHEMY_DATABASE_URL = "mysql+pymysql://root:fouad@127.0.0.1:3306/atedendefify"
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    connection = engine.connect()
    print("Successfully connected to MySQL database using SQLAlchemy!")
    connection.close()
    
except Exception as e:
    print(f"Error connecting to database: {e}")
