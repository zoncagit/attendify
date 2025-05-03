#python student_attendance_system.py --collect --name "John Smith" --roll "101"
#python student_attendance_system.py --train
#python student_attendance_system.py --start
#python student_attendance_system.py --view


# Main script for the Face Recognition Student Attendance System

import os
import cv2
import csv
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Model, load_model, Sequential
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.callbacks import ModelCheckpoint, EarlyStopping
from tensorflow.keras.optimizers import Adam
from mtcnn import MTCNN
import datetime
import time   #detect in real time 
import argparse
import shutil
from sklearn.model_selection import train_test_split

# Configuration Constants
IMAGE_SIZE = 224  # Size expected by MobileNetV2
BATCH_SIZE = 32
EPOCHS = 20
LEARNING_RATE = 0.0001
CONFIDENCE_THRESHOLD = 0.7  # Minimum confidence for face recognition
ATTENDANCE_TIMEOUT = 60  # Seconds before a student can be marked present again
DATA_DIR = "dataset"
MODEL_DIR = "models"  
ATTENDANCE_FILE = "attendance.csv"

# Create necessary directories
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(MODEL_DIR, exist_ok=True)
os.makedirs(os.path.join(DATA_DIR, "train"), exist_ok=True)
os.makedirs(os.path.join(DATA_DIR, "val"), exist_ok=True)

class FaceRecognitionAttendanceSystem:
    def __init__(self):
        """Initialize the face recognition attendance system."""
        self.face_detector = MTCNN()
        self.model = None
        self.class_names = []
        self.attendance_record = {}  # To track last attendance time for each student
        
    def detect_face(self, image):
        """
        Detect faces in an image using MTCNN.
        
        Args:
            image: Input image (BGR format from OpenCV)
            
        Returns:
            List of face bounding boxes or empty list if no faces detected
        """
        # Convert BGR to RGB (MTCNN expects RGB)
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Detect faces
        faces = self.face_detector.detect_faces(rgb_image)
        return faces
    

    def extract_face(self, image, face_info, required_size=(IMAGE_SIZE, IMAGE_SIZE)):
        """
        Extract and preprocess a face from an image.
        
        Args:
            image: Input image
            face_info: Face information from MTCNN
            required_size: Size to resize the face to
            
        Returns:
            Preprocessed face image ready for model input
        """
        # Extract face coordinates
        x, y, width, height = face_info['box']
        
        # Handle negative coordinates (MTCNN quirk)
        x, y = max(0, x), max(0, y)
        
        # Extract the face
        face = image[y:y+height, x:x+width]
        
        # Resize face to required size
        face = cv2.resize(face, required_size)
        
        # Convert BGR to RGB
        face = cv2.cvtColor(face, cv2.COLOR_BGR2RGB)
        
        # Preprocess for MobileNetV2
        face = face.astype('float32')
        face = face / 127.5 - 1.0  # Normalize to [-1, 1]
        
        return face, (x, y, width, height)  


    def collect_student_data(self, student_name, roll_number, num_images=50):
        """
        Collect face images for a new student.
        
        Args:
            student_name: Name of the student
            roll_number: Roll number of the student
            num_images: Number of images to capture
        """
        # Create directory for the student
        student_dir = os.path.join(DATA_DIR, "train", f"{roll_number}_{student_name}")
        os.makedirs(student_dir, exist_ok=True)
        
        # Initialize webcam
        cap = cv2.VideoCapture(0)
        
        # Counter for collected images
        count = 0
        
        print(f"Collecting data for {student_name} (Roll: {roll_number})")
        print("Please look at the camera with different face angles")
        print("Press 'q' to quit early")
        
        while count < num_images:
            ret, frame = cap.read()
            if not ret:
                print("Failed to grab frame")
                break

#n3wed n9ra hado

            # Display frame
            display_frame = frame.copy()
            cv2.putText(display_frame, f"Capturing: {count}/{num_images}", 
                        (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
            
            # Detect faces
            faces = self.detect_face(frame)
            
            # Process if a face is detected with sufficient confidence
            if faces and faces[0]['confidence'] > CONFIDENCE_THRESHOLD:
                face, (x, y, w, h) = self.extract_face(frame, faces[0])
                
                # Draw rectangle around face
                cv2.rectangle(display_frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
                
                # Save the face image
                face_filename = os.path.join(student_dir, f"{count}.jpg")
                cv2.imwrite(face_filename, cv2.cvtColor(face, cv2.COLOR_RGB2BGR))
                
                count += 1
                # Small delay between captures
                time.sleep(0.2)
            
            cv2.imshow('Data Collection', display_frame) 


             # Check for exit key
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
        
        # Release resources
        cap.release()
        cv2.destroyAllWindows()
        
        print(f"Collected {count} images for {student_name}")
    
    def prepare_dataset(self, train_split=0.8):
        """
        Prepare dataset by splitting into train and validation sets.
        
        Args:
            train_split: Fraction of data to use for training
        """
        # Get all student folders
        train_dir = os.path.join(DATA_DIR, "train")
        val_dir = os.path.join(DATA_DIR, "val")
        
        # Clear validation directory
        if os.path.exists(val_dir):
            shutil.rmtree(val_dir)
        os.makedirs(val_dir, exist_ok=True)
        
        # For each student folder
        student_dirs = [d for d in os.listdir(train_dir) if os.path.isdir(os.path.join(train_dir, d))]
        
        for student_dir in student_dirs:
            # Create student directory in validation set
            os.makedirs(os.path.join(val_dir, student_dir), exist_ok=True)
            
            # Get all images
            images = [f for f in os.listdir(os.path.join(train_dir, student_dir)) 
                     if f.endswith(('.jpg', '.jpeg', '.png'))]
            
            # Split into train and validation
            train_images, val_images = train_test_split(images, train_size=train_split, random_state=42)
            
            # Move validation images
            for img in val_images:
                src = os.path.join(train_dir, student_dir, img)
                dst = os.path.join(val_dir, student_dir, img)
                shutil.copy(src, dst)
        
        print(f"Dataset prepared: {len(student_dirs)} students")
    
    def build_model(self, num_classes):
        """
        Build and compile the face recognition model based on MobileNetV2.
        
        Args:
            num_classes: Number of students to recognize
            
        Returns:
            Compiled model
        """

          # Use MobileNetV2 as base model (good balance between accuracy and speed)
        base_model = MobileNetV2(input_shape=(IMAGE_SIZE, IMAGE_SIZE, 3), 
                               include_top=False, 
                               weights='imagenet')
        
        # Freeze the base model layers
        base_model.trainable = False
        
        # Build the model
        model = Sequential([
            base_model,
            GlobalAveragePooling2D(),
            Dense(512, activation='relu'),
            Dropout(0.5),
            Dense(num_classes, activation='softmax')
        ])
        
        # Compile the model
        model.compile(
            optimizer=Adam(learning_rate=LEARNING_RATE),
            loss='categorical_crossentropy',
            metrics=['accuracy']
        )
        
        return model
    
    def train_model(self):
        """
        Train the face recognition model using student data.
        """
        train_dir = os.path.join(DATA_DIR, "train")
        val_dir = os.path.join(DATA_DIR, "val")
        
        # Get class names (student IDs)
        self.class_names = sorted([d for d in os.listdir(train_dir) 
                                  if os.path.isdir(os.path.join(train_dir, d))])
        
        num_classes = len(self.class_names)
        
        if num_classes == 0:
            print("No student data found. Please collect data first.")
            return False
        
        print(f"Training model for {num_classes} students: {self.class_names}")
        
        # Data augmentation for training
        train_datagen = ImageDataGenerator(
            rescale=1./127.5 - 1,  # Normalize to [-1, 1]
            rotation_range=20,
            width_shift_range=0.2,
            height_shift_range=0.2,
            shear_range=0.2,
            zoom_range=0.2,
            horizontal_flip=True,
            fill_mode='nearest'
        )


#big check from here

         # Only rescaling for validation
        val_datagen = ImageDataGenerator(rescale=1./127.5 - 1)  # Normalize to [-1, 1]
        
        # Create data generators
        train_generator = train_datagen.flow_from_directory(
            train_dir,
            target_size=(IMAGE_SIZE, IMAGE_SIZE),
            batch_size=BATCH_SIZE,
            class_mode='categorical'
        )
        
        val_generator = val_datagen.flow_from_directory(
            val_dir,
            target_size=(IMAGE_SIZE, IMAGE_SIZE),
            batch_size=BATCH_SIZE,
            class_mode='categorical'
        )
        
        # Build the model
        self.model = self.build_model(num_classes)
        
        #hna the model gonna be saved 
        # Create callbacks
        checkpoint = ModelCheckpoint(
           os.path.join(MODEL_DIR, 'best_model.h5'),
           monitor='accuracy',  # Changed from 'val_accuracy' to 'accuracy'
           save_best_only=True,
           mode='max',
           verbose=1
        )
        
        early_stopping = EarlyStopping(
            monitor='val_loss',
            patience=5,
            restore_best_weights=True,
            verbose=1
        )
        
        # Train the model
        history = self.model.fit(
            train_generator,
            steps_per_epoch=train_generator.samples // BATCH_SIZE,
            validation_data=val_generator,
            validation_steps=val_generator.samples // BATCH_SIZE,
            epochs=EPOCHS,
            callbacks=[checkpoint, early_stopping]
        )
        
        # Save the class names mapping
        np.save(os.path.join(MODEL_DIR, 'class_names.npy'), self.class_names)
        
        print("Model training complete!")
        return True
    

    def load_trained_model(self):
        """
        Load a previously trained face recognition model.
        
        Returns:
            True if model loaded successfully, False otherwise
        """
        model_path = os.path.join(MODEL_DIR, 'best_model.h5')
        class_names_path = os.path.join(MODEL_DIR, 'class_names.npy')
        
        if not os.path.exists(model_path) or not os.path.exists(class_names_path):
            print("Trained model not found. Please train the model first.")
            return False
        
        # Load the model
        self.model = load_model(model_path)
        
        # Load class names
        self.class_names = np.load(class_names_path, allow_pickle=True)
        
        print(f"Model loaded successfully with {len(self.class_names)} students")
        return True
    
    def mark_attendance(self, student_id):
        """
        Mark a student's attendance in the CSV file.
        
        Args:
            student_id: Student ID in format "roll_name"
            
        Returns:
            True if attendance marked, False if duplicate within timeout
        """
        current_time = datetime.datetime.now()
        
        # Check if student already marked attendance recently
        if student_id in self.attendance_record:
            last_time = self.attendance_record[student_id]
            time_diff = (current_time - last_time).total_seconds()
            
            if time_diff < ATTENDANCE_TIMEOUT:
                # Too soon to mark attendance again
                return False
        
        # Get roll number and name
        roll_number, name = student_id.split('_', 1)
        
        # Update attendance record
        self.attendance_record[student_id] = current_time
        
        # Format timestamp
        timestamp = current_time.strftime("%Y-%m-%d %H:%M:%S")
        
        # Write to CSV
        file_exists = os.path.exists(ATTENDANCE_FILE)
        
        with open(ATTENDANCE_FILE, 'a', newline='') as f:
            writer = csv.writer(f)
            
            # Write header if file is new
            if not file_exists:
                writer.writerow(['Name', 'Roll Number', 'Timestamp'])
            
            writer.writerow([name, roll_number, timestamp])
        
        return True
    
    def start_attendance_system(self):
        """
        Start the real-time attendance system using webcam.
        """
        # Load model if not already loaded
        if self.model is None:
            if not self.load_trained_model():
                return
        
        # Initialize webcam
        cap = cv2.VideoCapture(0)
        
        print("Starting attendance system...")
        print("Press 'q' to quit")
        
        while True:
            ret, frame = cap.read()
            if not ret:
                print("Failed to grab frame")
                break
            
            # Display original frame
            display_frame = frame.copy()
            
            # Detect faces
            faces = self.detect_face(frame)
            
            # Process each detected face
            for face_info in faces:
                if face_info['confidence'] > CONFIDENCE_THRESHOLD:
                    # Extract and preprocess face
                    face_img, (x, y, w, h) = self.extract_face(frame, face_info)
                    
                    # Expand dimensions for model input
                    face_img = np.expand_dims(face_img, axis=0)
                    
                    # Get prediction
                    prediction = self.model.predict(face_img, verbose=0)
                    class_index = np.argmax(prediction[0])
                    confidence = prediction[0][class_index]
                    
                    # Get student name
                    student_id = self.class_names[class_index]
                    
                    # Format display name
                    display_name = student_id.split('_', 1)[1]  # Extract name part
                    
                    # Set color based on confidence
                    color = (0, 255, 0) if confidence > 0.7 else (0, 255, 255)
                    
                    # Draw rectangle around face
                    cv2.rectangle(display_frame, (x, y), (x+w, y+h), color, 2)
                    
                    # Display name and confidence
                    label = f"{display_name} ({confidence:.2f})"
                    cv2.putText(display_frame, label, (x, y-10),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
                    
                    # Mark attendance if confidence is high enough
                    if confidence > CONFIDENCE_THRESHOLD:
                        if self.mark_attendance(student_id):
                            status = "Marked Present!"
                        else:
                            status = "Already Marked"
                        
                        # Display attendance status
                        cv2.putText(display_frame, status, (x, y+h+25),
                                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
#error maybe     

    # Show info on frame
            cv2.putText(display_frame, "Attendance System Active", (10, 30),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)
            cv2.putText(display_frame, f"Students: {len(self.class_names)}", (10, 60),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)
            
            # Display the frame
            cv2.imshow('Face Recognition Attendance System', display_frame)
            
            # Check for exit key
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
        
        # Release resources
        cap.release()
        cv2.destroyAllWindows()
        
    def view_attendance(self):
        """
        Display the attendance records in a formatted manner.
        """
        if not os.path.exists(ATTENDANCE_FILE):
            print("No attendance records found.")
            return
        
        with open(ATTENDANCE_FILE, 'r') as f:
            reader = csv.reader(f)
            
            # Skip header
            header = next(reader)
            
            # Read records
            records = list(reader)
        
        print("\n===== Attendance Records =====")
        print(f"{'Name':<20} {'Roll Number':<15} {'Timestamp':<20}")
        print("="*55)
        
        for record in records:
            name, roll, timestamp = record
            print(f"{name:<20} {roll:<15} {timestamp:<20}")



# Main execution block
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Face Recognition Attendance System')
    parser.add_argument('--collect', action='store_true', help='Collect student data')
    parser.add_argument('--train', action='store_true', help='Train the face recognition model')
    parser.add_argument('--start', action='store_true', help='Start attendance system')
    parser.add_argument('--view', action='store_true', help='View attendance records')
    parser.add_argument('--name', type=str, help='Student name (for data collection)')
    parser.add_argument('--roll', type=str, help='Roll number (for data collection)')
    parser.add_argument('--images', type=int, default=50, help='Number of images to collect')
    
    args = parser.parse_args()
    
    # Create the system
    system = FaceRecognitionAttendanceSystem()
    
    # Process arguments
    if args.collect:
        if not args.name or not args.roll:
            print("Error: Student name and roll number required for data collection")
            print("Usage: python student_attendance_system.py --collect --name 'John Doe' --roll '001'")
        else:
            system.collect_student_data(args.name, args.roll, args.images)
            system.prepare_dataset()
    
    elif args.train:
        system.prepare_dataset()
        system.train_model()
    
    elif args.start:
        system.start_attendance_system()
    
    elif args.view:
        system.view_attendance()
    
    else:
        # Display help message
        print("Face Recognition Attendance System")
        print("\nUsage examples:")
        print("  Collect student data: python student_attendance_system.py --collect --name 'John Doe' --roll '001'")
        print("  Train the model:      python student_attendance_system.py --train")
        print("  Start attendance:     python student_attendance_system.py --start")
        print("  View attendance:      python student_attendance_system.py --view")
