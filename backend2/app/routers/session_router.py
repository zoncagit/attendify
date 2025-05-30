import secrets
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Query
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Optional

from app.database import get_db
from app import crud, schemas, models
from app.auth.oauth2 import get_current_user
from app.schemas.session import AttendanceMarkRequest, QRCodeStatus, SessionShareLink

router = APIRouter(prefix="/api/v1/sessions", tags=["Sessions"])
FRONTEND_URL = "http://localhost:5500"  # Update this with your frontend URL

@router.post("/sessions/", response_model=schemas.SessionOut, status_code=status.HTTP_201_CREATED)
def create_session(
    session_data: schemas.SessionCreate,
    db: Session = Depends(get_db),
    current_user: schemas.UserOut = Depends(get_current_user)
):
    """Create a new session"""
    return crud.create_session(db, session_data=session_data, creator_id=current_user.user_id)

@router.get("/sessions/{session_id}", response_model=schemas.SessionOut)
def read_session(
    session_id: int, 
    db: Session = Depends(get_db),
    current_user: schemas.UserOut = Depends(get_current_user)
):
    """Get session by ID"""
    db_session = crud.get_session_by_id(db, session_id=session_id)
    if db_session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return db_session

@router.post("/sessions/{session_id}/end", response_model=schemas.SessionOut)
def end_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.UserOut = Depends(get_current_user)
):
    """End an active session"""
    db_session = crud.get_session_by_id(db, session_id=session_id)
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if db_session.end_time:
        raise HTTPException(status_code=400, detail="Session is already ended")
        
    return crud.end_session(db, session_id=session_id)

@router.get("/sessions/group/{group_id}", response_model=List[schemas.SessionOut])
def list_group_sessions(
    group_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: schemas.UserOut = Depends(get_current_user)
):
    """List all sessions for a specific group"""
    return crud.get_sessions_by_group(db, group_id=group_id, skip=skip, limit=limit)

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

@router.post("/sessions/{session_id}/refresh-qr", response_model=schemas.SessionOut)
def refresh_session_qr(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.UserOut = Depends(get_current_user)
):
    """Refresh the QR code for a session"""
    # Only teachers/admins can refresh QR codes
    if current_user.role not in ["teacher", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers and admins can refresh QR codes"
        )
    
    session = crud.refresh_qr_code(db, session_id=session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return session

@router.post("/sessions/mark-attendance", response_model=schemas.Attendance)
def mark_attendance(
    attendance_data: AttendanceMarkRequest,
    db: Session = Depends(get_db),
    current_user: schemas.UserOut = Depends(get_current_user)
):
    """Mark attendance using a QR code"""
    # Use the current user's ID if not specified
    user_id = attendance_data.user_id or current_user.user_id
    
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

@router.get("/sessions/{session_id}/attendance", response_model=List[schemas.AttendanceOut])
async def get_session_attendance(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.UserOut = Depends(get_current_user)
):
    """Get attendance records for a session"""
    # Verify session exists and user has access
    db_session = crud.get_session_by_id(db, session_id=session_id)
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Only session creator or admin can view attendance
    if db_session.created_by != current_user.user_id and current_user.role not in ["admin", "teacher"]:
        raise HTTPException(status_code=403, detail="Not authorized to view this session's attendance")
    
    # Get attendance records
    attendance = db.query(models.Attendance).filter(
        models.Attendance.session_id == session_id
    ).all()
    
    return attendance

@router.get("/{session_id}/share-link", response_model=SessionShareLink)
async def get_shareable_link(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.UserOut = Depends(get_current_user)
):
    """Get a shareable link for marking attendance"""
    session = crud.get_session_by_id(db, session_id=session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Verify user is the session creator or has admin/teacher role
    if session.created_by != current_user.user_id and current_user.role not in ["admin", "teacher"]:
        raise HTTPException(status_code=403, detail="Not authorized to share this session")
    
    # Create or reuse share token
    if not session.share_token:
        session.share_token = secrets.token_urlsafe(32)
        db.commit()
        db.refresh(session)
    
    # Return the shareable link
    return {
        "share_link": f"{FRONTEND_URL}/attend/{session_id}?token={session.share_token}",
        "expires_at": session.qr_expires_at
    }

@router.post("/{session_id}/mark-via-link", response_model=schemas.AttendanceOut)
async def mark_attendance_via_link(
    session_id: int,
    token: str = Query(..., description="Share token from the shareable link"),
    db: Session = Depends(get_db),
    current_user: schemas.UserOut = Depends(get_current_user)
):
    """Mark attendance via shareable link"""
    session = crud.get_session_by_id(db, session_id=session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Verify the token matches
    if session.share_token != token:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    
    # Check if QR code is still valid
    if not session.is_qr_valid:
        raise HTTPException(status_code=400, detail="This attendance link has expired")
    
    # Check if user is in the class
    class_user = db.query(models.ClassUser).filter_by(
        class_id=session.class_id,
        user_id=current_user.user_id
    ).first()
    
    if not class_user:
        raise HTTPException(status_code=403, detail="You are not a member of this class")
    
    # Check if user is already marked present
    existing_attendance = db.query(models.Attendance).filter_by(
        session_id=session_id,
        user_id=current_user.user_id
    ).first()
    
    if existing_attendance:
        raise HTTPException(status_code=400, detail="Attendance already marked")
    
    # Mark attendance
    attendance = models.Attendance(
        session_id=session_id,
        user_id=current_user.user_id,
        status=models.AttendanceStatus.PRESENT
    )
    
    db.add(attendance)
    db.commit()
    db.refresh(attendance)
    
    return attendance