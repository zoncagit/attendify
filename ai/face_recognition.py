import cv2
import numpy as np
import os
from tensorflow.keras.models import load_model
from datetime import datetime
import mysql.connector

# Load pre-trained face detection model (Haar Cascade)
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

# Load the trained face recognition model (e.g., Keras model)
model = load_model('ai/models/face_model.h5')  # Adjust path to where you store your model

# Connect to MySQL database
db_connection = mysql.connector.connect(
    host="localhost",  # Update with your database host
    user="root",  # Update with your database user
    password="",  # Update with your password
    database="attendify_db"  # Update with your database name
)
cursor = db_connection.cursor()

def get_face_id_from_db(face_encoding):
    """
    This function retrieves the face ID from the database by matching the encoding.
    """
    cursor.execute("SELECT id, face_encoding FROM users")
    for (user_id, db_face_encoding) in cursor.fetchall():
        # Compare the encoding from the model with the one from the DB
        # This is a simple example, you can replace with a more sophisticated comparison
        if np.array_equal(face_encoding, np.array(db_face_encoding)):
            return user_id
    return None

def register_face(face_encoding, user_name):
    """
    Registers a new face to the database.
    """
    cursor.execute("INSERT INTO users (user_name, face_encoding) VALUES (%s, %s)", (user_name, face_encoding))
    db_connection.commit()

def recognize_face(image):
    """
    Recognizes a face in the provided image.
    Returns the recognized user name if a match is found, None if no match.
    """
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # Detect faces in the image
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
    
    for (x, y, w, h) in faces:
        # Crop the face from the image
        face = image[y:y+h, x:x+w]
        
        # Preprocess the face image for the model
        face_resized = cv2.resize(face, (224, 224))  # Adjust size for your model's input
        face_normalized = face_resized / 255.0  # Normalize pixel values
        
        # Add batch dimension for the model input
        face_input = np.expand_dims(face_normalized, axis=0)
        
        # Predict the face encoding
        face_encoding = model.predict(face_input)[0]  # Assuming the model returns the encoding
        
        # Check if the face matches any user in the database
        user_id = get_face_id_from_db(face_encoding)
        
        if user_id:
            # Fetch the user name from the database
            cursor.execute("SELECT user_name FROM users WHERE id = %s", (user_id,))
            user_name = cursor.fetchone()[0]
            
            # Log the attendance
            log_attendance(user_id)
            
            return user_name
    return None

def log_attendance(user_id):
    """
    Logs the attendance for the recognized user.
    """
    attendance_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    cursor.execute("INSERT INTO attendance (user_id, attendance_time) VALUES (%s, %s)", (user_id, attendance_time))
    db_connection.commit()

def capture_and_recognize_face():
    """
    Captures a frame from the webcam, detects and recognizes the face, then logs attendance.
    """
    # Open the webcam
    cap = cv2.VideoCapture(0)

    while True:
        ret, frame = cap.read()
        if not ret:
            break
        
        # Recognize the face in the frame
        recognized_name = recognize_face(frame)
        
        # Display the name on the frame
        if recognized_name:
            cv2.putText(frame, f"Hello, {recognized_name}", (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        
        # Draw a rectangle around the face (if any)
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, 1.1, 4)
        for (x, y, w, h) in faces:
            cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)
        
        # Show the frame
        cv2.imshow('Face Recognition', frame)
        
        # Exit loop on pressing 'q'
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
    
    cap.release()
    cv2.destroyAllWindows()

if __name__ == '__main__':
    capture_and_recognize_face()