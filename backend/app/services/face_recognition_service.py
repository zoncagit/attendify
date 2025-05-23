import cv2
import numpy as np
import os
import tensorflow as tf
from app.config.settings import settings

class FaceRecognitionService:
    def __init__(self):
        self.model_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..","ai" ,"models", "face_model.h5"))
        self.model = tf.keras.models.load_model(self.model_path)
        self.confidence_threshold = settings.FACE_DETECTION_CONFIDENCE
        self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        self.data_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "ai", "dataset"))
        self.labels = sorted([d for d in os.listdir(self.data_dir) if os.path.isdir(os.path.join(self.data_dir, d))])

    def detect_faces(self, image):
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        faces = self.face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
        return faces

    def recognize_face(self, image):
        faces = self.detect_faces(image)
        for (x, y, w, h) in faces:
            face = cv2.resize(image[y:y+h, x:x+w], (100, 100))
            face = face.reshape(1, 100, 100, 1) / 255.0

            preds = self.model.predict(face, verbose=0)
            class_idx = np.argmax(preds)
            confidence = np.max(preds)

            if confidence > self.confidence_threshold:
                return self.labels[class_idx], confidence
        return "Unknown", 0.0

    def _get_face_encoding(self, face_image):
        # This method is no longer needed as we are using the model directly
        pass

    def _compare_faces(self, known_face_encodings, face_encoding):
        # This method is no longer needed as we are using the model directly
        pass 