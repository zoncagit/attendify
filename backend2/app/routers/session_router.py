from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app import crud, schemas, models
from app.auth.oauth2 import get_current_user
from app.schemas.session import AttendanceMarkRequest

router = APIRouter(prefix="/api/v1/sessions", tags=["Sessions"])

@router.post("/sessions/", response_model=schemas.SessionOut, status_code=status.HTTP_201_CREATED)
def create_session(
    session_data: schemas.SessionCreate,
    db: Session = Depends(get_db),
    current_user: schemas.UserOut = Depends(get_current_user)
):
    """Create a new session with a QR code for attendance"""
    # Only teachers/admins can create sessions
    if current_user.role not in ["teacher", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers and admins can create sessions"
        )
    return crud.create_session(db, session_data=session_data, creator_id=current_user.user_id)

@router.post("/sessions/mark-attendance", response_model=schemas.Attendance)
def mark_attendance(
    attendance_data: AttendanceMarkRequest,
    db: Session = Depends(get_db),
    current_user: schemas.UserOut = Depends(get_current_user)
):
    """Mark attendance using a QR code"""
    # Use the current user's ID
    user_id = current_user.user_id
    
    attendance = crud.mark_attendance(
        db, 
        qr_code=attendance_data.qr_code,
        user_id=user_id
    )
    
    if not attendance:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired QR code"
        )
    
    return attendance

@router.get("/sessions/group/{group_id}/active", response_model=schemas.SessionOut)
def get_active_session(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.UserOut = Depends(get_current_user)
):
    """Get the currently active session for a group"""
    active_session = crud.get_active_session_by_group(db, group_id=group_id)
    if not active_session:
        raise HTTPException(status_code=404, detail="No active session found for this group")
    return active_session