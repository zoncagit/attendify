import face_recognition
import numpy as np
import cv2
import base64
from typing import List, Tuple, Optional
import logging
import tensorflow as tf
from tensorflow.keras.models import load_model
import os

logger = logging.getLogger(__name__)

class FaceRecognitionService:
    def __init__(self):
        self.known_face_encodings = []
        self.known_face_names = []
        self.face_locations = []
        self.face_encodings = []
        self.face_names = []
        self.process_this_frame = True
        
        # Load custom Keras model
        model_path = os.getenv('KERAS_MODEL_PATH', 'models/face_embedding_model.keras')
        try:
            self.keras_model = load_model(model_path)
            logger.info("Keras model loaded successfully")
        except Exception as e:
            logger.error(f"Error loading Keras model: {str(e)}")
            self.keras_model = None

    def preprocess_image(self, image: np.ndarray) -> np.ndarray:
        """
        Preprocess image for Keras model
        """
        # Resize to model input size (adjust size according to your model)
        resized = cv2.resize(image, (160, 160))
        # Convert to RGB if needed
        if len(resized.shape) == 2:
            resized = cv2.cvtColor(resized, cv2.COLOR_GRAY2RGB)
        elif resized.shape[2] == 4:
            resized = cv2.cvtColor(resized, cv2.COLOR_RGBA2RGB)
        # Normalize pixel values
        normalized = resized.astype(np.float32) / 255.0
        # Add batch dimension
        return np.expand_dims(normalized, axis=0)

    def encode_face_with_keras(self, image_data: str) -> Optional[np.ndarray]:
        """
        Encode a face using the custom Keras model
        """
        try:
            # Remove data URL prefix if present
            if ',' in image_data:
                image_data = image_data.split(',')[1]
            
            # Decode base64 to bytes
            image_bytes = base64.b64decode(image_data)
            
            # Convert to numpy array
            nparr = np.frombuffer(image_bytes, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            # Convert BGR to RGB
            rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            
            # Detect face using face_recognition
            face_locations = face_recognition.face_locations(rgb_image)
            
            if not face_locations:
                logger.warning("No face detected in image")
                return None
            
            # Get the first face
            top, right, bottom, left = face_locations[0]
            face_image = rgb_image[top:bottom, left:right]
            
            # Preprocess for Keras model
            preprocessed = self.preprocess_image(face_image)
            
            # Get embedding from Keras model
            if self.keras_model is None:
                raise Exception("Keras model not loaded")
            
            embedding = self.keras_model.predict(preprocessed, verbose=0)
            return embedding[0]  # Return first embedding
            
        except Exception as e:
            logger.error(f"Error encoding face with Keras: {str(e)}")
            return None

    def compare_faces(self, known_encodings: List[np.ndarray], face_encoding: np.ndarray, tolerance: float = 0.6) -> List[bool]:
        """
        Compare a face encoding with a list of known face encodings
        """
        if not known_encodings:
            return []
        
        # Calculate Euclidean distances
        distances = np.linalg.norm(np.array(known_encodings) - face_encoding, axis=1)
        return [distance <= tolerance for distance in distances]

    def find_matches(self, face_encoding: np.ndarray, known_encodings: List[np.ndarray], tolerance: float = 0.6) -> List[int]:
        """
        Find matches for a face encoding in a list of known encodings
        Returns list of indices of matches
        """
        matches = self.compare_faces(known_encodings, face_encoding, tolerance)
        return [i for i, match in enumerate(matches) if match]

    def calculate_face_distance(self, face_encoding: np.ndarray, known_encodings: List[np.ndarray]) -> List[float]:
        """
        Calculate face distance between a face encoding and a list of known encodings
        """
        if not known_encodings:
            return []
        return np.linalg.norm(np.array(known_encodings) - face_encoding, axis=1).tolist()

    def process_frame(self, frame: np.ndarray) -> Tuple[List, List, List]:
        """
        Process a video frame to detect and recognize faces
        """
        # Resize frame for faster processing
        small_frame = cv2.resize(frame, (0, 0), fx=0.25, fy=0.25)
        
        # Convert BGR to RGB
        rgb_small_frame = cv2.cvtColor(small_frame, cv2.COLOR_BGR2RGB)
        
        # Only process every other frame to save time
        if self.process_this_frame:
            # Find face locations
            self.face_locations = face_recognition.face_locations(rgb_small_frame)
            
            # Get face encodings using Keras model
            self.face_encodings = []
            for face_location in self.face_locations:
                top, right, bottom, left = face_location
                face_image = rgb_small_frame[top:bottom, left:right]
                preprocessed = self.preprocess_image(face_image)
                if self.keras_model is not None:
                    embedding = self.keras_model.predict(preprocessed, verbose=0)
                    self.face_encodings.append(embedding[0])
            
            self.face_names = []
            for face_encoding in self.face_encodings:
                matches = self.compare_faces(self.known_face_encodings, face_encoding)
                name = "Unknown"
                
                if True in matches:
                    first_match_index = matches.index(True)
                    name = self.known_face_names[first_match_index]
                
                self.face_names.append(name)
        
        self.process_this_frame = not self.process_this_frame
        
        return self.face_locations, self.face_encodings, self.face_names

    def load_known_faces(self, encodings: List[np.ndarray], names: List[str]):
        """
        Load known face encodings and names
        """
        self.known_face_encodings = encodings
        self.known_face_names = names 