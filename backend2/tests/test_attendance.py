import requests
import json
import websockets
import asyncio
import base64
from pathlib import Path

async def test_attendance():
    # API endpoint
    base_url = "http://localhost:8000/api/v1"
    
    # Login to get token
    login_data = {
        "username": "teacher@example.com",  # Replace with your test teacher
        "password": "testpassword"         # Replace with your test password
    }
    
    response = requests.post(f"{base_url}/auth/login", data=login_data)
    if response.status_code != 200:
        print("Login failed:", response.json())
        return
    
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Start attendance session
    session_data = {
        "class_id": 1,  # Replace with your test class ID
        "group_id": 1,  # Replace with your test group ID
        "session_topic": "Test Session"
    }
    
    response = requests.post(
        f"{base_url}/attendance/start-session",
        headers=headers,
        json=session_data
    )
    
    if response.status_code != 200:
        print("Failed to start session:", response.json())
        return
    
    session_id = response.json()["session_id"]
    print("Session started:", session_id)
    
    # Connect to WebSocket
    ws_url = f"ws://localhost:8000/api/v1/attendance/ws/{session_id}"
    
    async with websockets.connect(ws_url) as websocket:
        # Send test frame
        test_image_path = Path("test_data/test_face.jpg")  # Replace with your test image
        if not test_image_path.exists():
            print(f"Test image not found at {test_image_path}")
            return
        
        with open(test_image_path, "rb") as f:
            image_data = base64.b64encode(f.read()).decode('utf-8')
        
        # Send frame
        await websocket.send(json.dumps({
            "image": f"data:image/jpeg;base64,{image_data}"
        }))
        
        # Receive response
        response = await websocket.recv()
        print("WebSocket response:", json.loads(response))
    
    # Get session attendance
    response = requests.get(
        f"{base_url}/attendance/session/{session_id}",
        headers=headers
    )
    
    if response.status_code == 200:
        print("Session attendance:", response.json())
    else:
        print("Failed to get session attendance:", response.json())

if __name__ == "__main__":
    asyncio.run(test_attendance()) 