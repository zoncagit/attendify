from sqlalchemy.orm import Session
from app import models

def add_user_to_class(db: Session, class_id: int, user_id: int):
    existing_link = db.query(models.ClassUser).filter_by(class_id=class_id, user_id=user_id).first()
    if existing_link:
        return existing_link

    link = models.ClassUser(class_id=class_id, user_id=user_id)
    db.add(link)
    db.commit()
    db.refresh(link)
    return link

def get_users_in_class(db: Session, class_id: int):
    return db.query(models.ClassUser).filter(models.ClassUser.class_id == class_id).all()

def get_classes_of_user(db: Session, user_id: int):
    return db.query(models.ClassUser).filter(models.ClassUser.user_id == user_id).all()