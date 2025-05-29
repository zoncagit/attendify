import os
from pathlib import Path

# Get the base directory of the project
BASE_DIR = Path(__file__).resolve().parent.parent

# Database configuration
DATABASE = {
    'default': {
        'ENGINE': 'sqlite3',
        'NAME': BASE_DIR / 'database' / 'attendify.db',
        'ATOMIC_REQUESTS': True,
    }
}

# Ensure the database directory exists
os.makedirs(BASE_DIR / 'database', exist_ok=True)
