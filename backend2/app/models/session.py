from sqlalchemy import Column, Integer, String, Date, Time, Text, TIMESTAMP, ForeignKey, Enum as SQLEnum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base
from enum import Enum
from sqlalchemy import Boolean

class SessionMethod(str, Enum):
    """Session attendance methods."""
    QR = "qr"
    FACE_SCAN = "face_scan"

class Session(Base):
    __tablename__ = "sessions"

    session_id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("groups.group_id"), nullable=False)
    method = Column(SQLEnum(SessionMethod), nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    ended_at = Column(TIMESTAMP(timezone=True), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    class_id = Column(Integer, ForeignKey("classes.class_id"))
    session_topic = Column(String(255))
    start_time = Column(Time)
    end_time = Column(Time)
    created_by = Column(Integer, ForeignKey("users.user_id"))
    qr_code = Column(Text)
    qr_last_updated_at = Column(TIMESTAMP(timezone=True))
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    group = relationship("Group", back_populates="sessions")
    attendance_records = relationship("Attendance", back_populates="session")
    classroom = relationship("Class", back_populates="sessions")
    creator = relationship("User", back_populates="created_sessions")

    def end_session(self):
        """End the current session."""
        self.is_active = False
        self.ended_at = func.now()