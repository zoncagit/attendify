from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import base64

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate
from app.auth.utils import verify_token, get_password_hash
from fastapi.security import OAuth2PasswordBearer
from app.ai.face_recognition import process_face_image

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )
    user = db.query(User).filter(User.email == payload.get("sub")).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/me", response_model=UserResponse)
async def update_current_user(
    user_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if user_data.email and user_data.email != current_user.email:
        # Check if email is already taken
        existing_user = db.query(User).filter(User.email == user_data.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
    
    if user_data.password:
        user_data.password = get_password_hash(user_data.password)
    
    for field, value in user_data.dict(exclude_unset=True).items():
        setattr(current_user, field, value)
    
    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/me/face")
async def update_face_embeddings(
    face_image: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Process face image and get embeddings
    face_embeddings = await process_face_image(face_image)
    if not face_embeddings:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not detect face in image"
        )
    
    # Update user's face embeddings
    current_user.face_embeddings = face_embeddings
    db.commit()
    return {"message": "Face embeddings updated successfully"}

@router.get("/me/attendance-stats")
async def get_attendance_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Get all attendance records for the user
    attendance_records = db.query(AttendanceRecord).filter(
        AttendanceRecord.user_id == current_user.id
    ).all()
    
    # Calculate statistics
    total_sessions = len(attendance_records)
    present_sessions = len([r for r in attendance_records if r.status == "present"])
    attendance_percentage = (present_sessions / total_sessions * 100) if total_sessions > 0 else 0
    
    return {
        "total_sessions": total_sessions,
        "present_sessions": present_sessions,
        "attendance_percentage": attendance_percentage
    } 