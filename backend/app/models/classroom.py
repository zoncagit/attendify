from sqlalchemy import Column, Integer, String, TIMESTAMP, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class Class(Base):
    __tablename__ = "classes"

    class_id = Column(Integer, primary_key=True, index=True)
    class_name = Column(String(100), nullable=False)
    class_code = Column(String(10), unique=True, nullable=False)
    subject = Column(String(100), nullable=True)  # New: subject field per specs
    attendance_settings = Column(JSON, default={"warning_threshold": 3, "low_percentage_threshold": 75})  # New: settings
    created_by = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), onupdate=func.now())

    # Relationships
    creator = relationship("User", back_populates="created_classes")
    user_associations = relationship("ClassUser", back_populates="classroom")
    sessions = relationship("Session", back_populates="classroom")
    groups = relationship("Group", back_populates="classroom")