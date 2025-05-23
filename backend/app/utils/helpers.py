import random
import string
from datetime import datetime

def generate_class_code(length: int = 6) -> str:
    """Generate a random uppercase class code"""
    return ''.join(random.choices(string.ascii_uppercase, k=length))

def format_datetime(dt: datetime) -> str:
    """Format datetime to readable string"""
    return dt.strftime('%Y-%m-%d %H:%M:%S')

def current_timestamp() -> str:
    """Get current ISO timestamp"""
    return datetime.now().isoformat()