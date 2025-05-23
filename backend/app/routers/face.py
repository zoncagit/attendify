import base64
import cv2
import numpy as np
from fastapi import APIRouter, HTTPException
from app.schemas.face import FaceRecognitionRequest, FaceRecognitionResponse
from app.services.face_recognition_service import FaceRecognitionService

router = APIRouter(prefix="/face", tags=["face"])
face_service = FaceRecognitionService()

@router.post("/recognize", response_model=FaceRecognitionResponse)
async def recognize_face(request: FaceRecognitionRequest):
    try:
        # Decode base64 image
        image_data = base64.b64decode(request.image_data)
        nparr = np.frombuffer(image_data, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            raise HTTPException(status_code=400, detail="Invalid image data")

        # Recognize face
        person_name, confidence = face_service.recognize_face(image)
        
        return FaceRecognitionResponse(
            recognized=person_name != "Unknown",
            person_name=person_name,
            confidence=float(confidence) if confidence else None
        )
    except Exception as e:
        return FaceRecognitionResponse(
            recognized=False,
            error=str(e)
        ) 