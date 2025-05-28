import os
from dotenv import load_dotenv
from pathlib import Path

# Load .env file from project root
dotenv_path = Path(__file__).parent / ".env"
print(f"Loading .env from: {dotenv_path}")
load_dotenv(dotenv_path)

# Print all environment variables
print("=== Environment Variables ===")
for key in ['SMTP_SERVER', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASSWORD', 'EMAIL_FROM', 'EMAIL_FROM_NAME']:
    value = os.getenv(key)
    print(f"{key}: {value if key != 'SMTP_PASSWORD' else '*' * len(value or '')}")

# Check if .env file exists
print(f"\n.env file exists: {dotenv_path.exists()}")
if dotenv_path.exists():
    print("\nContents of .env file:")
    with open(dotenv_path, 'r') as f:
        print(f.read())

# List of variables to check
vars_to_check = [
    "SMTP_SERVER",
    "SMTP_PORT",
    "SMTP_USER",
    "SMTP_PASSWORD",
    "EMAIL_FROM",
    "EMAIL_FROM_NAME",
    "DATABASE_URL",
    "SECRET_KEY"
]

print("\n=== Environment Variables ===")
for var in vars_to_check:
    value = os.getenv(var)
    if value:
        print(f"{var}: {value}")
    else:
        print(f"{var}: NOT SET")

# Print all environment variables
print("\n=== All Environment Variables ===")
for key, value in os.environ.items():
    print(f"{key}: {value}")
