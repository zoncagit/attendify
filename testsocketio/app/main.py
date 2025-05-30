from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import socketio as sio
from datetime import datetime
from typing import Dict, List, Set
import json
import numpy as np
import logging

from app.utils.face_utils import decode_base64_image, get_face_embedding, compare_faces, encode_image_to_base64

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI()

# Initialize Socket.IO with explicit configuration
socketio = sio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*',
    logger=True,
    engineio_logger=True
)
socket_app = sio.ASGIApp(socketio, app)

# Mount static files
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# In-memory storage
face_embeddings: Dict[str, np.ndarray] = {}  # Store as numpy arrays
attendance_log: List[Dict] = []
attendance_active = False
scanned_faces: Set[str] = set()  # Track faces that have been scanned in current session

def numpy_to_json(obj):
    """Convert numpy types to Python native types for JSON serialization"""
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.floating):
        return float(obj)
    elif isinstance(obj, dict):
        return {k: numpy_to_json(v) for k, v in obj.items()}
    elif isinstance(obj, (list, tuple)):
        return [numpy_to_json(x) for x in obj]
    return obj

@socketio.event
async def connect(sid, environ):
    logger.info(f"Client connected: {sid}")
    await socketio.emit('connect_response', {'status': 'connected'}, room=sid)

@socketio.event
async def disconnect(sid):
    logger.info(f"Client disconnected: {sid}")

@socketio.event
async def register_face(sid, data):
    """
    Register a new face with the given user ID
    """
    try:
        logger.info(f"Registration attempt for client {sid}")
        user_id = data.get('user_id')
        image_data = data.get('image')
        
        if not user_id or not image_data:
            logger.warning(f"Missing data in registration attempt: user_id={user_id}, image_data={'present' if image_data else 'missing'}")
            await socketio.emit('registration_response', {
                'success': False,
                'message': 'Missing user_id or image data'
            }, room=sid)
            return
            
        # Decode and process image
        image = decode_base64_image(image_data)
        if image is None:
            logger.error("Failed to decode image during registration")
            await socketio.emit('registration_response', {
                'success': False,
                'message': 'Failed to decode image'
            }, room=sid)
            return
            
        # Get face embedding and detection info
        embedding, detection_info, annotated_image = get_face_embedding(image)
        if embedding is None:
            logger.warning(f"No face detected in registration image for user {user_id}")
            await socketio.emit('registration_response', {
                'success': False,
                'message': 'No face detected in image. Please ensure your face is clearly visible and well-lit.',
                'detection_info': None,
                'annotated_image': encode_image_to_base64(annotated_image)
            }, room=sid)
            return
            
        # Check if face is too small or too large
        if detection_info['confidence'] < 0.1:
            logger.warning(f"Face too small in registration image for user {user_id}")
            await socketio.emit('registration_response', {
                'success': False,
                'message': 'Face too small in image. Please move closer to the camera.',
                'detection_info': numpy_to_json(detection_info),
                'annotated_image': encode_image_to_base64(annotated_image)
            }, room=sid)
            return
            
        # Store embedding as numpy array
        face_embeddings[user_id] = embedding
        logger.info(f"Successfully registered face for user {user_id}")
        
        await socketio.emit('registration_response', {
            'success': True,
            'message': f'Face registered successfully for user {user_id}',
            'detection_info': numpy_to_json(detection_info),
            'annotated_image': encode_image_to_base64(annotated_image)
        }, room=sid)
        
    except Exception as e:
        logger.error(f"Error during registration: {str(e)}", exc_info=True)
        await socketio.emit('registration_response', {
            'success': False,
            'message': f'Error during registration: {str(e)}'
        }, room=sid)

@socketio.event
async def start_attendance(sid):
    """
    Start a new attendance session
    """
    global attendance_active, scanned_faces
    attendance_active = True
    scanned_faces.clear()
    logger.info("Started new attendance session")
    await socketio.emit('attendance_status', {
        'active': True,
        'message': 'Attendance session started'
    }, room=sid)

@socketio.event
async def stop_attendance(sid):
    """
    Stop the current attendance session
    """
    global attendance_active, scanned_faces
    attendance_active = False
    scanned_faces.clear()
    logger.info("Stopped attendance session")
    await socketio.emit('attendance_status', {
        'active': False,
        'message': 'Attendance session stopped'
    }, room=sid)

@socketio.event
async def mark_attendance(sid, data):
    """
    Mark attendance by comparing face with registered embeddings
    """
    try:
        if not attendance_active:
            await socketio.emit('attendance_response', {
                'success': False,
                'message': 'No active attendance session'
            }, room=sid)
            return

        logger.info(f"Attendance marking attempt for client {sid}")
        image_data = data.get('image')
        
        if not image_data:
            logger.warning("Missing image data in attendance marking attempt")
            await socketio.emit('attendance_response', {
                'success': False,
                'message': 'Missing image data'
            }, room=sid)
            return
            
        # Decode and process image
        image = decode_base64_image(image_data)
        if image is None:
            logger.error("Failed to decode image during attendance marking")
            await socketio.emit('attendance_response', {
                'success': False,
                'message': 'Failed to decode image'
            }, room=sid)
            return
            
        # Get face embedding and detection info
        unknown_embedding, detection_info, annotated_image = get_face_embedding(image)
        if unknown_embedding is None:
            logger.warning("No face detected in attendance marking image")
            await socketio.emit('attendance_response', {
                'success': False,
                'message': 'No face detected in image. Please ensure your face is clearly visible and well-lit.',
                'detection_info': None,
                'annotated_image': encode_image_to_base64(annotated_image)
            }, room=sid)
            return
            
        # Check if face is too small or too large
        if detection_info['confidence'] < 0.1:
            logger.warning("Face too small in attendance marking image")
            await socketio.emit('attendance_response', {
                'success': False,
                'message': 'Face too small in image. Please move closer to the camera.',
                'detection_info': numpy_to_json(detection_info),
                'annotated_image': encode_image_to_base64(annotated_image)
            }, room=sid)
            return
            
        # Compare with registered faces
        recognized = False
        recognized_user = None
        best_similarity = 0.0
        
        for user_id, known_embedding in face_embeddings.items():
            is_match, similarity = compare_faces(known_embedding, unknown_embedding)
            if is_match and similarity > best_similarity:
                recognized = True
                recognized_user = user_id
                best_similarity = similarity
                
        if recognized and recognized_user:
            # Check if this face has already been scanned in this session
            if recognized_user in scanned_faces:
                await socketio.emit('attendance_response', {
                    'success': False,
                    'message': f'User {recognized_user} has already marked attendance in this session',
                    'annotated_image': encode_image_to_base64(annotated_image)
                }, room=sid)
                return
                
            # Log attendance
            attendance_log.append({
                'user_id': recognized_user,
                'timestamp': datetime.now().isoformat(),
                'confidence': float(best_similarity)
            })
            
            # Add to scanned faces
            scanned_faces.add(recognized_user)
            
            logger.info(f"Attendance marked for user {recognized_user} with confidence {best_similarity:.2f}")
            
            await socketio.emit('attendance_response', {
                'success': True,
                'message': f'Attendance marked for user {recognized_user}',
                'user_id': recognized_user,
                'confidence': float(best_similarity),
                'detection_info': numpy_to_json(detection_info),
                'annotated_image': encode_image_to_base64(annotated_image)
            }, room=sid)
        else:
            logger.warning("Face not recognized during attendance marking")
            await socketio.emit('attendance_response', {
                'success': False,
                'message': 'Face not recognized. Please ensure you are registered.',
                'detection_info': numpy_to_json(detection_info),
                'annotated_image': encode_image_to_base64(annotated_image)
            }, room=sid)
            
    except Exception as e:
        logger.error(f"Error during attendance marking: {str(e)}", exc_info=True)
        await socketio.emit('attendance_response', {
            'success': False,
            'message': f'Error during attendance marking: {str(e)}'
        }, room=sid)

@app.get("/")
async def get_index():
    return FileResponse("app/static/index.html") 