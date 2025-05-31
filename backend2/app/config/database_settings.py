import os
import logging
from pydantic import BaseSettings, Field
from dotenv import load_dotenv
from pathlib import Path

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables explicitly
project_root = Path(__file__).parent.parent.parent
env_path = project_root / ".env"
logger.info(f"Loading .env from: {env_path}")
load_dotenv(env_path)

class DatabaseSettings(BaseSettings):
    database_url: str = os.getenv("DATABASE_URL")
    secret_key: str = os.getenv("SECRET_KEY")
    algorithm: str = os.getenv("ALGORITHM", "HS256")
    access_token_expire_minutes: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = 'ignore'  # Ignore extra environment variables

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        logger.info(f"Database settings initialized: {self.__dict__}")
        logger.info(f"Environment variables loaded: {os.environ}")

database_settings = DatabaseSettings()
