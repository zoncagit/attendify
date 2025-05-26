from sqlalchemy import Column, Integer, TIMESTAMP, ForeignKey, PrimaryKeyConstraint, String
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class ClassUser(Base):
    __tablename__ = "class_users"

    class_id = Column(Integer, ForeignKey("classes.class_id"))
    user_id = Column(Integer, ForeignKey("users.user_id"))
    role = Column(String(20), nullable=False, default="member")  # admin, member
    joined_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    __table_args__ = (
        PrimaryKeyConstraint('class_id', 'user_id'),
    )

    user = relationship("User", back_populates="class_associations")
    classroom = relationship("Class", back_populates="user_associations")