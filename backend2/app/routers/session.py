from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.session_service import SessionService
from app.models.session import SessionMethod
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, time

router = APIRouter(
    prefix="/sessions",
    tags=["Sessions"],
    responses={404: {"description": "Not found"}},
)

class SessionCreate(BaseModel):
    group_id: int
    method: SessionMethod
    class_id: Optional[int] = None
    session_topic: Optional[str] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    created_by: Optional[int] = None

class SessionResponse(BaseModel):
    session_id: int
    group_id: int
    method: SessionMethod
    created_at: datetime
    ended_at: Optional[datetime] = None
    is_active: bool
    class_id: Optional[int] = None
    session_topic: Optional[str] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    created_by: Optional[int] = None
    qr_code: Optional[str] = None
    qr_last_updated_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

@router.post("/", response_model=SessionResponse, summary="Create a new session")
def create_session(session_data: SessionCreate, db: Session = Depends(get_db)):
    """
    Create a new attendance session.
    
    - **group_id**: ID of the group for this session
    - **method**: Attendance method (qr or face_scan)
    - **class_id**: Optional ID of the associated class
    - **session_topic**: Optional topic for the session
    - **start_time**: Optional start time
    - **end_time**: Optional end time
    - **created_by**: Optional ID of the user creating the session
    """
    service = SessionService(db)
    try:
        session = service.create_session(
            group_id=session_data.group_id,
            method=session_data.method,
            class_id=session_data.class_id,
            session_topic=session_data.session_topic,
            start_time=session_data.start_time,
            end_time=session_data.end_time,
            created_by=session_data.created_by
        )
        return session
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/{session_id}", response_model=SessionResponse, summary="Get session by ID")
def get_session(session_id: int, db: Session = Depends(get_db)):
    """
    Get a session by its ID.
    
    - **session_id**: The ID of the session to retrieve
    """
    service = SessionService(db)
    session = service.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

@router.post("/{session_id}/end", response_model=SessionResponse, summary="End a session")
def end_session(session_id: int, db: Session = Depends(get_db)):
    """
    End an active session.
    
    - **session_id**: The ID of the session to end
    """
    service = SessionService(db)
    try:
        session = service.end_session(session_id)
        return session
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/group/{group_id}", response_model=List[SessionResponse], summary="List group sessions")
def list_group_sessions(group_id: int, limit: int = 10, db: Session = Depends(get_db)):
    """
    List recent sessions for a group.
    
    - **group_id**: The ID of the group
    - **limit**: Maximum number of sessions to return (default: 10)
    """
    service = SessionService(db)
    sessions = service.list_group_sessions(group_id, limit)
    return sessions

@router.get("/group/{group_id}/active", response_model=SessionResponse, summary="Get active session")
def get_active_session(group_id: int, db: Session = Depends(get_db)):
    """
    Get the active session for a group if it exists.
    
    - **group_id**: The ID of the group
    """
    service = SessionService(db)
    session = service.get_active_session(group_id)
    if not session:
        raise HTTPException(status_code=404, detail="No active session found")
    return session 