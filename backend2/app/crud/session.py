import secrets
import qrcode
from io import BytesIO
import base64
from datetime import datetime, date, time, timedelta
from typing import List, Optional, Tuple

from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func

from app import models, schemas
from app.models.session import QRCodeStatus

def generate_qr_code(session_id: int, expiration_minutes: int = 15) -> Tuple[str, datetime]:
    """Generate a QR code for a session"""
    # Generate a unique token
    token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(minutes=expiration_minutes)
    
    # Create QR code data
    qr_data = {
        "session_id": session_id,
        "token": token,
        "expires_at": expires_at.isoformat()
    }
    
    # Generate QR code image
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(str(qr_data))
    qr.make(fit=True)
    
    # Convert to base64
    img = qr.make_image(fill_color="black", back_color="white")
    buffered = BytesIO()
    img.save(buffered, format="PNG")
    qr_code_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
    
    return qr_code_base64, expires_at

def create_session(db: Session, session_data: schemas.SessionCreate, creator_id: int):
    """Create a new session with a QR code"""
    db_session = models.Session(
        class_id=session_data.class_id,
        session_topic=session_data.session_topic,
        session_date=session_data.session_date,
        start_time=session_data.start_time or datetime.utcnow().time(),
        end_time=session_data.end_time,
        created_by=creator_id,
        qr_status=QRCodeStatus.ACTIVE
    )
    
    # Generate and set QR code
    qr_code, expires_at = generate_qr_code(
        session_id=db_session.session_id,  # Will be set after flush
        expiration_minutes=15
    )
    
    db.add(db_session)
    db.flush()  # Get the session_id
    
    # Update with QR code data
    db_session.qr_code = qr_code
    db_session.qr_expires_at = expires_at
    db_session.qr_last_updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(db_session)
    return db_session

def get_sessions_by_class(db: Session, class_id: int):
    """Get all sessions for a specific class"""
    return db.query(models.Session).filter(
        models.Session.class_id == class_id
    ).order_by(models.Session.created_at.desc()).all()

def get_session_by_id(db: Session, session_id: int):
    """Get a session by its ID"""
    return db.query(models.Session).filter(
        models.Session.session_id == session_id
    ).first()

def end_session(db: Session, session_id: int):
    """End an active session by setting its end time"""
    db_session = get_session_by_id(db, session_id)
    if not db_session:
        return None
        
    db_session.end_time = datetime.utcnow().time()
    db.commit()
    db.refresh(db_session)
    return db_session

def get_sessions_by_group(
    db: Session, 
    group_id: int, 
    skip: int = 0, 
    limit: int = 100
) -> List[models.Session]:
    """Get all sessions for a specific group with pagination"""
    return db.query(models.Session)\
        .join(models.Classroom, models.Session.class_id == models.Classroom.class_id)\
        .filter(models.Classroom.group_id == group_id)\
        .order_by(models.Session.session_date.desc(), models.Session.start_time.desc())\
        .offset(skip)\
        .limit(limit)\
        .all()

def mark_attendance(
    db: Session, 
    qr_code: str, 
    user_id: int
) -> models.Attendance:
    """Mark attendance using a QR code"""
    # Find session with active QR code
    session = db.query(models.Session).filter(
        models.Session.qr_code == qr_code,
        models.Session.qr_status == QRCodeStatus.ACTIVE,
        models.Session.qr_expires_at > datetime.utcnow()
    ).first()
    
    if not session:
        return None
    
    # Check if attendance already marked
    existing_attendance = db.query(models.Attendance).filter(
        models.Attendance.session_id == session.session_id,
        models.Attendance.user_id == user_id
    ).first()
    
    if existing_attendance:
        return existing_attendance
    
    # Create new attendance record
    attendance = models.Attendance(
        session_id=session.session_id,
        user_id=user_id,
        status=models.AttendanceStatus.present
    )
    
    db.add(attendance)
    db.commit()
    db.refresh(attendance)
    
    return attendance

def refresh_qr_code(db: Session, session_id: int) -> models.Session:
    """Generate a new QR code for a session"""
    session = db.query(models.Session).filter(
        models.Session.session_id == session_id
    ).first()
    
    if not session:
        return None
    
    # Generate new QR code
    qr_code, expires_at = generate_qr_code(
        session_id=session_id,
        expiration_minutes=15
    )
    
    # Update session with new QR code
    session.qr_code = qr_code
    session.qr_status = QRCodeStatus.ACTIVE
    session.qr_expires_at = expires_at
    session.qr_last_updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(session)
    
    return session

def get_active_session_by_group(db: Session, group_id: int) -> Optional[models.Session]:
    """Get the currently active session for a group (if any)"""
    today = date.today()
    now = datetime.utcnow().time()
    
    return db.query(models.Session)\
        .join(models.Classroom, models.Session.class_id == models.Classroom.class_id)\
        .filter(
            and_(
                models.Classroom.group_id == group_id,
                models.Session.session_date == today,
                models.Session.start_time <= now,
                or_(
                    models.Session.end_time.is_(None),
                    models.Session.end_time >= now
                ),
                models.Session.qr_status == QRCodeStatus.ACTIVE,
                models.Session.qr_expires_at > datetime.utcnow()
            )
        )\
        .order_by(models.Session.start_time.desc())\
        .first()