from sqlalchemy import Column, Integer, String, Text, TIMESTAMP, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class Log(Base):
    __tablename__ = "logs"

    log_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id"))
    action_type = Column(String(50), nullable=False)
    description = Column(Text)
    timestamp = Column(TIMESTAMP(timezone=True), server_default=func.now())
    
    # Relationship
    user = relationship("User", back_populates="logs")