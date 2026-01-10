from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import Any, Dict
import os
import uuid
from pathlib import Path

from app.database import get_db
from app.crud import user as user_crud
from app.schemas.user import UserOut, UserProfile, UserUpdate
from app.auth.oauth2 import get_current_user
from app.models.user import User
from fastapi import status

router = APIRouter(prefix="/api/v1/users", tags=["Users"])

# Configure upload directory (PythonAnywhere compatible)
UPLOAD_DIR = Path(__file__).parent.parent.parent / "static" / "uploads" / "profiles"
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


@router.get("/me", response_model=UserOut)
def read_current_user(current_user: User = Depends(get_current_user)):
    """Get current user's information"""
    # Convert User model to UserOut schema
    return UserOut(
        user_id=current_user.user_id,
        name=current_user.name,
        prenom=current_user.prenom,
        email=current_user.email,
        created_at=current_user.created_at,
        updated_at=current_user.updated_at
    )

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
        "first_name": user.first_name if hasattr(user, 'first_name') else user.name,
        "last_name": user.last_name if hasattr(user, 'last_name') else user.prenom,
        "role": role,
        "is_active": user.is_active,
        "created_at": user.created_at,
        "updated_at": user.updated_at,
        "profile_picture": user.profile_photo if hasattr(user, 'profile_photo') else None
    }
    
    # Add any additional profile fields that might exist
    if hasattr(user, 'phone_number'):
        profile_data["phone_number"] = user.phone_number
    if hasattr(user, 'bio'):
        profile_data["bio"] = user.bio
        
    return UserProfile(**profile_data)

@router.put("/profile/update", response_model=UserProfile)
async def update_user_profile(
    profile_data: UserUpdate,
    current_user: UserOut = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update the current user's profile information
    """
    try:
        # Get the current user from database
        user = db.query(User).filter(User.user_id == current_user.user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Update the fields
        for field, value in profile_data.dict(exclude_unset=True).items():
            setattr(user, field, value)

        db.commit()
        db.refresh(user)

        # Return updated profile
        return {
            **user.__dict__,
            "role": user_crud.get_user_role(db, user.user_id),
            "profile_picture": user.profile_photo if hasattr(user, 'profile_photo') else None
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while updating profile: {str(e)}"
        )


@router.post("/profile/photo")
async def upload_profile_photo(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload a profile photo for the current user.
    
    - Accepts: JPG, JPEG, PNG, GIF, WEBP
    - Max size: 5MB
    - Returns: URL path to the uploaded photo
    """
    # Validate file extension
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Read file content
    content = await file.read()
    
    # Validate file size
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds 5MB limit"
        )
    
    # Create upload directory if it doesn't exist
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    
    # Generate unique filename
    unique_filename = f"{current_user.user_id}_{uuid.uuid4().hex[:8]}{file_ext}"
    file_path = UPLOAD_DIR / unique_filename
    
    # Delete old photo if exists
    user = db.query(User).filter(User.user_id == current_user.user_id).first()
    if user.profile_photo:
        old_path = Path(__file__).parent.parent.parent / user.profile_photo.lstrip("/")
        if old_path.exists():
            try:
                old_path.unlink()
            except Exception:
                pass  # Ignore deletion errors
    
    # Save file
    try:
        with open(file_path, "wb") as f:
            f.write(content)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file: {str(e)}"
        )
    
    # Update user profile photo path in database
    relative_path = f"/static/uploads/profiles/{unique_filename}"
    user.profile_photo = relative_path
    db.commit()
    
    return {
        "success": True,
        "message": "Profile photo uploaded successfully",
        "photo_url": relative_path
    }

