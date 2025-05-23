from pydantic import BaseModel
from typing import Optional

class FaceRecognitionRequest(BaseModel):
    image_data: str  # Base64 encoded image data

class FaceRecognitionResponse(BaseModel):
    recognized: bool
    person_name: Optional[str] = None
    confidence: Optional[float] = None
    error: Optional[str] = None 