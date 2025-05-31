from pydantic import BaseModel, validator
from functools import lru_cache
import logging
import os
from dotenv import load_dotenv
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables explicitly
project_root = Path(__file__).parent.parent
env_path = project_root / ".env"
logger.info(f"Loading .env from: {env_path}")
load_dotenv(env_path)

class Settings(BaseModel):
    DATABASE_URL: str = os.getenv("DATABASE_URL")
    SECRET_KEY: str = os.getenv("SECRET_KEY")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

    @validator('DATABASE_URL', 'SECRET_KEY')
    def check_not_empty(cls, v):
        if not v:
            raise ValueError("Environment variable is required")
        return v

# Load settings at module level
settings = Settings()

@lru_cache()
def get_settings():
    settings = Settings()
    logger.info("Settings loaded:")
    logger.info(f"Database URL: {settings.DATABASE_URL}")
    logger.info(f"SMTP Server: {settings.SMTP_SERVER}")
    logger.info(f"SMTP Port: {settings.SMTP_PORT}")
    logger.info(f"SMTP User: {settings.SMTP_USER}")
    logger.info(f"Email From: {settings.EMAIL_FROM}")
    logger.info(f"Email From Name: {settings.EMAIL_FROM_NAME}")
    return settings