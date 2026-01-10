from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from app.database import Base

class PreVerification(Base):
    __tablename__ = "pre_verifications"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    name = Column(String(50), nullable=False)
    prenom = Column(String(50), nullable=False)
    verification_code = Column(String)
    password = Column(String, nullable=False)  # Store plain password for verification
    password_hash = Column(String, nullable=False)  # Keep for backward compatibility
    created_at = Column(DateTime, default=func.now())
    expires_at = Column(DateTime)
