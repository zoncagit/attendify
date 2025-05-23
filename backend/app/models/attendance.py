from sqlalchemy import Column, Integer, Enum, TIMESTAMP, ForeignKey
from sqlalchemy.sql import func
from app.database import Base
import enum
from sqlalchemy.orm import relationship

class AttendanceStatus(str, enum.Enum):
    present = "present"
    absent = "absent"

class Attendance(Base):
    __tablename__ = "attendance"

    session_id = Column(Integer, ForeignKey("sessions.session_id"), primary_key=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), primary_key=True)
    marked_at = Column(TIMESTAMP, server_default=func.now())
    status = Column(Enum(AttendanceStatus), nullable=False)
    
    # Relationships
    session = relationship("Session", back_populates="attendance_records")
    user = relationship("User", back_populates="attendance_records")