from enum import Enum as PyEnum
from sqlalchemy import Column, Integer, String, Date, Time, Text, ForeignKey, TIMESTAMP, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class QRCodeStatus(str, PyEnum):
    ACTIVE = "active"
    EXPIRED = "expired"
    USED = "used"

class Session(Base):
    __tablename__ = "sessions"

    session_id = Column(Integer, primary_key=True, index=True)
    class_id = Column(Integer, ForeignKey("classes.class_id"))
    session_topic = Column(String(255))
    session_date = Column(Date, nullable=False)
    start_time = Column(Time)
    end_time = Column(Time)
    created_by = Column(Integer, ForeignKey("users.user_id"))
    qr_code = Column(Text)
    share_token = Column(String(255), unique=True, nullable=True)
    qr_status = Column(
        Enum(QRCodeStatus, name="qr_code_status"),
        default=QRCodeStatus.ACTIVE,
        nullable=False
    )
    qr_expires_at = Column(TIMESTAMP(timezone=True))
    qr_last_updated_at = Column(TIMESTAMP(timezone=True))
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    classroom = relationship("Class", back_populates="sessions")
    attendance_records = relationship("Attendance", back_populates="session")
    creator = relationship("User", back_populates="created_sessions")

    @property
    def is_qr_valid(self) -> bool:
        """Check if the QR code is currently valid"""
        if not self.qr_code or self.qr_status != QRCodeStatus.ACTIVE:
            return False
            
        if self.qr_expires_at and self.qr_expires_at < func.now():
            self.qr_status = QRCodeStatus.EXPIRED
            return False
            
        return True