import tensorflow as tf
import numpy as np
import cv2
import os
from typing import Tuple, Optional

class FaceRecognitionModel:
    def __init__(self, model_path: str = None):
        """
        Initialize the face recognition model.
        
        Args:
            model_path: Path to the saved model. If None, will use default model.
        """
        self.model = self._load_model(model_path)
        self.input_shape = (224, 224)  # Standard input size
        self.embedding_size = 512  # Size of face embeddings

    def _load_model(self, model_path: Optional[str] = None) -> tf.keras.Model:
        """Load the face recognition model."""
        if model_path and os.path.exists(model_path):
            return tf.keras.models.load_model(model_path)
        else:
            # Create a simple CNN model for face recognition
            base_model = tf.keras.applications.MobileNetV2(
                input_shape=(*self.input_shape, 3),
                include_top=False,
                weights='imagenet'
            )
            
            # Freeze the base model
            base_model.trainable = False
            
            # Add custom layers
            model = tf.keras.Sequential([
                base_model,
                tf.keras.layers.GlobalAveragePooling2D(),
                tf.keras.layers.Dense(1024, activation='relu'),
                tf.keras.layers.Dropout(0.5),
                tf.keras.layers.Dense(self.embedding_size, activation=None)  # No activation for embeddings
            ])
            
            return model

    def preprocess_face(self, face_img: np.ndarray) -> np.ndarray:
        """
        Preprocess face image for model input.
        
        Args:
            face_img: Face image as numpy array (grayscale)
            
        Returns:
            Preprocessed image ready for model input
        """
        # Convert grayscale to RGB
        if len(face_img.shape) == 2:
            face_img = cv2.cvtColor(face_img, cv2.COLOR_GRAY2RGB)
        
        # Resize to model input size
        face_img = cv2.resize(face_img, self.input_shape)
        
        # Normalize pixel values
        face_img = face_img.astype(np.float32) / 255.0
        
        # Add batch dimension
        face_img = np.expand_dims(face_img, axis=0)
        
        return face_img

    def get_face_embedding(self, face_img: np.ndarray) -> np.ndarray:
        """
        Get face embedding from the model.
        
        Args:
            face_img: Face image as numpy array
            
        Returns:
            Face embedding vector
        """
        # Preprocess image
        processed_img = self.preprocess_face(face_img)
        
        # Get embedding
        embedding = self.model.predict(processed_img, verbose=0)
        
        # Normalize embedding
        embedding = embedding / np.linalg.norm(embedding)
        
        return embedding

    def compare_faces(self, embedding1: np.ndarray, embedding2: np.ndarray, threshold: float = 0.6) -> Tuple[bool, float]:
        """
        Compare two face embeddings.
        
        Args:
            embedding1: First face embedding
            embedding2: Second face embedding
            threshold: Similarity threshold (default: 0.6)
            
        Returns:
            Tuple of (is_match, similarity_score)
        """
        # Calculate cosine similarity
        similarity = np.dot(embedding1, embedding2)
        
        # Check if faces match
        is_match = similarity > threshold
        
        return is_match, similarity

    def save_model(self, path: str):
        """Save the model to disk."""
        self.model.save(path)

    def train(self, train_data: tf.data.Dataset, validation_data: tf.data.Dataset = None, epochs: int = 10):
        """
        Train the model on face data.
        
        Args:
            train_data: Training dataset
            validation_data: Validation dataset
            epochs: Number of training epochs
        """
        # Compile model
        self.model.compile(
            optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
            loss=tf.keras.losses.TripletSemiHardLoss(),
            metrics=['accuracy']
        )
        
        # Train model
        self.model.fit(
            train_data,
            validation_data=validation_data,
            epochs=epochs
        ) 