from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm

from app.models.user import User
from app.models.pre_verification import PreVerification
from app.database import get_db
from app.services.email_service import EmailService
from app.services import auth_service
from app.schemas.user import UserCreate, UserLogin
from app.schemas.verification import VerificationCode
from datetime import datetime, timedelta
import random
from app.auth.hashing import hash_password, verify_password
from app.auth.jwt import create_access_token
from datetime import datetime, timedelta
import secrets
import logging
from typing import Optional

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(tags=["auth"])

@router.post("/signup")
def signup(user_data: UserCreate, db: Session = Depends(get_db)):
    """Crée une pré-vérification pour l'inscription"""
    try:
        # Vérifier si l'email existe déjà
        if db.query(User).filter(User.email == user_data.email).first():
            raise HTTPException(status_code=400, detail="Cette adresse email est déjà utilisée")

        # Vérifier si une pré-vérification existe déjà
        if db.query(PreVerification).filter(PreVerification.email == user_data.email).first():
            raise HTTPException(status_code=400, detail="Une vérification est déjà en cours pour cette email")

        # Générer un code de vérification
        verification_code = str(random.randint(100000, 999999))
        expires_at = datetime.now() + timedelta(minutes=10)

        # Créer l'entrée de pré-vérification
        pre_verification = PreVerification(
            email=user_data.email,
            verification_code=verification_code,
            expires_at=expires_at
        )
        db.add(pre_verification)
        db.commit()
        db.refresh(pre_verification)

        # Envoyer l'email de vérification
        email_service = EmailService.get_instance()
        if email_service.is_configured:
            email_service.send_email(
                to_email=user_data.email,
                subject="Vérification de votre inscription",
                body=f"""
Bonjour,

Merci de vous être inscrit sur notre plateforme.

Pour finaliser votre inscription, veuillez utiliser le code de vérification suivant :

{verification_code}

Ce code expire dans 24 heures.
"""
            )

        return {"detail": "Code de vérification envoyé", "next_step": "/verify"}

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/verify")
def verify(verification: VerificationCode, db: Session = Depends(get_db)):
    """Vérifie le code et crée l'utilisateur"""
    try:
        # Vérifier le code
        pre_verification = db.query(PreVerification).filter_by(
            email=verification.email,
            verification_code=verification.verification_code
        ).first()
        
        if not pre_verification:
            raise HTTPException(status_code=400, detail="Code invalide ou expiré")

        if pre_verification.expires_at < datetime.now():
            db.delete(pre_verification)
            db.commit()
            raise HTTPException(status_code=400, detail="Code expiré")

        # Créer l'utilisateur avec les services d'authentification
        user_data = {
            "name": "",
            "prenom": "",
            "email": verification.email,
            "password": verification.verification_code
        }
        user = auth_service.create_user(db, user_data)

        # Supprimer l'entrée de pré-vérification
        db.delete(pre_verification)
        db.commit()

        # Créer un token JWT
        access_token = create_access_token(
            data={"sub": verification.email},
            expires_delta=timedelta(minutes=30)
        )

        return {"access_token": access_token, "token_type": "bearer"}

    except Exception as e:
        logger.error(f"Error during signup: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create user: {str(e)}"
        )

@router.post("/login")
def login(user_credentials: UserLogin, db: Session = Depends(get_db)):
    """Login user and return JWT token"""
    user = db.query(User).filter(User.email == user_credentials.email).first()
    if not user or not verify_password(user_credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = create_access_token(data={"sub": user.user_id})
    return {"access_token": token, "token_type": "bearer"}

@router.post("/logout")
def logout():
    """Simple logout endpoint that just returns a success message.
    In a production environment, we would invalidate the token."""
    return {"detail": "Successfully logged out"}