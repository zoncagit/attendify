from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class LogCreate(BaseModel):
    user_id: int
    action_type: str
    description: Optional[str] = None

class LogOut(BaseModel):
    log_id: int
    user_id: int
    action_type: str
    description: Optional[str] = None
    timestamp: datetime

    class Config:
        orm_mode = True