from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app import models, schemas
from app.config import settings
from app.database import get_db
from app.auth.jwt import verify_access_token
from app.services import email_service

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = verify_access_token(token)
        user_id = payload.get("user_id")
        if user_id is None:
            raise credentials_exception
        user = db.query(models.User).filter(models.User.user_id == user_id).first()
        if user is None:
            raise credentials_exception
        return user
    except Exception:
        raise credentials_exception