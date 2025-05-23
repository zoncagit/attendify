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

class EmailSettings(BaseSettings):
    # Email Configuration
    smtp_server: str = Field(default="smtp.gmail.com", env="SMTP_SERVER")
    smtp_port: int = Field(default=587, env="SMTP_PORT")
    smtp_user: str = Field(default=..., env="SMTP_USER")
    smtp_password: str = Field(default=..., env="SMTP_PASSWORD")
    email_from: str = Field(default=..., env="EMAIL_FROM")
    email_from_name: str = Field(default="Attendify Support", env="EMAIL_FROM_NAME")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = 'ignore'  # Ignore extra environment variables

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        logger.info(f"Email settings initialized: {self.__dict__}")
        logger.info(f"Environment variables loaded: {os.environ}")

email_settings = EmailSettings()
