from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.crud.user import get_user, get_user_by_email, get_user_role
from app.schemas.user import UserOut, UserProfile
from app.auth.oauth2 import get_current_user

router = APIRouter(tags=["Users"])

@router.get("/me", response_model=UserOut)
def read_current_user(current_user: UserOut = Depends(get_current_user)):
    return current_user

@router.get("/{user_id}", response_model=UserOut)
def read_user(user_id: int, db: Session = Depends(get_db)):
    db_user = get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

@router.get("/{user_id}/profile", response_model=UserProfile)
async def get_user_profile(user_id: int, db: Session = Depends(get_db)):
    user = get_user(db, user_id=user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get additional profile information
    profile = {
        **user.__dict__,
        "role": crud.get_user_role(db, user_id),
        "profile_picture": user.profile_picture if hasattr(user, 'profile_picture') else None
    }
    
    return profile