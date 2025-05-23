from sqlalchemy.orm import Session
from app import models, schemas
from app.utils.helpers import generate_class_code

def create_class(db: Session, class_data: schemas.ClassCreate, creator_id: int):
    class_code = generate_class_code()
    while db.query(models.Class).filter(models.Class.class_code == class_code).first():
        class_code = generate_class_code()

    db_class = models.Class(
        class_name=class_data.class_name,
        class_code=class_code,
        created_by=creator_id
    )
    db.add(db_class)
    db.commit()
    db.refresh(db_class)
    return db_class

def get_class_by_code(db: Session, class_code: str):
    return db.query(models.Class).filter(models.Class.class_code == class_code).first()

def get_class_by_id(db: Session, class_id: int):
    return db.query(models.Class).filter(models.Class.class_id == class_id).first()

def get_classes_by_creator(db: Session, creator_id: int):
    return db.query(models.Class).filter(models.Class.created_by == creator_id).all()