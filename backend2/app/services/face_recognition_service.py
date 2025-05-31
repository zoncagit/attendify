import cv2
import numpy as np
import tensorflow as tf
from pathlib import Path
import base64
import io
from PIL import Image
from app.services.model_handler import load_face_model

class FaceRecognitionService:
    def __init__(self):
        # Load Haar Cascade for face detection
        cascade_path = Path(__file__).parent.parent / "ai" / "haarcascade_frontalface_default.xml"
        self.face_cascade = cv2.CascadeClassifier(str(cascade_path))
        
        # Load Keras model for face embeddings
        model_path = Path(__file__).parent.parent.parent.parent / "ai" / "model" / "trained_embedding_model_retrainedv4.keras"
        self.embedding_model = load_face_model(str(model_path))
        
    def detect_face(self, image_data):
        """Detect face in image using OpenCV Haar Cascade"""
        # Convert base64 to image
        image_bytes = base64.b64decode(image_data.split(',')[1])
        image = Image.open(io.BytesIO(image_bytes))
        image = np.array(image)
        
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
            return None, "No face detected"
        
        if len(faces) > 1:
            return None, "Multiple faces detected. Please show only one face."
            
        # Get the first face
        x, y, w, h = faces[0]
        face = image[y:y+h, x:x+w]
        
        return face, None
        
    def generate_embedding(self, face_image):
        """Generate face embedding using Keras model"""
        # Preprocess image for the model
        face = cv2.resize(face_image, (160, 160))
        face = face.astype('float32')
        face = face / 255.0  # Normalize to [0, 1]
        face = np.expand_dims(face, axis=0)
        
        # Generate embedding
        embedding = self.embedding_model.predict(face)[0]
        return embedding.tobytes()  # Convert to bytes for database storage 