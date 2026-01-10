"""
Schemas for attendance analytics and statistics.
"""
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import date, time


class UserStatistics(BaseModel):
    """Attendance statistics for a single user in a class."""
    user_id: int
    class_id: int
    total_sessions: int
    attended: int
    percentage: float
    
    class Config:
        from_attributes = True


class SessionLog(BaseModel):
    """Attendance log for a single session."""
    session_id: int
    session_topic: Optional[str]
    session_date: Optional[str]
    start_time: Optional[str]
    end_time: Optional[str]
    present_count: int
    total_marked: int
    total_members: int
    
    class Config:
        from_attributes = True


class StudentStatus(BaseModel):
    """Student's attendance status for today."""
    user_id: int
    name: str
    prenom: str
    email: str
    status: str  # "present", "absent", "no_session"
    
    class Config:
        from_attributes = True


class SessionInfo(BaseModel):
    """Minimal session info for today's attendance."""
    session_id: int
    topic: Optional[str]
    start_time: Optional[str]
    
    class Config:
        from_attributes = True


class TodayAttendance(BaseModel):
    """Today's attendance status for a class."""
    date: str
    sessions: List[SessionInfo]
    students: List[StudentStatus]
    
    class Config:
        from_attributes = True


class StudentStatistics(BaseModel):
    """Attendance statistics for a student."""
    user_id: int
    name: str
    prenom: str
    email: str
    total_sessions: int
    attended: int
    percentage: float
    is_low: bool  # True if percentage < threshold
    
    class Config:
        from_attributes = True


class AttendanceExportSession(BaseModel):
    """Session info for export."""
    session_id: int
    topic: Optional[str]
    date: str


class AttendanceExportStudent(BaseModel):
    """Student attendance for export."""
    user_id: int
    name: str
    prenom: str
    email: str
    attendance: Dict[int, str]  # session_id -> status


class AttendanceExportData(BaseModel):
    """Full attendance history for export."""
    sessions: List[AttendanceExportSession]
    students: List[AttendanceExportStudent]
    total_sessions: int
