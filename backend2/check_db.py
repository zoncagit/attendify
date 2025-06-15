import pymysql

# Database connection configuration
db_config = {
    'host': '127.0.0.1',
    'user': 'root',
    'password': 'fouad',
    'database': 'atedendefify',
    'port': 3306
}

try:
    # Connect to the database
    connection = pymysql.connect(**db_config)
    cursor = connection.cursor()
    
    # Check if class_users table exists
    cursor.execute("SHOW TABLES LIKE 'class_users'")
    table_exists = cursor.fetchone()
    
    if table_exists:
        print("Table 'class_users' exists. Checking columns...")
        # Get column information
        cursor.execute("SHOW COLUMNS FROM class_users")
        columns = cursor.fetchall()
        print("\nColumns in class_users table:")
        for column in columns:
            print(f"- {column[0]} ({column[1]})")
    else:
        print("Table 'class_users' does not exist.")
    
    cursor.close()
    connection.close()
    
except Exception as e:
    print(f"Error: {e}")
