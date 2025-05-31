import os
from pydantic import BaseModel
from dotenv import load_dotenv
from pathlib import Path
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables explicitly
project_root = Path(__file__).parent.parent.parent
env_path = project_root / ".env"
logger.info(f"Loading .env from: {env_path}")
load_dotenv(env_path)

class Settings(BaseModel):
    # Email Configuration
    smtp_server: str = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    smtp_port: int = int(os.getenv("SMTP_PORT", "587"))
    smtp_user: str = os.getenv("SMTP_USER")
    smtp_password: str = os.getenv("SMTP_PASSWORD")
    email_from: str = os.getenv("EMAIL_FROM")
    email_from_name: str = os.getenv("EMAIL_FROM_NAME", "Attendify Support")

    # Database Configuration
    database_url: str = os.getenv("DATABASE_URL")
    secret_key: str = os.getenv("SECRET_KEY")
    algorithm: str = os.getenv("ALGORITHM", "HS256")
    access_token_expire_minutes: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

    class Config:
        extra = 'ignore'  # Ignore extra environment variables

def get_settings():
    return Settings()

# Initialize settings immediately
settings = get_settings()
