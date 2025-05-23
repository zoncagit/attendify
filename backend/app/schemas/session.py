from pydantic import BaseModel
from datetime import date, time, datetime
from typing import Optional

class SessionBase(BaseModel):
    session_topic: Optional[str] = None
    session_date: date
    start_time: Optional[time] = None
    end_time: Optional[time] = None

class SessionCreate(SessionBase):
    class_id: int

class SessionOut(SessionBase):
    session_id: int
    class_id: int
    created_by: int
    qr_code: Optional[str] = None
    qr_last_updated_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True