from sqlalchemy import Column, Integer, String, TIMESTAMP, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class Class(Base):
    __tablename__ = "classes"

    class_id = Column(Integer, primary_key=True, index=True)
    class_name = Column(String(100), nullable=False)
    class_code = Column(String(10), unique=True, nullable=False)
    created_by = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), onupdate=func.now())

    # Relationships
    creator = relationship("User", back_populates="created_classes")
    user_associations = relationship("ClassUser", back_populates="classroom")
    sessions = relationship("Session", back_populates="classroom")