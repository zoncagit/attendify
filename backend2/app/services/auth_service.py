from datetime import datetime, timedelta
from typing import Optional, Generator

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.auth.hashing import hash_password, verify_password
from app.models.user import User

# Import configuration
from app.config.database_settings import database_settings
from app.database import SessionLocal

# OAuth2 scheme for token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Get token configuration from settings
SECRET_KEY = database_settings.secret_key
ALGORITHM = database_settings.algorithm
ACCESS_TOKEN_EXPIRE_MINUTES = database_settings.access_token_expire_minutes

# Create a new database session
def get_db_session() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_user(user_data: dict) -> User:
    """Crée un nouvel utilisateur dans la base de données."""
    db = next(get_db_session())
    try:
        print("=== Creating User in Service ===")
        print(f"Email: {user_data['email']}")
        print(f"Name: {user_data['name']} {user_data['prenom']}")
        print(f"Password length: {len(user_data['password'])}")
        
        # Hash the password
        print("\nHashing password...")
        hashed_password = hash_password(user_data["password"])
        print(f"Generated hash: {hashed_password}")
        print(f"Hash length: {len(hashed_password)}")
        
        # Create user instance
        print("\nCreating user instance...")
        user = User(
            email=user_data["email"],
            name=user_data["name"],
            prenom=user_data["prenom"],
            password_hash=hashed_password,
            is_verified=user_data.get("is_verified", False),
            is_active=user_data.get("is_active", True)
        )
        
        # Add to database
        print("\nSaving to database...")
        db.add(user)
        db.commit()
        db.refresh(user)
        
        print("✅ User created successfully")
        print(f"User ID: {user.user_id}")
        print(f"Stored hash: {user.password_hash}")
        print(f"Stored hash length: {len(user.password_hash)}")
        
        return user
    except Exception as e:
        print(f"❌ Error creating user: {str(e)}")
        if 'db' in locals():
            db.rollback()
        raise Exception(f"Failed to create user: {str(e)}")
    finally:
        if 'db' in locals():
            db.close()

def get_user_by_email(email: str) -> Optional[User]:
    """Récupère un utilisateur par son email."""
    db = next(get_db_session())
    try:
        return db.query(User).filter(User.email == email).first()
    finally:
        db.close()

def verify_user_password(email: str, password: str) -> bool:
    """Vérifie si les identifiants sont corrects."""
    db = next(get_db_session())
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            return False
        return verify_password(password, user.password_hash)
    except Exception as e:
        raise Exception(f"Error verifying password: {str(e)}")
    finally:
        db.close()

async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    """
    Dependency that will return the current user based on the JWT token.
    
    Args:
        token: The JWT token from the Authorization header
        
    Returns:
        User: The authenticated user
        
    Raises:
        HTTPException: If token is invalid or user not found
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Decode the JWT token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    # Get user from database
    user = get_user_by_email(email=email)
    if user is None:
        raise credentials_exception
        
    return user
