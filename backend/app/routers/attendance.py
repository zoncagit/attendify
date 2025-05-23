from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta
import qrcode
from io import BytesIO
import base64

from app.database import get_db
from app.models.user import User
from app.models.class_ import Class
from app.models.attendance import ClassSession, AttendanceRecord, AttendanceMethod
from app.schemas.attendance import SessionCreate, SessionResponse, AttendanceResponse
from app.auth.utils import verify_token
from fastapi.security import OAuth2PasswordBearer
from app.ai.face_recognition import verify_face

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )
    user = db.query(User).filter(User.email == payload.get("sub")).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user

@router.post("/sessions", response_model=SessionResponse)
async def create_session(
    session_data: SessionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify user is class creator
    db_class = db.query(Class).filter(Class.id == session_data.class_id).first()
    if not db_class or db_class.creator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create sessions for this class"
        )
    
    # Generate QR code
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(f"session:{session_data.class_id}:{datetime.utcnow().timestamp()}")
    qr.make(fit=True)
    qr_image = qr.make_image(fill_color="black", back_color="white")
    
    # Convert QR code to base64
    buffered = BytesIO()
    qr_image.save(buffered, format="PNG")
    qr_base64 = base64.b64encode(buffered.getvalue()).decode()
    
    # Create session
    db_session = ClassSession(
        class_id=session_data.class_id,
        start_time=datetime.utcnow(),
        qr_code=qr_base64,
        qr_code_expires_at=datetime.utcnow() + timedelta(minutes=15)
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session

@router.post("/sessions/{session_id}/mark-attendance/qr")
async def mark_attendance_qr(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_session = db.query(ClassSession).filter(ClassSession.id == session_id).first()
    if not db_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    if datetime.utcnow() > db_session.qr_code_expires_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="QR code has expired"
        )
    
    # Check if already marked attendance
    existing_record = db.query(AttendanceRecord).filter(
        AttendanceRecord.session_id == session_id,
        AttendanceRecord.user_id == current_user.id
    ).first()
    
    if existing_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Attendance already marked"
        )
    
    # Create attendance record
    attendance_record = AttendanceRecord(
        session_id=session_id,
        user_id=current_user.id,
        marked_at=datetime.utcnow(),
        method=AttendanceMethod.QR_CODE
    )
    db.add(attendance_record)
    db.commit()
    return {"message": "Attendance marked successfully"}

@router.post("/sessions/{session_id}/mark-attendance/face")
async def mark_attendance_face(
    session_id: int,
    face_image: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_session = db.query(ClassSession).filter(ClassSession.id == session_id).first()
    if not db_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    # Verify face
    face_verified = await verify_face(face_image, current_user.face_embeddings)
    if not face_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Face verification failed"
        )
    
    # Check if already marked attendance
    existing_record = db.query(AttendanceRecord).filter(
        AttendanceRecord.session_id == session_id,
        AttendanceRecord.user_id == current_user.id
    ).first()
    
    if existing_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Attendance already marked"
        )
    
    # Create attendance record
    attendance_record = AttendanceRecord(
        session_id=session_id,
        user_id=current_user.id,
        marked_at=datetime.utcnow(),
        method=AttendanceMethod.FACE_RECOGNITION
    )
    db.add(attendance_record)
    db.commit()
    return {"message": "Attendance marked successfully"}

@router.get("/sessions/{session_id}/attendance", response_model=List[AttendanceResponse])
async def get_session_attendance(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_session = db.query(ClassSession).filter(ClassSession.id == session_id).first()
    if not db_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    # Verify user is class creator
    db_class = db.query(Class).filter(Class.id == db_session.class_id).first()
    if not db_class or db_class.creator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view attendance for this session"
        )
    
    attendance_records = db.query(AttendanceRecord).filter(
        AttendanceRecord.session_id == session_id
    ).all()
    return attendance_records 