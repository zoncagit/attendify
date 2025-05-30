from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Any, Dict

from app.database import get_db
from app.crud import user as user_crud
from app.schemas.user import UserOut, UserProfile
from app.auth.oauth2 import get_current_user

router = APIRouter(prefix="/api/v1/users", tags=["Users"])

@router.get("/me", response_model=UserOut)
def read_current_user(current_user: UserOut = Depends(get_current_user)):
    """Get current user's information"""
    return current_user

@router.get("/{user_id}", response_model=UserOut)
def read_user(
    user_id: int, 
    db: Session = Depends(get_db),
    current_user: UserOut = Depends(get_current_user)
):
    """Get user by ID"""
    db_user = user_crud.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

@router.get("/{user_id}/profile", response_model=UserProfile)
def get_user_profile(
    user_id: int, 
    db: Session = Depends(get_db),
    current_user: UserOut = Depends(get_current_user)
):
    """Get detailed profile information for a user"""
    user = user_crud.get_user(db, user_id=user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get user role and other profile information
    role = user_crud.get_user_role(db, user_id)
    
    # Create profile response
    profile_data = {
        "user_id": user.user_id,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "role": role,
        "is_active": user.is_active,
        "created_at": user.created_at,
        "updated_at": user.updated_at,
        "profile_picture": user.profile_picture if hasattr(user, 'profile_picture') else None
    }
    
    # Add any additional profile fields that might exist
    if hasattr(user, 'phone_number'):
        profile_data["phone_number"] = user.phone_number
    if hasattr(user, 'bio'):
        profile_data["bio"] = user.bio
        
    return UserProfile(**profile_data)