"""
Main package for the Attendify application.

This package contains the application configuration, data models,
routes, and business logic for attendance management.
"""

# Version of the application
__version__ = "1.0.0"

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Import main components
from .config.settings import settings
from .database import Base, engine
from .main import app

# Export main components
__all__ = ["app", "settings", "Base", "engine"]