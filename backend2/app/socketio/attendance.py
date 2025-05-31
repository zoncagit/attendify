from app.services.face_recognition_service import FaceRecognitionService
from app.database import SessionLocal
from app.models.user import User
from app.models.classroom import Class
from app.models.session import Session
from app.models.attendance import Attendance
from app.models.class_user import ClassUser
from sqlalchemy.orm import Session as DBSession
import json
import logging
from datetime import datetime
import numpy as np

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize face recognition service
face_service = FaceRecognitionService()

def register_attendance_handlers(sio):
    @sio.event
    async def start_attendance_session(sid, data):
        """Start a new attendance session."""
        try:
            if not data.get('class_id'):
                await sio.emit('attendance_error', {
                    'message': 'Class ID is required'
                }, room=sid)
                return

            db = SessionLocal()
            try:
                # Get class and create session
                class_id = data['class_id']
                user_id = data['user_id']

                # Create new session
                session = Session(
                    class_id=class_id,
                    created_by=user_id,
                    start_time=datetime.utcnow()
                )
                db.add(session)
                db.commit()
                db.refresh(session)

                # Get student count for the class
                student_count = db.query(User).filter(
                    User.class_id == class_id,
                    User.role == 'student'
                ).count()

                await sio.emit('attendance_session_started', {
                    'session_id': session.id,
                    'message': f'Attendance session started. {student_count} students in class.',
                    'student_count': student_count
                }, room=sid)

            except Exception as e:
                logger.error(f"Error starting attendance session: {str(e)}")
                await sio.emit('attendance_error', {
                    'message': f'Error starting attendance session: {str(e)}'
                }, room=sid)
            finally:
                db.close()

        except Exception as e:
            logger.error(f"Error in start_attendance_session: {str(e)}")
            await sio.emit('attendance_error', {
                'message': f'Error starting attendance session: {str(e)}'
            }, room=sid)

    @sio.event
    async def process_attendance_frame(sid, data):
        """Process a frame from the camera for attendance marking."""
        try:
            if not data.get('session_id') or not data.get('image'):
                await sio.emit('attendance_error', {
                    'message': 'Session ID and image are required'
                }, room=sid)
                return

            db = SessionLocal()
            try:
                session_id = data['session_id']
                image_data = data['image']

                # Get session
                session = db.query(Session).filter(Session.id == session_id).first()
                if not session:
                    await sio.emit('attendance_error', {
                        'message': 'Session not found'
                    }, room=sid)
                    return

                # Detect face and get visualization
                face, visualization, error = face_service.detect_face(image_data)
                if error:
                    await sio.emit('attendance_error', {
                        'message': error,
                        'visualization': visualization
                    }, room=sid)
                    return

                # Generate embedding
                embedding = face_service.generate_embedding(face)
                if embedding is None:
                    await sio.emit('attendance_error', {
                        'message': 'Failed to generate face embedding',
                        'visualization': visualization
                    }, room=sid)
                    return

                # Get all students in the class with face embeddings
                students = db.query(User).filter(
                    User.class_id == session.class_id,
                    User.role == 'student',
                    User.face_embedding.isnot(None)
                ).all()

                # Find matching student
                best_match = None
                best_distance = float('inf')
                for student in students:
                    try:
                        student_embedding = json.loads(student.face_embedding.decode('utf-8'))
                        distance = face_service.compare_embeddings(embedding, student_embedding)
                        if distance < best_distance:
                            best_distance = distance
                            best_match = student
                    except Exception as e:
                        logger.error(f"Error comparing embeddings for student {student.id}: {str(e)}")
                        continue

                # Check if we found a match
                if best_match and best_distance < 0.6:  # Threshold for face matching
                    # Check if attendance already marked
                    existing_attendance = db.query(Attendance).filter(
                        Attendance.session_id == session_id,
                        Attendance.student_id == best_match.id
                    ).first()

                    if existing_attendance:
                        await sio.emit('attendance_already_marked', {
                            'message': f'Attendance already marked for {best_match.name}',
                            'visualization': visualization
                        }, room=sid)
                    else:
                        # Mark attendance
                        attendance = Attendance(
                            session_id=session_id,
                            student_id=best_match.id,
                            marked_at=datetime.utcnow()
                        )
                        db.add(attendance)
                        db.commit()

                        # Update student's attendance stats
                        best_match.total_attendance += 1
                        db.commit()

                        await sio.emit('attendance_marked', {
                            'message': f'Attendance marked for {best_match.name}',
                            'visualization': visualization
                        }, room=sid)
                else:
                    await sio.emit('attendance_no_match', {
                        'message': 'No matching student found',
                        'visualization': visualization
                    }, room=sid)

            except Exception as e:
                logger.error(f"Error processing attendance frame: {str(e)}")
                await sio.emit('attendance_error', {
                    'message': f'Error processing attendance: {str(e)}'
                }, room=sid)
            finally:
                db.close()

        except Exception as e:
            logger.error(f"Error in process_attendance_frame: {str(e)}")
            await sio.emit('attendance_error', {
                'message': f'Error processing attendance: {str(e)}'
            }, room=sid)

    @sio.event
    async def end_attendance_session(sid, data):
        """End an attendance session."""
        try:
            if not data.get('session_id'):
                await sio.emit('attendance_error', {
                    'message': 'Session ID is required'
                }, room=sid)
                return

            db = SessionLocal()
            try:
                session_id = data['session_id']
                session = db.query(Session).filter(Session.id == session_id).first()
                
                if not session:
                    await sio.emit('attendance_error', {
                        'message': 'Session not found'
                    }, room=sid)
                    return

                # Update session end time
                session.end_time = datetime.utcnow()
                db.commit()

                # Get attendance statistics
                total_students = db.query(User).filter(
                    User.class_id == session.class_id,
                    User.role == 'student'
                ).count()

                marked_attendance = db.query(Attendance).filter(
                    Attendance.session_id == session_id
                ).count()

                await sio.emit('attendance_session_ended', {
                    'message': f'Attendance session ended. {marked_attendance} out of {total_students} students marked present.',
                    'total_students': total_students,
                    'marked_attendance': marked_attendance
                }, room=sid)

            except Exception as e:
                logger.error(f"Error ending attendance session: {str(e)}")
                await sio.emit('attendance_error', {
                    'message': f'Error ending attendance session: {str(e)}'
                }, room=sid)
            finally:
                db.close()

        except Exception as e:
            logger.error(f"Error in end_attendance_session: {str(e)}")
            await sio.emit('attendance_error', {
                'message': f'Error ending attendance session: {str(e)}'
            }, room=sid) 