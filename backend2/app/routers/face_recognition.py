from fastapi import APIRouter, WebSocket, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.face_recognition_service import FaceRecognitionService
from app.auth.auth import get_current_user
from app.models.user import User
from typing import List, Tuple
from pydantic import BaseModel

router = APIRouter(prefix="/face-recognition", tags=["Face Recognition"])

class FaceRegistrationRequest(BaseModel):
    image_data: str

class FaceRegistrationResponse(BaseModel):
    success: bool

class FaceDetectionResponse(BaseModel):
    face_locations: List[Tuple[int, int, int, int]]

@router.websocket("/ws/{user_id}")
async def face_recognition_websocket(websocket: WebSocket, user_id: int):
    """WebSocket endpoint for real-time face recognition."""
    from app.websockets.face_recognition import handle_face_recognition_websocket
    await handle_face_recognition_websocket(websocket, user_id)

@router.post("/register", response_model=FaceRegistrationResponse)
async def register_face(
    request: FaceRegistrationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Register a face for the current user."""
    service = FaceRecognitionService(db)
    success = service.register_face(current_user.user_id, request.image_data)
    return FaceRegistrationResponse(success=success)

@router.post("/detect", response_model=FaceDetectionResponse)
async def detect_faces(
    request: FaceRegistrationRequest,
    db: Session = Depends(get_db)
):
    """Detect faces in an image."""
    service = FaceRecognitionService(db)
    face_locations = service.detect_faces(request.image_data)
    return FaceDetectionResponse(face_locations=face_locations) 