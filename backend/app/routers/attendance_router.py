from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import crud, schemas
from app.auth.oauth2 import get_current_user

router = APIRouter(prefix="/attendance", tags=["Attendance"])

@router.post("/", response_model=schemas.AttendanceOut)
def mark_attendance(
    attendance_data: schemas.AttendanceCreate,
    db: Session = Depends(get_db),
    current_user: schemas.UserOut = Depends(get_current_user)
):
    return crud.mark_attendance(db, data=attendance_data)

@router.get("/session/{session_id}", response_model=list[schemas.AttendanceOut])
def get_session_attendance(session_id: int, db: Session = Depends(get_db)):
    return crud.get_attendance_by_session(db, session_id=session_id)