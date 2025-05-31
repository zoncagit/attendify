import cv2
import numpy as np
import tensorflow as tf
from pathlib import Path
import base64
import io
from PIL import Image
from app.services.model_handler import load_face_model
import logging
from typing import Optional, Tuple
import json

logger = logging.getLogger(__name__)

class FaceRecognitionService:
    def __init__(self):
        try:
            # Load Haar Cascade
            cascade_path = Path(__file__).parent.parent.parent / "ai" / "haarcascade_frontalface_default.xml"
            if not cascade_path.exists():
                raise FileNotFoundError(f"Face cascade file not found at {cascade_path}")
            self.face_cascade = cv2.CascadeClassifier(str(cascade_path))
            if self.face_cascade.empty():
                raise ValueError("Failed to load face cascade classifier")
            
            # Load Keras model
            model_path = Path(__file__).parent.parent.parent / "ai" / "model" / "trained_embedding_model_retrainedv4.keras"
            if not model_path.exists():
                raise FileNotFoundError(f"Face embedding model not found at {model_path}")
            self.embedding_model = load_face_model(str(model_path))
            
            logger.info("Face recognition service initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize face recognition service: {str(e)}", exc_info=True)
            raise
        
    def detect_face(self, image_data: str) -> Tuple[Optional[np.ndarray], Optional[str], Optional[str]]:
        """
        Detect a face in the image and return the face image and visualization.
        
        Args:
            image_data: Base64 encoded image data
            
        Returns:
            Tuple containing:
            - Face image as numpy array (or None if no face detected)
            - Visualization image as base64 string (or None if error)
            - Error message (or None if successful)
        """
        try:
            # Decode base64 image
            image_bytes = base64.b64decode(image_data.split(',')[1])
            nparr = np.frombuffer(image_bytes, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if image is None:
                return None, None, "Failed to decode image"
            
            # Convert to grayscale for face detection
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            # Detect faces
            faces = self.face_cascade.detectMultiScale(
                gray,
                scaleFactor=1.1,
                minNeighbors=5,
                minSize=(30, 30)
            )
            
            if len(faces) == 0:
                return None, None, "No face detected in image"
            
            if len(faces) > 1:
                return None, None, "Multiple faces detected. Please ensure only one face is visible"
            
            # Get the first face
            x, y, w, h = faces[0]
            
            # Create visualization image
            vis_image = image.copy()
            # Draw rectangle around face
            cv2.rectangle(vis_image, (x, y), (x+w, y+h), (0, 255, 0), 2)
            # Add text
            cv2.putText(vis_image, "Face Detected", (x, y-10), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)
            
            # Convert visualization to base64
            _, buffer = cv2.imencode('.jpg', vis_image)
            vis_base64 = base64.b64encode(buffer).decode('utf-8')
            
            # Extract face region
            face = image[y:y+h, x:x+w]
            
            return face, f"data:image/jpeg;base64,{vis_base64}", None
            
        except Exception as e:
            logger.error(f"Error in face detection: {str(e)}")
            return None, None, f"Error detecting face: {str(e)}"

    def generate_embedding(self, face_image):
        """Generate embedding using the loaded Keras model"""
        try:
            # Preprocess
            face = cv2.resize(face_image, (160, 160))
            face = face.astype('float32') / 255.0
            face = np.expand_dims(face, axis=0)

            # Generate embedding
            embedding = self.embedding_model.predict(face, verbose=0)[0]
            
            # Convert to list and then to JSON string for SQLite storage
            embedding_list = embedding.tolist()
            return json.dumps(embedding_list)
        except Exception as e:
            logger.error(f"Embedding generation error: {str(e)}", exc_info=True)
            return None