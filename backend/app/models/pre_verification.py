from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from app.database import Base

class PreVerification(Base):
    __tablename__ = "pre_verifications"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    verification_code = Column(String)
    created_at = Column(DateTime, default=func.now())
    expires_at = Column(DateTime)
