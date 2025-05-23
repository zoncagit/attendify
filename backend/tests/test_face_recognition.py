import cv2
import base64
import requests
import numpy as np
from io import BytesIO

def capture_image():
    """Capture an image from webcam and return it as base64 string"""
    # Initialize webcam
    cap = cv2.VideoCapture(0)
    
    # Capture frame
    ret, frame = cap.read()
    
    # Release webcam
    cap.release()
    
    if not ret:
        raise Exception("Failed to capture image")
    
    # Convert image to base64
    _, buffer = cv2.imencode('.jpg', frame)
    base64_image = base64.b64encode(buffer).decode('utf-8')
    
    return base64_image

def test_face_recognition():
    """Test the face recognition endpoint"""
    # API endpoint
    url = "http://localhost:8000/api/v1/face/recognize"
    
    try:
        # Capture and encode image
        print("Capturing image...")
        image_data = capture_image()
        
        # Prepare request data
        data = {
            "image_data": image_data
        }
        
        # Send request
        print("Sending request to face recognition endpoint...")
        response = requests.post(url, json=data)
        
        # Check response
        if response.status_code == 200:
            result = response.json()
            print("\nRecognition Results:")
            print(f"Recognized: {result['recognized']}")
            if result['recognized']:
                print(f"Person: {result['person_name']}")
                print(f"Confidence: {result['confidence']:.2f}")
            if result['error']:
                print(f"Error: {result['error']}")
        else:
            print(f"Error: {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"Test failed: {str(e)}")

if __name__ == "__main__":
    test_face_recognition() 