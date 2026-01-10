import os
import sys
from sqlalchemy import create_engine, inspect
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get database URL from environment
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("Error: DATABASE_URL not found in environment variables")
    sys.exit(1)

# Create engine
engine = create_engine(DATABASE_URL)

def list_tables():
    try:
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        print("\nTables in the database:")
        for table in tables:
            print(f"- {table}")
        print("")
    except Exception as e:
        print(f"Error listing tables: {e}")
        sys.exit(1)

if __name__ == "__main__":
    print(f"Connecting to database: {DATABASE_URL}")
    list_tables()
