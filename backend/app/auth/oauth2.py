from typing import List, Optional
from fastapi import Depends, HTTPException, Security, status
from fastapi.security import OAuth2PasswordBearer, SecurityScopes
from jose import JWTError
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app import models
from app.database import get_db
from app.auth.jwt import verify_access_token

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/auth/login",
    scopes={
        "student": "Read access to student resources",
        "teacher": "Read and write access to teacher resources",
        "admin": "Admin access"
    }
)

def get_current_user(
    security_scopes: SecurityScopes,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    """
    Get the current user from the token and verify required scopes.
    """
    if security_scopes.scopes:
        authenticate_value = f'Bearer scope=\"{security_scopes.scope_str}\"'
    else:
        authenticate_value = "Bearer"

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": authenticate_value},
    )

    try:
        payload = verify_access_token(token)
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        token_scopes = payload.get("scopes", [])
        token_data = {"sub": user_id, "scopes": token_scopes}
    except (JWTError, ValidationError):
        raise credentials_exception

    user = db.query(models.User).filter(models.User.user_id == int(user_id)).first()
    if user is None:
        raise credentials_exception

    # Check scopes
    for scope in security_scopes.scopes:
        if scope not in token_scopes:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions",
                headers={"WWW-Authenticate": authenticate_value},
            )

    return user

def get_current_active_user(
    current_user: models.User = Security(get_current_user, scopes=[])
) -> models.User:
    """
    Get the current active user (no specific scopes required).
    """
    return current_user