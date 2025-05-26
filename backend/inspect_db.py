import os
from sqlalchemy import create_engine, inspect
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get database URL from environment
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("Error: DATABASE_URL not found in environment variables")
    exit(1)

# Create engine
engine = create_engine(DATABASE_URL)

# Create an inspector
inspector = inspect(engine)

# List all tables
tables = inspector.get_table_names()
print("\nTables in the database:")
for table in tables:
    print(f"\nTable: {table}")
    print("Columns:")
    for column in inspector.get_columns(table):
        print(f"  - {column['name']} ({column['type']})")
    
    # Print foreign keys
    fks = inspector.get_foreign_keys(table)
    if fks:
        print("\nForeign Keys:")
        for fk in fks:
            print(f"  - {fk['constrained_columns']} references {fk['referred_table']}({fk['referred_columns']})")
