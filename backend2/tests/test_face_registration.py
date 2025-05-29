import requests
import base64
import os
from pathlib import Path

def test_face_registration():
    # API endpoint
    base_url = "http://localhost:8000/api/v1"
    
    # Login to get token
    login_data = {
        "username": "test@example.com",  # Replace with your test user
        "password": "testpassword"       # Replace with your test password
    }
    
    response = requests.post(f"{base_url}/auth/login", data=login_data)
    if response.status_code != 200:
        print("Login failed:", response.json())
        return
    
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test face registration
    test_image_path = Path("test_data/test_face.jpg")  # Replace with your test image
    if not test_image_path.exists():
        print(f"Test image not found at {test_image_path}")
        return
    
    with open(test_image_path, "rb") as f:
        files = {"file": ("test_face.jpg", f, "image/jpeg")}
        response = requests.post(
            f"{base_url}/face-registration/register",
            headers=headers,
            files=files
        )
    
    if response.status_code == 200:
        print("Face registration successful:", response.json())
    else:
        print("Face registration failed:", response.json())
    
    # Test face verification
    with open(test_image_path, "rb") as f:
        files = {"file": ("test_face.jpg", f, "image/jpeg")}
        response = requests.post(
            f"{base_url}/face-registration/verify",
            headers=headers,
            files=files
        )
    
    if response.status_code == 200:
        print("Face verification successful:", response.json())
    else:
        print("Face verification failed:", response.json())

if __name__ == "__main__":
    test_face_registration() 