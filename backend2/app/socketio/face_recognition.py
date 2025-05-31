from app.services.face_recognition_service import FaceRecognitionService
from app.database import get_db
from app.models.user import User
from sqlalchemy.orm import Session

face_service = FaceRecognitionService()

def register_face_recognition_handlers(sio):
    @sio.event
    async def setup_face(sid, data):
        """Handle face setup request"""
        try:
            # Get user ID from session
            user_id = data.get('user_id')
            if not user_id:
                await sio.emit('face_setup_error', {'message': 'User ID is required'}, room=sid)
                return
                
            # Get image data
            image_data = data.get('image')
            if not image_data:
                await sio.emit('face_setup_error', {'message': 'No image data received'}, room=sid)
                return
                
            # Detect face
            face, error = face_service.detect_face(image_data)
            if error:
                await sio.emit('face_setup_error', {'message': error}, room=sid)
                return
                
            # Generate embedding
            embedding = face_service.generate_embedding(face)
            
            # Store embedding in database
            db: Session = next(get_db())
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                await sio.emit('face_setup_error', {'message': 'User not found'}, room=sid)
                return
                
            user.face_embedding = embedding
            db.commit()
            
            await sio.emit('face_setup_success', {
                'message': 'Face setup completed successfully',
                'user_id': user_id
            }, room=sid)
            
        except Exception as e:
            await sio.emit('face_setup_error', {'message': f'Error during face setup: {str(e)}'}, room=sid) 