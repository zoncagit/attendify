import cv2
import numpy as np
from sqlalchemy.orm import Session
from app.models.user import User
from typing import List, Tuple, Optional
import base64
import io
from PIL import Image
import os
from .model_handler import FaceRecognitionModel

class FaceRecognitionService:
    def __init__(self, db: Session, model_path: str = None):
        self.db = db
        self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        self.face_model = FaceRecognitionModel(model_path)
        self.known_face_encodings = []
        self.known_face_ids = []
        self._load_known_faces()

    def _load_known_faces(self):
        """Load all known faces from the database."""
        users = self.db.query(User).filter(User.face_encoding.isnot(None)).all()
        for user in users:
            if user.face_encoding:
                # Convert stored bytes back to numpy array
                face_encoding = np.frombuffer(user.face_encoding)
                self.known_face_encodings.append(face_encoding)
                self.known_face_ids.append(user.user_id)

    def _preprocess_image(self, image_data: str) -> Optional[np.ndarray]:
        """Preprocess image data for face detection."""
        try:
            # Decode base64 image
            image_bytes = base64.b64decode(image_data.split(',')[1])
            image = Image.open(io.BytesIO(image_bytes))
            image_array = np.array(image)
            
            # Convert to grayscale for face detection
            if len(image_array.shape) == 3:
                gray = cv2.cvtColor(image_array, cv2.COLOR_BGR2GRAY)
            else:
                gray = image_array

            return gray
        except Exception as e:
            print(f"Error preprocessing image: {str(e)}")
            return None

    def register_face(self, user_id: int, image_data: str) -> bool:
        """
        Register a face for a user.
        
        Args:
            user_id: The ID of the user
            image_data: Base64 encoded image data
            
        Returns:
            bool: True if registration was successful
        """
        try:
            # Preprocess image
            gray = self._preprocess_image(image_data)
            if gray is None:
                return False

            # Detect face
            faces = self.face_cascade.detectMultiScale(
                gray,
                scaleFactor=1.1,
                minNeighbors=5,
                minSize=(30, 30)
            )

            if len(faces) == 0:
                return False

            # Get the first face
            x, y, w, h = faces[0]
            face_roi = gray[y:y+h, x:x+w]

            # Get face embedding from model
            face_embedding = self.face_model.get_face_embedding(face_roi)
            
            # Update user in database
            user = self.db.query(User).filter(User.user_id == user_id).first()
            if not user:
                return False

            user.face_encoding = face_embedding.tobytes()
            self.db.commit()

            # Update in-memory cache
            self.known_face_encodings.append(face_embedding)
            self.known_face_ids.append(user_id)

            return True
        except Exception as e:
            print(f"Error registering face: {str(e)}")
            return False

    def recognize_face(self, image_data: str) -> Optional[int]:
        """
        Recognize a face from an image.
        
        Args:
            image_data: Base64 encoded image data
            
        Returns:
            Optional[int]: User ID if recognized, None otherwise
        """
        try:
            # Preprocess image
            gray = self._preprocess_image(image_data)
            if gray is None:
                return None

            # Detect face
            faces = self.face_cascade.detectMultiScale(
                gray,
                scaleFactor=1.1,
                minNeighbors=5,
                minSize=(30, 30)
            )

            if len(faces) == 0:
                return None

            # Get the first face
            x, y, w, h = faces[0]
            face_roi = gray[y:y+h, x:x+w]

            # Get face embedding
            face_embedding = self.face_model.get_face_embedding(face_roi)

            # Compare with known faces
            if len(self.known_face_encodings) > 0:
                best_match = None
                best_similarity = -1

                for i, known_embedding in enumerate(self.known_face_encodings):
                    is_match, similarity = self.face_model.compare_faces(
                        face_embedding,
                        known_embedding,
                        threshold=0.6
                    )
                    
                    if is_match and similarity > best_similarity:
                        best_similarity = similarity
                        best_match = self.known_face_ids[i]

                return best_match

            return None
        except Exception as e:
            print(f"Error recognizing face: {str(e)}")
            return None

    def detect_faces(self, image_data: str) -> List[Tuple[int, int, int, int]]:
        """
        Detect faces in an image.
        
        Args:
            image_data: Base64 encoded image data
            
        Returns:
            List[Tuple[int, int, int, int]]: List of face locations (x, y, w, h)
        """
        try:
            # Preprocess image
            gray = self._preprocess_image(image_data)
            if gray is None:
                return []

            # Detect faces
            faces = self.face_cascade.detectMultiScale(
                gray,
                scaleFactor=1.1,
                minNeighbors=5,
                minSize=(30, 30)
            )

            # Convert to list of tuples
            return [(x, y, w, h) for (x, y, w, h) in faces]
        except Exception as e:
            print(f"Error detecting faces: {str(e)}")
            return [] 