from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import crud, schemas
from app.auth.oauth2 import get_current_user

router = APIRouter(prefix="/sessions", tags=["Sessions"])

@router.post("/", response_model=schemas.SessionOut)
def create_session(
    session_data: schemas.SessionCreate,
    db: Session = Depends(get_db),
    current_user: schemas.UserOut = Depends(get_current_user)
):
    return crud.create_session(db, session_data=session_data, creator_id=current_user.user_id)

@router.get("/{session_id}", response_model=schemas.SessionOut)
def read_session(session_id: int, db: Session = Depends(get_db)):
    db_session = crud.get_session_by_id(db, session_id=session_id)
    if db_session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return db_session