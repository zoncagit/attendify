from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import crud
from app.schemas import classroom, user
from app.auth.oauth2 import get_current_user

router = APIRouter(prefix="/classes", tags=["Classrooms"])

@router.post("/", response_model=classroom.ClassOut)
def create_class(
    class_data: classroom.ClassCreate,
    db: Session = Depends(get_db),
    current_user: user.UserOut = Depends(get_current_user)
):
    return crud.create_class(db, class_data=class_data, creator_id=current_user.user_id)

@router.get("/{class_id}", response_model=classroom.ClassOut)
def read_class(class_id: int, db: Session = Depends(get_db)):
    db_class = crud.get_class_by_id(db, class_id=class_id)
    if db_class is None:
        raise HTTPException(status_code=404, detail="Class not found")
    return db_class