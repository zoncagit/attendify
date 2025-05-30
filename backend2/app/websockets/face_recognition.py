from fastapi import WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.services.face_recognition_service import FaceRecognitionService
from typing import Dict, List
import json
import asyncio

class FaceRecognitionManager:
    def __init__(self):
        self.active_connections: Dict[int, WebSocket] = {}  # user_id -> WebSocket
        self.db = SessionLocal()
        self.face_service = FaceRecognitionService(self.db)

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: int):
        if user_id in self.active_connections:
            del self.active_connections[user_id]

    async def handle_face_registration(self, user_id: int, image_data: str):
        """Handle face registration request."""
        success = self.face_service.register_face(user_id, image_data)
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_json({
                "type": "registration_result",
                "success": success
            })

    async def handle_face_recognition(self, user_id: int, image_data: str):
        """Handle face recognition request."""
        recognized_user_id = self.face_service.recognize_face(image_data)
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_json({
                "type": "recognition_result",
                "user_id": recognized_user_id
            })

    async def handle_face_detection(self, user_id: int, image_data: str):
        """Handle face detection request."""
        face_locations = self.face_service.detect_faces(image_data)
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_json({
                "type": "detection_result",
                "face_locations": face_locations
            })

manager = FaceRecognitionManager()

async def handle_face_recognition_websocket(websocket: WebSocket, user_id: int):
    await manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message["type"] == "register_face":
                await manager.handle_face_registration(user_id, message["image_data"])
            elif message["type"] == "recognize_face":
                await manager.handle_face_recognition(user_id, message["image_data"])
            elif message["type"] == "detect_faces":
                await manager.handle_face_detection(user_id, message["image_data"])
            
    except WebSocketDisconnect:
        manager.disconnect(user_id)
    except Exception as e:
        print(f"Error in face recognition websocket: {str(e)}")
        manager.disconnect(user_id) 