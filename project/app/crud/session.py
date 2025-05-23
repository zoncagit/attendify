from sqlalchemy.orm import Session
from app import models, schemas
from datetime import datetime

def create_session(db: Session, session_data: schemas.SessionCreate, creator_id: int):
    db_session = models.Session(
        class_id=session_data.class_id,
        session_topic=session_data.session_topic,
        session_date=session_data.session_date,
        start_time=session_data.start_time,
        end_time=session_data.end_time,
        created_by=creator_id,
        qr_code=session_data.qr_code,
        qr_last_updated_at=datetime.utcnow()
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session

def get_sessions_by_class(db: Session, class_id: int):
    return db.query(models.Session).filter(models.Session.class_id == class_id).all()

def get_session_by_id(db: Session, session_id: int):
    return db.query(models.Session).filter(models.Session.session_id == session_id).first()