import cv2
import numpy as np
import os
import tensorflow as tf

# Load trained model
model_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "models", "face_model.h5"))
model = tf.keras.models.load_model(model_path)

# Dynamically get all folder names in the dataset
data_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "dataset"))
labels = sorted([d for d in os.listdir(data_dir) if os.path.isdir(os.path.join(data_dir, d))])

# Haar cascade for face detection
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")

# Start webcam
cam = cv2.VideoCapture(0)
print("🎥 Starting recognition... Press 'q' to quit.")

while True:
    ret, frame = cam.read()
    if not ret:
        break

    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, 1.3, 5)

    for (x, y, w, h) in faces:
        face = gray[y:y+h, x:x+w]
        face = cv2.resize(face, (100, 100))
        face = face.reshape(1, 100, 100, 1) / 255.0

        preds = model.predict(face, verbose=0)
        class_idx = np.argmax(preds)
        confidence = np.max(preds)

        print("Predicted:", labels[class_idx], "| Confidence:", confidence)

        name = labels[class_idx] if confidence > 0.8 else "Unknown"

        cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
        cv2.putText(frame, f"{name} ({confidence*100} %)", (x, y-10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)

    cv2.imshow("Face Recognition", frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cam.release()
cv2.destroyAllWindows()