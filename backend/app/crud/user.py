from sqlalchemy.orm import Session
from app import models, schemas
from app.auth.hashing import hash_password

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = hash_password(user.password)
    db_user = models.User(
        name=user.name,
        prenom=user.prenom,
        email=user.email,
        password_hash=hashed_password,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.user_id == user_id).first()

def get_user_role(db: Session, user_id: int) -> str:
    # Query the class_user table to get the user's roles in different classes
    roles = db.query(models.ClassUser.role)\
        .filter(models.ClassUser.user_id == user_id)\
        .distinct()\
        .all()
    
    # If user has any teacher role, return 'teacher'
    if any(role[0] == 'teacher' for role in roles):
        return 'teacher'
    # If user has any student role and no teacher role, return 'student'
    elif any(role[0] == 'student' for role in roles):
        return 'student'
    # If no roles found, return 'user'
    return 'user'