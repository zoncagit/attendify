from datetime import datetime, timedelta
from typing import Dict, List, Optional, Union
from jose import jwt, JWTError
from fastapi import HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer

from app.config.database_settings import database_settings
from app.models.user import User, UserRole

# Use settings from database configuration
settings = database_settings
SECRET_KEY = settings.secret_key
ALGORITHM = settings.algorithm
ACCESS_TOKEN_EXPIRE_MINUTES = settings.access_token_expire_minutes

def create_access_token(
    data: dict,
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create a JWT token with the given data.
    
    Args:
        data: Dictionary containing the data to encode in the token
        expires_delta: Optional timedelta for token expiration
        
    Returns:
        str: Encoded JWT token
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def create_user_access_token(user: User) -> str:
    """
    Create an access token for a user with appropriate scopes based on their role.
    
    Args:
        user: User model instance
        
    Returns:
        str: JWT access token
    """
    # Map user roles to scopes
    role_to_scopes = {
        UserRole.STUDENT: ["student"],
        UserRole.TEACHER: ["teacher", "student"],
        UserRole.ADMIN: ["admin", "teacher", "student"]
    }
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return create_access_token(
        data={
            "sub": str(user.user_id),
            "email": user.email,
            "scopes": role_to_scopes.get(user.role, [])
        },
        expires_delta=access_token_expires
    )

def verify_access_token(token: str) -> Dict:
    """
    Verify and decode a JWT token.
    
    Args:
        token: JWT token to verify
        
    Returns:
        Dict: Decoded token payload
        
    Raises:
        HTTPException: If token is invalid or expired
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Remove 'Bearer ' prefix if present
        if token.startswith('Bearer '):
            token = token[7:]
            
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        return payload
    except JWTError:
        raise credentials_exception

def get_user_id_from_token(token: str) -> int:
    """
    Extract the user ID from a JWT token.
    
    Args:
        token: JWT token string
        
    Returns:
        int: User ID from the token
        
    Raises:
        HTTPException: If token is invalid or doesn't contain a user ID
    """
    try:
        payload = verify_access_token(token)
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return int(user_id)
    except (JWTError, ValueError) as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

def get_current_user_payload(token: str = Depends(OAuth2PasswordBearer(tokenUrl="login"))) -> Dict:
    """
    Get the current user's payload from the token.
    
    Args:
        token: JWT token from the Authorization header
        
    Returns:
        Dict: Decoded token payload
    """
    return verify_access_token(token)