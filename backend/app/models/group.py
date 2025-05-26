from sqlalchemy import Column, Integer, String, TIMESTAMP, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base
from .group_user import GroupUser

class Group(Base):
    __tablename__ = "groupss"

    group_id = Column(Integer, primary_key=True, index=True)
    group_name = Column(String(100), nullable=False)
    group_code = Column(String(10), unique=True, nullable=False)
    class_id = Column(Integer, ForeignKey("classes.class_id"), nullable=False)
    created_by = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), nullable=True, onupdate=func.now())

    # Relationships
    classroom = relationship("Class", back_populates="groups")
    members = relationship("GroupUser", back_populates="group", cascade="all, delete-orphan")

