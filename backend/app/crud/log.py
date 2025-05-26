from sqlalchemy.orm import Session
from app import models, schemas
from datetime import datetime

def create_log(db: Session, log: schemas.LogCreate):
    db_log = models.Log(
        user_id=log.user_id,
        action_type=log.action_type,
        description=log.description,
        timestamp=datetime.utcnow()
    )
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log

def get_logs_by_user(db: Session, user_id: int):
    return db.query(models.Log).filter(models.Log.user_id == user_id).all()