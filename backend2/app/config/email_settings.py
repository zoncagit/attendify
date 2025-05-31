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

class EmailSettings(BaseSettings):
    # Email Configuration
    smtp_server: str = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    smtp_port: int = int(os.getenv("SMTP_PORT", "587"))
    smtp_user: str = os.getenv("SMTP_USER")
    smtp_password: str = os.getenv("SMTP_PASSWORD")
    email_from: str = os.getenv("EMAIL_FROM")
    email_from_name: str = os.getenv("EMAIL_FROM_NAME", "Attendify Support")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = 'ignore'  # Ignore extra environment variables

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        logger.info(f"Email settings initialized: {self.__dict__}")
        logger.info(f"Environment variables loaded: {os.environ}")

email_settings = EmailSettings()
