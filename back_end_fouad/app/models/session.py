from sqlalchemy import Column, Integer, String, Date, Time, Text, TIMESTAMP, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class Session(Base):
    __tablename__ = "sessions"

    session_id = Column(Integer, primary_key=True, autoincrement=True)
    class_id = Column(Integer, ForeignKey("classes.class_id"))
    session_topic = Column(String(255))
    session_date = Column(Date, nullable=False)
    start_time = Column(Time)
    end_time = Column(Time)
    created_by = Column(Integer, ForeignKey("users.user_id"))
    qr_code = Column(Text)
    qr_last_updated_at = Column(TIMESTAMP(timezone=True))
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    classroom = relationship("Class", back_populates="sessions")
    attendance_records = relationship("Attendance", back_populates="session")
    creator = relationship("User", back_populates="created_sessions")