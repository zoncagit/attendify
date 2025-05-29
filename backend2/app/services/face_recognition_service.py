import numpy as np
import cv2
import base64
from io import BytesIO
from PIL import Image
import tensorflow as tf
import logging

logger = logging.getLogger(__name__)

class FaceRecognitionService:
    def __init__(self):
        # Load the face detection model (OpenCV Haar Cascade)
        self.face_detector = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        # Load the face recognition model (Keras)
        self.face_model = tf.keras.models.load_model('models/face_recognition_model.h5')

    async def process_face_image(self, image_data: str) -> np.ndarray:
        """
        Process an image and extract face embedding using OpenCV for face detection.
        Args:
            image_data: Base64 encoded image data
        Returns:
            Face embedding as numpy array or None if no face detected
        """
        try:
            # Decode base64 image
            image_bytes = base64.b64decode(image_data.split(',')[1])
            image = Image.open(BytesIO(image_bytes)).convert('RGB')
            image = np.array(image)

            # Convert to grayscale for face detection
            gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)

            # Detect faces using OpenCV Haar Cascade
            faces = self.face_detector.detectMultiScale(
                gray,
                scaleFactor=1.1,
                minNeighbors=5,
                minSize=(30, 30)
            )

            if len(faces) == 0:
                logger.warning("No face detected in image (OpenCV)")
                return None

            # Get the largest face
            face = max(faces, key=lambda x: x[2] * x[3])
            x, y, w, h = face

            # Extract face region
            face_region = image[y:y+h, x:x+w]

            # Resize to model input size
            face_region = cv2.resize(face_region, (160, 160))

            # Normalize pixel values
            face_region = face_region.astype('float32') / 255.0

            # Get face embedding
            embedding = self.face_model.predict(np.expand_dims(face_region, axis=0))[0]

            return embedding

        except Exception as e:
            logger.error(f"Error processing face image: {str(e)}")
            return None

    async def verify_face(self, image_data: str, stored_embedding: np.ndarray) -> bool:
        """
        Verify if a face matches the stored embedding
        Args:
            image_data: Base64 encoded image data
            stored_embedding: Stored face embedding to compare against
        Returns:
            True if face matches, False otherwise
        """
        try:
            # Get face embedding from input image
            current_embedding = await self.process_face_image(image_data)

            if current_embedding is None:
                return False

            # Calculate cosine similarity
            similarity = np.dot(current_embedding, stored_embedding) / (
                np.linalg.norm(current_embedding) * np.linalg.norm(stored_embedding)
            )

            # Threshold for face verification
            threshold = 0.7

            return similarity > threshold

        except Exception as e:
            logger.error(f"Error verifying face: {str(e)}")
            return False 