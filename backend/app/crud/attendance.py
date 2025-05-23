from sqlalchemy.orm import Session
from app import models
from app.schemas import AttendanceCreate
from fastapi import HTTPException, status

def mark_attendance(db: Session, data: AttendanceCreate):
    session = db.query(models.Session).filter_by(session_id=data.session_id).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    user = db.query(models.User).filter_by(user_id=data.user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    attendance = models.Attendance(
        session_id=data.session_id,
        user_id=data.user_id,
        status=data.status
    )
    db.add(attendance)
    db.commit()
    db.refresh(attendance)
    return attendance

def get_attendance_by_session(db: Session, session_id: int):
    return db.query(models.Attendance).filter(models.Attendance.session_id == session_id).all()

def get_attendance_by_user(db: Session, user_id: int):
    return db.query(models.Attendance).filter(models.Attendance.user_id == user_id).all()