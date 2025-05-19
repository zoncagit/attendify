from pydantic import BaseModel
from datetime import datetime
from typing import Literal

class AttendanceCreate(BaseModel):
    session_id: int
    user_id: int
    status: Literal["present", "absent"]

class AttendanceOut(BaseModel):
    session_id: int
    user_id: int
    marked_at: datetime
    status: Literal["present", "absent"]

    class Config:
        orm_mode = True