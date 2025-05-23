from sqlalchemy.orm import Session
from app.models.user import User
from app.auth.hashing import hash_password, verify_password

def create_user(db: Session, user_data: dict) -> User:
    """Crée un nouvel utilisateur dans la base de données."""
    hashed_password = hash_password(user_data['password'])
    
    user = User(
        name=user_data['name'],
        prenom=user_data['prenom'],
        email=user_data['email'],
        password_hash=hashed_password
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def get_user_by_email(db: Session, email: str) -> User | None:
    """Récupère un utilisateur par son email."""
    return db.query(User).filter(User.email == email).first()

def verify_user_password(db: Session, email: str, password: str) -> bool:
    """Vérifie si les identifiants sont corrects."""
    user = get_user_by_email(db, email)
    if not user:
        return False
    return verify_password(password, user.password_hash)
