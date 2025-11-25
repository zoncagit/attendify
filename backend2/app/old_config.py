from pydantic_settings import BaseSettings
from functools import lru_cache
import logging
from typing import Optional
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'
        extra = "ignore"
        case_sensitive = False

    @classmethod
    def __get_validators__(cls):
        yield cls.validate_env

    @classmethod
    def validate_env(cls, v):
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
    return settings

    @classmethod
    def __get_validators__(cls):
        yield cls.validate_env

    @classmethod
    def validate_env(cls, v):
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