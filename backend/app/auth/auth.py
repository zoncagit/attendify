from datetime import datetime, timedelta
import logging
import random
import secrets
from typing import Any, Dict, Optional

from fastapi import APIRouter, Body, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from pydantic import BaseModel, EmailStr

from app.database import get_db
from app.models.pre_verification import PreVerification
from app.models.user import User, UserRole
from app.models.password_reset_token import PasswordResetToken
from app.schemas.user_schema import Token, UserCreate, UserLogin
from app.schemas.verification import VerificationRequest
from app.services import auth_service
from app.services.email_service import EmailService
from app.services.password_reset_service import PasswordResetService
from app.auth.hashing import hash_password, verify_password
from app.auth.jwt import create_access_token, create_user_access_token

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create router with auth prefix and tags
router = APIRouter(prefix="", tags=["Authentication"])

class ResetPasswordRequest(BaseModel):
    email: EmailStr

class VerifyCodeRequest(BaseModel):
    email: EmailStr
    verification_code: str
    new_password: str

@router.post("/signup")
async def signup(user_data: UserCreate):
    """Crée un nouvel utilisateur avec vérification automatique"""
    db = next(get_db())
    try:
        print(f"=== Nouvelle inscription: {user_data.email} ===")
        
        # Vérifier si l'email existe déjà
        if db.query(User).filter(User.email == user_data.email).first():
            db.close()
            raise HTTPException(status_code=400, detail="Cette adresse email est déjà utilisée")

        # Hasher le mot de passe
        print("Hachage du mot de passe...")
        hashed_password = hash_password(user_data.password)
        print(f"Mot de passe haché: {hashed_password}")

        # Créer un code de vérification
        verification_code = str(random.randint(100000, 999999))
        expires_at = datetime.now() + timedelta(minutes=10)

        # Stocker les données de pré-vérification
        pre_verification = PreVerification(
            email=user_data.email,
            name=user_data.name,
            prenom=user_data.prenom,
            verification_code=verification_code,
            password=user_data.password,  # Store plain password
            password_hash=hashed_password,
            expires_at=expires_at
        )
        
        db.add(pre_verification)
        db.commit()
        db.refresh(pre_verification)
        
        print(f"Code de vérification généré pour {user_data.email}: {verification_code}")
        
        # Envoyer l'email de vérification
        email_service = EmailService.get_instance()
        if email_service.is_configured:
            try:
                email_service.send_email(
                    to_email=user_data.email,
                    subject="Vérifiez votre email",
                    body=f"""
Bonjour {user_data.name},

Merci de vous être inscrit sur notre plateforme.

Votre code de vérification est : {verification_code}

Ce code expirera dans 10 minutes.

Cordialement,
L'équipe de support
"""
                )
                print("Email de vérification envoyé")
            except Exception as email_error:
                print(f"Erreur lors de l'envoi de l'email de vérification: {str(email_error)}")

        return {
            "detail": "Email de vérification envoyé",
            "next_step": "/verify",
            "email": user_data.email,
            "verification_code": verification_code  # Only for testing, remove in production
        }

    except HTTPException as he:
        if 'db' in locals():
            db.rollback()
        raise he
    except Exception as e:
        if 'db' in locals():
            db.rollback()
        print(f"Erreur lors de l'inscription: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Une erreur est survenue lors de l'inscription: {str(e)}"
        )
    finally:
        if 'db' in locals():
            db.close()

@router.post(
    "/verify",
    response_model=dict,
    status_code=status.HTTP_200_OK,
    responses={
        200: {
            "description": "User verified successfully",
            "content": {
                "application/json": {
                    "example": {
                        "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                        "token_type": "bearer",
                        "user": {
                            "email": "user@example.com",
                            "name": "John",
                            "prenom": "Doe",
                            "role": "student"
                        }
                    }
                }
            }
        },
        400: {
            "description": "Invalid verification code or code expired"
        },
        500: {
            "description": "Internal server error during verification"
        }
    }
)
async def verify(verification: VerificationRequest = Body(
    example={"verification_code": "123456"},
    openapi_examples={
        "normal": {
            "summary": "Verification Example",
            "value": {
                "verification_code": "123456"
            }
        }
    }
)):
    """
    Verify the verification code and create the user account.
    
    - **verification_code**: 6-digit verification code sent to the user's email (required)
    
    Returns:
        - Access token and user information if verification is successful
        - Error message if verification fails
    """
    db = next(get_db())
    try:
        print("=== Verification Attempt ===")
        print(f"Verification code: {verification.verification_code}")
        
        # Vérifier le code
        pre_verification = db.query(PreVerification).filter_by(
            verification_code=verification.verification_code
        ).first()
        
        if not pre_verification:
            print("❌ Pre-verification not found")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Code de vérification invalide",
            )
        
        # Vérifier si le code a expiré
        if pre_verification.expires_at < datetime.now():
            print("❌ Verification code expired")
            # Supprimer la pré-vérification expirée
            db.delete(pre_verification)
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Le code de vérification a expiré. Veuillez recommencer l'inscription.",
            )
        
        print("✅ Verification code is valid")
        
        # Debug print the pre_verification data
        print("=== PreVerification Data ===")
        print(f"Email: {pre_verification.email}")
        print(f"Name: {pre_verification.name} {pre_verification.prenom}")
        print(f"Has password: {bool(pre_verification.password)}")
        print(f"Has password_hash: {bool(pre_verification.password_hash)}")
        
        # Créer l'utilisateur avec le mot de passe hashé
        user_data = {
            "email": pre_verification.email,
            "name": pre_verification.name,
            "prenom": pre_verification.prenom,
            "password": pre_verification.password,  # This should be the plain password
            "is_verified": True,  # Mark user as verified
            "is_active": True,    # Ensure user is active
            "role": "student"     # Default role
        }
        
        # Debug print the user data
        print("=== Creating user with data ===")
        print(f"Email: {user_data['email']}")
        print(f"Name: {user_data['name']} {user_data['prenom']}")
        print(f"Password provided: {bool(user_data['password'])}")
        
        try:
            user = auth_service.create_user(user_data)
            print("✅ User created successfully")
        except Exception as e:
            print(f"❌ Error creating user: {str(e)}")
            raise
        
        # Supprimer la pré-vérification
        db.delete(pre_verification)
        db.commit()
        print("✅ Pre-verification entry deleted")
        
        # Créer un token d'accès
        access_token = create_user_access_token(user)
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "email": user.email,
                "name": user.name,
                "prenom": user.prenom,
                "role": user.role.value if user.role else None
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in verify: {str(e)}")
        if 'db' in locals():
            db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Une erreur est survenue lors de la vérification: {str(e)}"
        )
    finally:
        if 'db' in locals():
            db.close()

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    OAuth2 compatible token login, get an access token for future requests
    
    - **username**: Your email address
    - **password**: Your password
    """
    db = next(get_db())
    try:
        print("=== Login Attempt ===")
        print(f"Email: {form_data.username}")
        
        # Find user by email (username in OAuth2PasswordRequestForm is the email)
        user = db.query(User).filter(User.email == form_data.username).first()
        
        # Verify user exists and password is correct
        if not user or not verify_password(form_data.password, user.password_hash):
            print("❌ Invalid email or password")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Check if user is active
        if not user.is_active:
            print("❌ Inactive user")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Inactive user"
            )
            
        # Check if user is verified
        if not user.is_verified:
            print("❌ Email not verified")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Please verify your email before logging in. Check your email for the verification code.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Update last login timestamp
        print("✅ User authenticated, updating last login")
        user.last_login = func.now()
        db.commit()
        db.refresh(user)
        
        # Create access token with appropriate scopes based on user role
        access_token = create_user_access_token(user)
        print("✅ Access token created")
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "user_id": user.user_id,
                "email": user.email,
                "name": user.name,
                "prenom": user.prenom,
                "role": user.role.value if user.role else None
            }
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"❌ Error in login: {str(e)}")
        if 'db' in locals():
            db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during login: {str(e)}"
        )
    finally:
        if 'db' in locals():
            db.close()


@router.post("/logout")
async def logout(current_user: User = Depends(auth_service.get_current_user)):
    """
    Logout endpoint.
    
    In a production environment, you might want to implement token blacklisting here.
    For now, it's up to the client to delete the token.
    """
    try:
        print(f"✅ User {current_user.email} logged out successfully")
        # Here you could add token blacklisting logic if needed
        # For now, we'll just log the logout and let the client handle token deletion
        return {
            "message": "Successfully logged out. Please delete your access token on the client side.",
            "success": True
        }
    except Exception as e:
        print(f"❌ Error during logout: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during logout"
        )

# Password Reset Endpoints
@router.post("/request-password-reset")
async def request_password_reset(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    """
    Request a password reset. Sends a verification code to the provided email.
    
    - **email**: The email address to send the reset code to
    """
    try:
        print(f"=== Password reset request for email: {request.email} ===")
        # Use the service to handle the password reset request
        verification_code = PasswordResetService.send_reset_email(request.email, db)
        
        if not verification_code:
            logger.error(f"User not found for email: {request.email}")
            raise HTTPException(status_code=404, detail="User not found")

        logger.info(f"Password reset email sent to {request.email}")
        return {"message": "Reset email sent successfully", "token": verification_code}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error requesting password reset: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process password reset request"
        )

@router.get("/reset-password")
async def reset_password_page(token: str):
    """
    Password reset page with token in URL.
    
    - **token**: The verification token received in the email
    """
    return HTMLResponse(
        content=f"""
        <html>
            <head>
                <title>Reset Password</title>
                <style>
                    body {{
                        font-family: Arial, sans-serif;
                        max-width: 500px;
                        margin: 0 auto;
                        padding: 20px;
                    }}
                    .container {{
                        background-color: #f5f5f5;
                        padding: 20px;
                        border-radius: 5px;
                        box-shadow: 0 0 10px rgba(0,0,0,0.1);
                    }}
                    .form-group {{
                        margin-bottom: 15px;
                    }}
                    label {{
                        display: block;
                        margin-bottom: 5px;
                        font-weight: bold;
                    }}
                    input[type="password"] {{
                        width: 100%;
                        padding: 8px;
                        border: 1px solid #ddd;
                        border-radius: 4px;
                        box-sizing: border-box;
                        margin-bottom: 10px;
                    }}
                    button {{
                        background-color: #4CAF50;
                        color: white;
                        padding: 10px 15px;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        width: 100%;
                    }}
                    button:hover {{
                        background-color: #45a049;
                    }}
                    .error {{
                        color: #d32f2f;
                        margin-bottom: 15px;
                    }}
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Reset Your Password</h1>
                    <form id="resetForm" method="post" action="/auth/reset-password">
                        <input type="hidden" name="token" value="{token}">
                        <div class="form-group">
                            <label for="new_password">New Password:</label>
                            <input type="password" id="new_password" name="new_password" required minlength="8">
                        </div>
                        <div class="form-group">
                            <label for="confirm_password">Confirm New Password:</label>
                            <input type="password" id="confirm_password" name="confirm_password" required minlength="8">
                        </div>
                        <button type="submit" id="submitBtn">Reset Password</button>
                    </form>
                </div>
                <script>
                    document.getElementById('resetForm').addEventListener('submit', function(e) {{
                        const password = document.getElementById('new_password').value;
                        const confirmPassword = document.getElementById('confirm_password').value;
                        
                        if (password !== confirmPassword) {{
                            e.preventDefault();
                            alert('Passwords do not match!');
                            return false;
                        }}
                        
                        if (password.length < 8) {{
                            e.preventDefault();
                            alert('Password must be at least 8 characters long!');
                            return false;
                        }}
                        
                        // Disable the submit button to prevent double submission
                        document.getElementById('submitBtn').disabled = true;
                        return true;
                    }});
                </script>
            </body>
        </html>
        """
    )

@router.post("/reset-password")
async def reset_password_submit(request: Request, db: Session = Depends(get_db)):
    """
    Handle password reset form submission.
    
    - **token**: Verification token from email
    - **new_password**: New password to set
    - **confirm_password**: Confirmation of new password
    """
    try:
        # Get form data
        form_data = await request.form()
        token = form_data.get("token")
        new_password = form_data.get("new_password")
        confirm_password = form_data.get("confirm_password")

        if not all([token, new_password, confirm_password]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing required fields"
            )
            
        if new_password != confirm_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Passwords do not match"
            )
            
        if len(new_password) < 8:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must be at least 8 characters long"
            )

        # Find the token in the database to get the associated user
        reset_token = db.query(PasswordResetToken).filter(
            PasswordResetToken.token == token,
            PasswordResetToken.expires_at > datetime.utcnow()
        ).first()

        if not reset_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired token"
            )
            
        # Get the user
        user = db.query(User).filter(User.user_id == reset_token.user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User not found"
            )

        logger.info(f"Password reset attempt for user ID: {user.user_id}")

        # Reset the password
        success = PasswordResetService.verify_reset_code_and_change_password(
            email=user.email,
            verification_code=token,
            new_password=new_password,
            db=db
        )
        
        if not success:
            logger.error(f"Password reset failed for user ID: {user.user_id}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password reset failed"
            )
        
        # Delete the used token
        db.delete(reset_token)
        db.commit()
        
        logger.info(f"Password successfully reset for user ID: {user.user_id}")
        return HTMLResponse(
            content="""
            <html>
                <head>
                    <title>Password Reset Successful</title>
                    <style>
                        body {{ 
                            font-family: Arial, sans-serif; 
                            text-align: center; 
                            padding: 40px 20px;
                        }}
                        .success-message {{
                            max-width: 500px;
                            margin: 0 auto;
                            padding: 20px;
                            background-color: #dff0d8;
                            border: 1px solid #d6e9c6;
                            border-radius: 4px;
                            color: #3c763d;
                        }}
                        a {{
                            color: #3c763d;
                            font-weight: bold;
                            text-decoration: none;
                        }}
                    </style>
                </head>
                <body>
                    <div class="success-message">
                        <h2>Password Reset Successful!</h2>
                        <p>Your password has been successfully updated.</p>
                        <p><a href="/login">Click here to login</a> with your new password.</p>
                    </div>
                </body>
            </html>
            """
        )

    except HTTPException as he:
        logger.error(f"Password reset HTTP error: {str(he)}")
        raise
    except Exception as e:
        logger.error(f"Password reset error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while resetting password"
        )