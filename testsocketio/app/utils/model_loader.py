import tensorflow as tf
import tensorflow.keras as keras
import numpy as np
from typing import Optional
from .layers import L2Normalization

class FaceRecognitionModel:
    def __init__(self, model_path: str):
        """
        Initialize the face recognition model
        Args:
            model_path: Path to the .keras model file
        """
        # Load model with custom objects
        self.model = keras.models.load_model(
            model_path,
            custom_objects={'L2Normalization': L2Normalization}
        )
        self.input_shape = self.model.input_shape[1:3]  # Get height and width from input shape

    def preprocess_image(self, image: np.ndarray) -> Optional[np.ndarray]:
        """
        Preprocess the image for model input
        Args:
            image: Input image as numpy array
        Returns:
            Preprocessed image or None if preprocessing fails
        """
        try:
            # Resize image to match model input shape
            resized = tf.image.resize(image, self.input_shape)
            # Normalize pixel values
            normalized = resized / 255.0
            # Add batch dimension
            batched = tf.expand_dims(normalized, 0)
            return batched
        except Exception as e:
            print(f"Error preprocessing image: {e}")
            return None

    def get_embedding(self, image: np.ndarray) -> Optional[np.ndarray]:
        """
        Get face embedding from the model
        Args:
            image: Input image as numpy array
        Returns:
            Face embedding or None if embedding extraction fails
        """
        try:
            # Preprocess image
            preprocessed = self.preprocess_image(image)
            if preprocessed is None:
                return None

            # Get embedding from model
            embedding = self.model.predict(preprocessed, verbose=0)
            return embedding[0]  # Remove batch dimension
        except Exception as e:
            print(f"Error getting embedding: {e}")
            return None 