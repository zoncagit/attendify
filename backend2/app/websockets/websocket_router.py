from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from typing import Dict, Any
import json
import logging
import base64
from app.websockets.connection_manager import manager
from app.auth.auth import get_current_user_ws
from app.models.user import User
from app.services.face_recognition_service import FaceRecognitionService

router = APIRouter(prefix="/ws", tags=["WebSocket"])

logger = logging.getLogger(__name__)

@router.websocket("/connect")
async def websocket_endpoint(websocket: WebSocket):
    try:
        # Accept the connection first
        await websocket.accept()
        
        # Wait for the authentication message
        auth_data = await websocket.receive_json()
        if not auth_data.get("token"):
            await websocket.close(code=4001, reason="Authentication required")
            return
            
        # Verify the token and get the user
        try:
            user = await get_current_user_ws(auth_data["token"])
            if not user:
                await websocket.close(code=4001, reason="Invalid token")
                return
        except Exception as e:
            logger.error(f"WebSocket authentication error: {str(e)}")
            await websocket.close(code=4001, reason="Authentication failed")
            return
            
        # Connect the user
        await manager.connect(websocket, str(user.user_id))
        
        try:
            while True:
                # Wait for messages
                data = await websocket.receive_json()
                
                # Handle different message types
                message_type = data.get("type")
                
                if message_type == "face_registration":
                    # Handle face registration data
                    face_data = data.get("face_data")
                    if face_data:
                        # Process face registration data
                        # This would typically involve saving the face embedding
                        await websocket.send_json({
                            "type": "face_registration_status",
                            "status": "success",
                            "message": "Face registration completed"
                        })
                        
                elif message_type == "face_verification":
                    # Handle face verification data
                    face_data = data.get("face_data")
                    if face_data:
                        # Process face verification
                        # This would typically involve comparing with stored face embedding
                        await websocket.send_json({
                            "type": "face_verification_status",
                            "status": "success",
                            "verified": True  # or False based on verification result
                        })
                        
                elif message_type == "qr_generate":
                    # Generate a new QR code session
                    session_id = data.get("session_id")
                    if session_id:
                        manager.register_qr_session(session_id, str(user.user_id))
                        await websocket.send_json({
                            "type": "qr_session_created",
                            "session_id": session_id
                        })
                        
                elif message_type == "qr_scan":
                    # Handle QR code scan
                    session_id = data.get("session_id")
                    scan_data = data.get("scan_data")
                    if session_id and scan_data:
                        await manager.broadcast_qr_scan(session_id, {
                            "user_id": str(user.user_id),
                            "timestamp": data.get("timestamp"),
                            "location": data.get("location")
                        })
                        
                elif message_type == "qr_session_end":
                    # End a QR code session
                    session_id = data.get("session_id")
                    if session_id:
                        manager.remove_qr_session(session_id)
                        await websocket.send_json({
                            "type": "qr_session_ended",
                            "session_id": session_id
                        })
                        
        except WebSocketDisconnect:
            manager.disconnect(str(user.user_id))
            
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
        try:
            await websocket.close(code=4000, reason="Internal server error")
        except:
            pass

@router.websocket("/face-registration")
async def face_registration_endpoint(websocket: WebSocket):
    try:
        # Accept the connection first
        await websocket.accept()
        
        # Wait for the authentication message
        auth_data = await websocket.receive_json()
        if not auth_data.get("token"):
            await websocket.close(code=4001, reason="Authentication required")
            return
            
        # Verify the token and get the user
        try:
            user = await get_current_user_ws(auth_data["token"])
            if not user:
                await websocket.close(code=4001, reason="Invalid token")
                return
        except Exception as e:
            logger.error(f"WebSocket authentication error: {str(e)}")
            await websocket.close(code=4001, reason="Authentication failed")
            return
            
        # Connect the user
        await manager.connect(websocket, str(user.user_id))
        
        try:
            while True:
                # Wait for messages
                data = await websocket.receive_json()
                
                # Handle different message types
                message_type = data.get("type")
                
                if message_type == "face_registration":
                    try:
                        # Get the image data
                        image_data = data.get("image")
                        if not image_data:
                            await websocket.send_json({
                                "type": "face_registration_status",
                                "status": "error",
                                "message": "No image data provided"
                            })
                            continue
                            
                        # Process the image and extract face embedding
                        face_service = FaceRecognitionService()
                        embedding = await face_service.process_face_image(image_data)
                        
                        if embedding:
                            # Save the face embedding to the user's profile
                            user.face_embedding = embedding
                            await user.save()
                            
                            await websocket.send_json({
                                "type": "face_registration_status",
                                "status": "success",
                                "message": "Face registration completed successfully"
                            })
                        else:
                            await websocket.send_json({
                                "type": "face_registration_status",
                                "status": "error",
                                "message": "No face detected in the image"
                            })
                            
                    except Exception as e:
                        logger.error(f"Face registration error: {str(e)}")
                        await websocket.send_json({
                            "type": "face_registration_status",
                            "status": "error",
                            "message": f"Error processing face: {str(e)}"
                        })
                        
                elif message_type == "face_verification":
                    try:
                        # Get the image data
                        image_data = data.get("image")
                        if not image_data:
                            await websocket.send_json({
                                "type": "face_verification_status",
                                "status": "error",
                                "message": "No image data provided"
                            })
                            continue
                            
                        # Process the image and verify face
                        face_service = FaceRecognitionService()
                        is_verified = await face_service.verify_face(image_data, user.face_embedding)
                        
                        await websocket.send_json({
                            "type": "face_verification_status",
                            "status": "success",
                            "verified": is_verified,
                            "message": "Face verification completed"
                        })
                        
                    except Exception as e:
                        logger.error(f"Face verification error: {str(e)}")
                        await websocket.send_json({
                            "type": "face_verification_status",
                            "status": "error",
                            "message": f"Error verifying face: {str(e)}"
                        })
                        
        except WebSocketDisconnect:
            manager.disconnect(str(user.user_id))
            
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
        try:
            await websocket.close(code=4000, reason="Internal server error")
        except:
            pass 