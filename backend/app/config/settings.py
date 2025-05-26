from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    # Email Configuration
    smtp_server: str = Field(default="smtp.gmail.com", env="SMTP_SERVER")
    smtp_port: int = Field(default=587, env="SMTP_PORT")
    smtp_user: str = Field(default=..., env="SMTP_USER")
    smtp_password: str = Field(default=..., env="SMTP_PASSWORD")
    email_from: str = Field(default=..., env="EMAIL_FROM")
    email_from_name: str = Field(default="Attendify Support", env="EMAIL_FROM_NAME")

    # Database Configuration
    database_url: str = Field(default=..., env="DATABASE_URL")
    secret_key: str = Field(default=..., env="SECRET_KEY")
    algorithm: str = Field(default="HS256", env="ALGORITHM")
    access_token_expire_minutes: int = Field(default=30, env="ACCESS_TOKEN_EXPIRE_MINUTES")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = 'ignore'  # Ignore extra environment variables

settings = Settings()

def get_settings():
    return settings

# Initialize settings immediately
settings = get_settings()
