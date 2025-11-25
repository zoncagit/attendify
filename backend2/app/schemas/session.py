from pydantic import BaseModel, Field
from datetime import date, time, datetime
from typing import Optional, Dict, Any
from enum import Enum
from app.models.session import QRCodeStatus  # Import from models to ensure consistency

class SessionShareLink(BaseModel):
    share_link: str
    expires_at: datetime

    class Config:
        orm_mode = True
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }

class SessionBase(BaseModel):
    session_topic: Optional[str] = None
    session_date: date
    start_time: Optional[time] = None
    end_time: Optional[time] = None

class SessionCreate(SessionBase):
    class_id: int

class SessionQRCode(BaseModel):
    session_id: int
    expires_at: datetime
    status: QRCodeStatus = Field(default=QRCodeStatus.ACTIVE, description="QR code status")

class SessionOut(SessionBase):
    session_id: int
    class_id: int
    created_by: int
    qr_code: Optional[str] = Field(None, description="Base64 encoded QR code image")
    share_token: Optional[str] = Field(None, description="Token for shareable link")
    qr_status: QRCodeStatus = Field(..., description="Current status of the QR code")
    qr_expires_at: Optional[datetime] = Field(None, description="When the QR code expires")
    qr_last_updated_at: Optional[datetime] = Field(None, description="When the QR code was last updated")
    created_at: datetime
    updated_at: datetime
    attendance_count: int = Field(0, description="Number of attendance records for this session")

    class Config:
        orm_mode = True
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }

class AttendanceMarkRequest(BaseModel):
    qr_code: str
    user_id: int