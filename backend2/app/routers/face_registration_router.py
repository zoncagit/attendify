from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, WebSocket
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth.oauth2 import get_current_user
from app.models.user import User
from app.services.face_recognition_service import FaceRecognitionService
import numpy as np
import pickle
import logging
import cv2
import base64
from typing import List
import json

router = APIRouter(prefix="/face-registration", tags=["Face Registration"])
face_service = FaceRecognitionService()
logger = logging.getLogger(__name__)

@router.websocket("/ws/register")
async def register_face_websocket(
    websocket: WebSocket,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    WebSocket endpoint for collecting multiple face embeddings from live camera feed
    """
    await websocket.accept()
    
    try:
        # Initialize face detection
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        
        # List to store embeddings
        embeddings = []
        count = 0
        max_samples = 30  # Number of samples to collect
        
        while count < max_samples:
            # Receive frame data
            data = await websocket.receive_text()
            frame_data = json.loads(data)
            
            # Process frame
            image_data = frame_data.get("image")
            if not image_data:
                continue
            
            # Remove data URL prefix if present
            if ',' in image_data:
                image_data = image_data.split(',')[1]
            
            # Decode base64 to bytes
            image_bytes = base64.b64decode(image_data)
            
            # Convert to numpy array
            nparr = np.frombuffer(image_bytes, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            # Convert to grayscale for face detection
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            
            # Detect faces
            faces = face_cascade.detectMultiScale(gray, 1.3, 5)
            
            for (x, y, w, h) in faces:
                # Extract face region
                face_roi = frame[y:y+h, x:x+w]
                
                # Resize to model input size
                resized_face = cv2.resize(face_roi, (160, 160))
                
                # Normalize
                normalized_face = resized_face.astype('float32') / 255.0
                
                # Get embedding
                embedding = face_service.keras_model.predict(
                    np.expand_dims(normalized_face, axis=0),
                    verbose=0
                )[0]
                
                embeddings.append(embedding)
                count += 1
                
                # Draw rectangle around face
                cv2.rectangle(frame, (x, y), (x+w, y+h), (200, 0, 0), 2)
                
                # Send progress update
                await websocket.send_json({
                    "status": "progress",
                    "count": count,
                    "max_samples": max_samples
                })
                
                break  # Process only one face per frame
            
            # Send frame with rectangle
            _, buffer = cv2.imencode('.jpg', frame)
            frame_base64 = base64.b64encode(buffer).decode('utf-8')
            await websocket.send_json({
                "status": "frame",
                "image": f"data:image/jpeg;base64,{frame_base64}"
            })
        
        # Calculate mean embedding
        if embeddings:
            mean_embedding = np.mean(embeddings, axis=0)
            
            # Convert to bytes for storage
            face_embedding_bytes = pickle.dumps(mean_embedding)
            
            # Update user's face embedding
            current_user.face_embedding = face_embedding_bytes
            db.commit()
            
            await websocket.send_json({
                "status": "success",
                "message": "Face registered successfully",
                "samples_collected": len(embeddings)
            })
        else:
            await websocket.send_json({
                "status": "error",
                "message": "No face embeddings collected"
            })
            
    except Exception as e:
        logger.error(f"Error in face registration: {str(e)}")
        await websocket.send_json({
            "status": "error",
            "message": f"Error: {str(e)}"
        })
    finally:
        await websocket.close()

@router.post("/verify")
async def verify_face(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Verify a user's face against their stored embedding
    """
    try:
        # Read image file
        contents = await file.read()
        
        # Convert to base64
        image_data = base64.b64encode(contents).decode('utf-8')
        
        # Get face encoding using custom Keras model
        face_encoding = face_service.encode_face_with_keras(image_data)
        
        if face_encoding is None:
            raise HTTPException(
                status_code=400,
                detail="No face detected in image"
            )
        
        # Get stored embedding
        if not current_user.face_embedding:
            raise HTTPException(
                status_code=400,
                detail="No face embedding found for this user"
            )
        
        stored_encoding = pickle.loads(current_user.face_embedding)
        
        # Compare faces
        matches = face_service.compare_faces([stored_encoding], face_encoding)
        distance = face_service.calculate_face_distance([stored_encoding], face_encoding)[0]
        
        return {
            "verified": matches[0],
            "distance": float(distance)
        }
        
    except Exception as e:
        logger.error(f"Error verifying face: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error verifying face: {str(e)}"
        ) 