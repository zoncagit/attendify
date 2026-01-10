"""
Notification router for triggering attendance-related emails.
Uses FastAPI BackgroundTasks for async email sending.
"""
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional
from datetime import date, datetime, timedelta
from pydantic import BaseModel

from app.database import get_db
from app.auth.oauth2 import get_current_user
from app.models import User, ClassUser, Class, Session as SessionModel, Attendance
from app.models.attendance import AttendanceStatus
from app.services.notification_service import get_notification_service
from app.crud import analytics as analytics_crud

router = APIRouter(prefix="/api/v1/notifications", tags=["Notifications"])


class AbsenceCheckRequest(BaseModel):
    """Request for triggering absence checks."""
    class_id: int
    warning_threshold: int = 3  # Default: warn after 3 absences


class ReminderRequest(BaseModel):
    """Request for sending class reminders."""
    class_id: int
    session_id: int


class NotificationResponse(BaseModel):
    """Response for notification operations."""
    success: bool
    message: str
    emails_sent: int = 0


def _check_creator_access(db: Session, user_id: int, class_id: int) -> None:
    """Check if user is the class creator/admin."""
    class_user = db.query(ClassUser).filter(
        ClassUser.class_id == class_id,
        ClassUser.user_id == user_id,
        ClassUser.role == "admin"
    ).first()
    
    if not class_user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only class creators can send notifications"
        )


def send_absence_warnings_task(
    db: Session,
    class_id: int,
    warning_threshold: int
):
    """Background task to send absence warning emails."""
    notification_service = get_notification_service()
    
    # Get class info
    class_info = db.query(Class).filter(Class.class_id == class_id).first()
    if not class_info:
        return 0
    
    # Get student statistics
    stats = analytics_crud.get_students_statistics(db, class_id)
    
    emails_sent = 0
    for student_stat in stats:
        absences = student_stat["total_sessions"] - student_stat["attended"]
        
        if absences >= warning_threshold:
            # Get student details
            student = db.query(User).filter(User.user_id == student_stat["user_id"]).first()
            if student:
                success = notification_service.send_absence_warning(
                    to_email=student.email,
                    student_name=f"{student.name} {student.prenom}",
                    class_name=class_info.class_name,
                    absence_count=absences,
                    total_sessions=student_stat["total_sessions"],
                    attendance_percentage=student_stat["percentage"]
                )
                if success:
                    emails_sent += 1
    
    return emails_sent


def send_class_reminders_task(
    db: Session,
    class_id: int,
    session_id: int
):
    """Background task to send class reminder emails."""
    notification_service = get_notification_service()
    
    # Get class and session info
    class_info = db.query(Class).filter(Class.class_id == class_id).first()
    session_info = db.query(SessionModel).filter(SessionModel.session_id == session_id).first()
    
    if not class_info or not session_info:
        return 0
    
    # Get all students in the class
    students = db.query(User).join(
        ClassUser, User.user_id == ClassUser.user_id
    ).filter(
        ClassUser.class_id == class_id,
        ClassUser.role != 'admin'
    ).all()
    
    emails_sent = 0
    for student in students:
        success = notification_service.send_class_reminder(
            to_email=student.email,
            student_name=f"{student.name} {student.prenom}",
            class_name=class_info.class_name,
            session_topic=session_info.session_topic,
            session_time=str(session_info.start_time) if session_info.start_time else "TBD",
            session_date=session_info.session_date.isoformat() if session_info.session_date else "TBD"
        )
        if success:
            emails_sent += 1
    
    return emails_sent


def send_missed_class_notifications_task(
    db: Session,
    session_id: int
):
    """Background task to send missed class notifications."""
    notification_service = get_notification_service()
    
    # Get session info
    session_info = db.query(SessionModel).filter(SessionModel.session_id == session_id).first()
    if not session_info:
        return 0
    
    # Get class info
    class_info = db.query(Class).filter(Class.class_id == session_info.class_id).first()
    if not class_info:
        return 0
    
    # Get students who were absent (not marked as present)
    present_user_ids = db.query(Attendance.user_id).filter(
        Attendance.session_id == session_id,
        Attendance.status == AttendanceStatus.present
    ).all()
    present_ids = [u.user_id for u in present_user_ids]
    
    # Get all students not in present list
    absent_students = db.query(User).join(
        ClassUser, User.user_id == ClassUser.user_id
    ).filter(
        ClassUser.class_id == session_info.class_id,
        ClassUser.role != 'admin',
        ~User.user_id.in_(present_ids) if present_ids else True
    ).all()
    
    emails_sent = 0
    for student in absent_students:
        success = notification_service.send_missed_class_notification(
            to_email=student.email,
            student_name=f"{student.name} {student.prenom}",
            class_name=class_info.class_name,
            session_topic=session_info.session_topic,
            session_date=session_info.session_date.isoformat() if session_info.session_date else "N/A"
        )
        if success:
            emails_sent += 1
    
    return emails_sent


@router.post("/absence-check", response_model=NotificationResponse)
async def trigger_absence_check(
    request: AbsenceCheckRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Trigger absence warning emails for students exceeding the threshold.
    Only class creators/admins can trigger this.
    """
    _check_creator_access(db, current_user.user_id, request.class_id)
    
    # Run synchronously for now (PythonAnywhere doesn't support background workers well)
    emails_sent = send_absence_warnings_task(db, request.class_id, request.warning_threshold)
    
    return NotificationResponse(
        success=True,
        message=f"Absence warning emails sent to {emails_sent} student(s)",
        emails_sent=emails_sent
    )


@router.post("/send-reminders", response_model=NotificationResponse)
async def send_class_reminders(
    request: ReminderRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Send reminder emails for an upcoming class session.
    Only class creators/admins can trigger this.
    """
    _check_creator_access(db, current_user.user_id, request.class_id)
    
    # Verify session exists and belongs to class
    session = db.query(SessionModel).filter(
        SessionModel.session_id == request.session_id,
        SessionModel.class_id == request.class_id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Run synchronously for now
    emails_sent = send_class_reminders_task(db, request.class_id, request.session_id)
    
    return NotificationResponse(
        success=True,
        message=f"Reminder emails sent to {emails_sent} student(s)",
        emails_sent=emails_sent
    )


@router.post("/missed-class/{session_id}", response_model=NotificationResponse)
async def send_missed_class_notifications(
    session_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Send missed class notifications to absent students.
    Only class creators/admins can trigger this.
    """
    # Get session to verify class
    session = db.query(SessionModel).filter(SessionModel.session_id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    _check_creator_access(db, current_user.user_id, session.class_id)
    
    # Run synchronously for now
    emails_sent = send_missed_class_notifications_task(db, session_id)
    
    return NotificationResponse(
        success=True,
        message=f"Missed class notifications sent to {emails_sent} student(s)",
        emails_sent=emails_sent
    )
