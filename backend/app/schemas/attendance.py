from enum import Enum
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List

class AttendanceStatus(str, Enum):
    PRESENT = "present"
    ABSENT = "absent"
    LATE = "late"
    EXCUSED = "excused"

class AttendanceBase(BaseModel):
    status: AttendanceStatus = Field(..., description="Attendance status")
    notes: Optional[str] = Field(None, description="Additional notes about the attendance")

class AttendanceCreate(AttendanceBase):
    session_id: int = Field(..., description="ID of the session")
    user_id: int = Field(..., description="ID of the user")

class AttendanceUpdate(AttendanceBase):
    status: Optional[AttendanceStatus] = Field(None, description="Updated status")
    notes: Optional[str] = Field(None, description="Updated notes")

class AttendanceOut(AttendanceBase):
    session_id: int
    user_id: int
    marked_at: datetime = Field(..., description="When the attendance was marked")
    marked_by: Optional[int] = Field(None, description="User ID who marked the attendance")
    
    class Config:
        orm_mode = True
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }

class AttendanceBulkCreate(BaseModel):
    user_ids: List[int] = Field(..., description="List of user IDs to mark attendance for")
    status: AttendanceStatus = Field(default=AttendanceStatus.PRESENT, description="Status to set for all users")
    notes: Optional[str] = Field(None, description="Notes to add to all attendance records")

class AttendanceStats(BaseModel):
    total: int = 0
    present: int = 0
    absent: int = 0
    late: int = 0
    excused: int = 0
    attendance_rate: float = 0.0