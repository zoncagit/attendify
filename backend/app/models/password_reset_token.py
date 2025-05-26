from sqlalchemy import Column, String, Integer, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime

class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"
    
    # Changed primary key to use user_id and token as composite key
    user_id = Column(Integer, ForeignKey("users.user_id"), primary_key=True)
    token = Column(String(6), primary_key=True)
    expires_at = Column(DateTime, nullable=False)

    # Relationships
    user = relationship("User", back_populates="reset_tokens")
    
    def __init__(self, **kwargs):
        # Make token uppercase for case-insensitive comparison
        if 'token' in kwargs:
            kwargs['token'] = kwargs['token'].upper()
        super().__init__(**kwargs)
