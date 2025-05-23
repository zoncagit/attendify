from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.attendance import AttendanceMethod

class SessionBase(BaseModel):
    class_id: int

class SessionCreate(SessionBase):
    pass

class SessionResponse(SessionBase):
    id: int
    start_time: datetime
    end_time: Optional[datetime] = None
    qr_code: str
    qr_code_expires_at: datetime
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class AttendanceBase(BaseModel):
    session_id: int
    user_id: int
    marked_at: datetime
    method: AttendanceMethod

class AttendanceResponse(AttendanceBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True