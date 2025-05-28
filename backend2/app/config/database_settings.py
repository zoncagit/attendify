import logging
import os
from pydantic_settings import BaseSettings
from pydantic import Field
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
    database_url: str = Field(default=..., env="DATABASE_URL")
    secret_key: str = Field(default=..., env="SECRET_KEY")
    algorithm: str = Field(default="HS256", env="ALGORITHM")
    access_token_expire_minutes: int = Field(default=30, env="ACCESS_TOKEN_EXPIRE_MINUTES")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = 'ignore'  # Ignore extra environment variables

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        logger.info(f"Database settings initialized: {self.__dict__}")
        logger.info(f"Environment variables loaded: {os.environ}")

database_settings = DatabaseSettings()
