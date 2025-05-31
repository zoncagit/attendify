from enum import Enum
from sqlalchemy import Column, Integer, String, Text, Boolean, TIMESTAMP, ForeignKey, Enum as SQLEnum
from sqlalchemy.sql import func
from app.database import Base
from sqlalchemy.orm import relationship, backref
from datetime import datetime, timedelta
import secrets

class UserRole(str, Enum):
    """User roles with different permission levels."""
    STUDENT = "student"
    TEACHER = "teacher"
    ADMIN = "admin"

class EmailVerificationToken(Base):
    __tablename__ = "user_verifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False)
    verification_code = Column(String(6), nullable=False, index=True)
    expires_at = Column(TIMESTAMP, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
    
    # Relationship
    user = relationship("User", back_populates="verification_tokens")
    
    def __init__(self, user_id: int, expires_in_hours: int = 24):
        self.user_id = user_id
        self.verification_code = self._generate_verification_code()
        self.expires_at = datetime.utcnow() + timedelta(hours=expires_in_hours)
    
    def is_expired(self) -> bool:
        return datetime.utcnow() > self.expires_at
        
    @staticmethod
    def _generate_verification_code() -> str:
        """Generate a 6-digit verification code."""
        import random
        return ''.join([str(random.randint(0, 9)) for _ in range(6)])

class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False)
    prenom = Column(String(50), nullable=False)
    email = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), onupdate=func.now())
    last_login = Column(TIMESTAMP(timezone=True), nullable=True)
    
    # Authentication & Status
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    is_superuser = Column(Boolean, default=False, nullable=False)
    
    # Roles and Permissions
    role = Column(SQLEnum(UserRole), default=UserRole.STUDENT, nullable=False)
    

    
    # Relationships
    created_classes = relationship("Class", back_populates="creator")
    class_associations = relationship("ClassUser", back_populates="user")
    attendance_records = relationship("Attendance", back_populates="user")
    logs = relationship("Log", back_populates="user")
    created_sessions = relationship("Session", back_populates="creator")
    reset_tokens = relationship("PasswordResetToken", back_populates="user", cascade="all, delete-orphan")
    verification_tokens = relationship("EmailVerificationToken", back_populates="user", cascade="all, delete-orphan")
    group_memberships = relationship("GroupUser", back_populates="user", cascade="all, delete-orphan")