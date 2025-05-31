from pydantic_settings import BaseSettings
from pathlib import Path

class Settings(BaseSettings):
    # Database settings
    DATABASE_URL: str = f"sqlite:///{Path(__file__).parent.parent.parent}/sql_app.db"
    
    # JWT settings
    SECRET_KEY: str = "your-secret-key-here"  # Change this in production
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Face recognition settings
    FACE_RECOGNITION_THRESHOLD: float = 0.6
    FACE_DETECTION_CONFIDENCE: float = 0.5

    # Recovery code settings
    RECOVERY_CODE_EXPIRY_MINUTES: int = 15

    class Config:
        env_file = ".env"
        extra = "allow"  # Allow extra fields in the settings

settings = Settings() 