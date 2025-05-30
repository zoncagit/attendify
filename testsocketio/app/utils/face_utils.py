import cv2
import numpy as np
from typing import Optional, Tuple
import base64
from .model_loader import FaceRecognitionModel

# Initialize the face recognition model
model = FaceRecognitionModel('app/models/trained_embedding_model_retrainedv4.keras')

def decode_base64_image(base64_string: str) -> Optional[np.ndarray]:
    """
    Decode a base64 string into an OpenCV image
    """
    try:
        # Remove the data URL prefix if present
        if ',' in base64_string:
            base64_string = base64_string.split(',')[1]
        
        # Decode base64 string
        image_data = base64.b64decode(base64_string)
        nparr = np.frombuffer(image_data, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return image
    except Exception as e:
        print(f"Error decoding image: {e}")
        return None

def encode_image_to_base64(image: np.ndarray) -> str:
    """
    Encode an OpenCV image to base64 string
    """
    try:
        _, buffer = cv2.imencode('.jpg', image)
        return base64.b64encode(buffer).decode('utf-8')
    except Exception as e:
        print(f"Error encoding image: {e}")
        return ""

def detect_face(image: np.ndarray) -> Tuple[Optional[np.ndarray], Optional[dict], Optional[np.ndarray]]:
    """
    Detect face in the image using OpenCV's face detector
    Returns:
        Tuple of (face_image, detection_info, annotated_image)
        face_image: The cropped face image if detected, None otherwise
        detection_info: Dictionary containing detection details (confidence, location) if detected, None otherwise
        annotated_image: Original image with face detection box drawn
    """
    try:
        # Create a copy of the image for annotation
        annotated_image = image.copy()
        
        # Convert to grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Load face detector
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        
        # Detect faces with more sensitive parameters
        faces = face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,  # More sensitive scaling
            minNeighbors=4,   # Require fewer neighbors for detection
            minSize=(30, 30), # Minimum face size
            flags=cv2.CASCADE_SCALE_IMAGE
        )
        
        if len(faces) == 0:
            return None, None, annotated_image
            
        # Get the face with the largest area
        largest_face = max(faces, key=lambda rect: rect[2] * rect[3])
        x, y, w, h = largest_face
        
        # Draw rectangle around face
        cv2.rectangle(annotated_image, (x, y), (x + w, y + h), (0, 255, 0), 2)
        
        # Add some padding around the face
        padding = int(min(w, h) * 0.1)  # 10% padding
        x1 = max(0, x - padding)
        y1 = max(0, y - padding)
        x2 = min(image.shape[1], x + w + padding)
        y2 = min(image.shape[0], y + h + padding)
        
        # Extract face region
        face = image[y1:y2, x1:x2]
        
        # Calculate detection confidence (simplified)
        confidence = min(1.0, (w * h) / (image.shape[0] * image.shape[1]) * 10)
        
        detection_info = {
            'confidence': confidence,
            'location': {'x': x, 'y': y, 'width': w, 'height': h},
            'image_size': {'width': image.shape[1], 'height': image.shape[0]}
        }
        
        return face, detection_info, annotated_image
    except Exception as e:
        print(f"Error detecting face: {e}")
        return None, None, image

def get_face_embedding(image: np.ndarray) -> Tuple[Optional[np.ndarray], Optional[dict], Optional[np.ndarray]]:
    """
    Extract face embedding using the TensorFlow model
    Returns:
        Tuple of (embedding, detection_info, annotated_image)
        embedding: The face embedding if successful, None otherwise
        detection_info: Dictionary containing detection details if successful, None otherwise
        annotated_image: Original image with face detection box drawn
    """
    try:
        # Detect face
        face, detection_info, annotated_image = detect_face(image)
        if face is None:
            return None, None, annotated_image
            
        # Get embedding from model
        embedding = model.get_embedding(face)
        return embedding, detection_info, annotated_image
    except Exception as e:
        print(f"Error getting face embedding: {e}")
        return None, None, image

def compare_faces(known_embedding: np.ndarray, unknown_embedding: np.ndarray, tolerance: float = 0.6) -> Tuple[bool, float]:
    """
    Compare two face embeddings using cosine similarity
    Returns:
        Tuple of (is_match, similarity_score)
    """
    try:
        # Calculate cosine similarity
        similarity = np.dot(known_embedding, unknown_embedding) / (
            np.linalg.norm(known_embedding) * np.linalg.norm(unknown_embedding)
        )
        return similarity > (1 - tolerance), float(similarity)
    except Exception as e:
        print(f"Error comparing faces: {e}")
        return False, 0.0 