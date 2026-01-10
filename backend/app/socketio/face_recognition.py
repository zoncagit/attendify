from app.services.face_recognition_service import FaceRecognitionService
from app.database import get_db
from app.models.user import User
from sqlalchemy.orm import Session
import base64
import numpy as np
import cv2
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

face_service = FaceRecognitionService()

def register_face_recognition_handlers(sio):
    @sio.event
    async def setup_face(sid, data):
        """Handle face setup request"""
        try:
            logger.info(f"Received face setup request from {sid}")
            logger.info(f"Data received: {list(data.keys())}")

            user_id = data.get('user_id')
            if not user_id:
                logger.error("No user_id provided in request")
                await sio.emit('face_setup_error', {
                    'message': 'User ID is required',
                    'visualization': None
                }, room=sid)
                return

            image_data = data.get('image')
            if not image_data:
                logger.error("No image data provided in request")
                await sio.emit('face_setup_error', {
                    'message': 'No image data received',
                    'visualization': None
                }, room=sid)
                return

            logger.info(f"Processing face setup for user {user_id}")
            logger.info(f"Image data length: {len(image_data)}")

            # Detect face
            face, visualization, error = face_service.detect_face(image_data)
            if error:
                logger.error(f"Face detection error: {error}")
                await sio.emit('face_setup_error', {
                    'message': error,
                    'visualization': None
                }, room=sid)
                return
            if face is None:
                logger.error("No face detected in image")
                await sio.emit('face_setup_error', {
                    'message': 'No face detected in image',
                    'visualization': None
                }, room=sid)
                return

            logger.info("Face detected successfully")
            logger.info(f"Face image shape: {face.shape}")

            # Generate embedding
            embedding = face_service.generate_embedding(face)
            if embedding is None:
                logger.error("Failed to generate face embedding")
                await sio.emit('face_setup_error', {
                    'message': 'Failed to generate face embedding',
                    'visualization': visualization
                }, room=sid)
                return

            logger.info("Face embedding generated successfully")
            logger.info(f"Embedding length: {len(embedding)}")

            # Store in database
            db: Session = next(get_db())
            user = db.query(User).filter(User.user_id == user_id).first()
            if not user:
                logger.error(f"User {user_id} not found")
                await sio.emit('face_setup_error', {
                    'message': 'User not found',
                    'visualization': visualization
                }, room=sid)
                return

            user.face_embedding = embedding
            db.commit()

            logger.info(f"Face setup completed for user {user_id}")
            await sio.emit('face_setup_success', {
                'message': 'Face setup completed successfully',
                'user_id': user_id,
                'visualization': visualization
            }, room=sid)

        except Exception as e:
            logger.error(f"Unhandled error in face setup: {str(e)}", exc_info=True)
            await sio.emit('face_setup_error', {
                'message': f'Face setup failed: {str(e)}',
                'visualization': None
            }, room=sid)