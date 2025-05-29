from typing import Dict, List, Set
from fastapi import WebSocket
import json
import logging

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        # Store active connections by user_id
        self.active_connections: Dict[str, WebSocket] = {}
        # Store QR code sessions
        self.qr_sessions: Dict[str, str] = {}  # session_id -> user_id
        
    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self.active_connections[user_id] = websocket
        logger.info(f"User {user_id} connected to WebSocket")
        
    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
        # Clean up any QR sessions for this user
        self.qr_sessions = {k: v for k, v in self.qr_sessions.items() if v != user_id}
        logger.info(f"User {user_id} disconnected from WebSocket")
        
    async def send_personal_message(self, message: dict, user_id: str):
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_json(message)
            
    async def broadcast_qr_scan(self, session_id: str, scan_data: dict):
        """Broadcast QR code scan event to the session owner"""
        if session_id in self.qr_sessions:
            user_id = self.qr_sessions[session_id]
            await self.send_personal_message({
                "type": "qr_scan",
                "session_id": session_id,
                "data": scan_data
            }, user_id)
            
    def register_qr_session(self, session_id: str, user_id: str):
        """Register a new QR code session"""
        self.qr_sessions[session_id] = user_id
        logger.info(f"QR session {session_id} registered for user {user_id}")
        
    def remove_qr_session(self, session_id: str):
        """Remove a QR code session"""
        if session_id in self.qr_sessions:
            del self.qr_sessions[session_id]
            logger.info(f"QR session {session_id} removed")

# Create a global instance of the connection manager
manager = ConnectionManager() 