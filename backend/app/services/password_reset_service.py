import secrets
import string
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy import Column, String, Integer
from sqlalchemy.orm import relationship, Session

from .email_service import EmailService
from app.models.user import User
from app.models.password_reset import PasswordResetToken
from app.database import get_db

# Initialize email service
email_service = EmailService.get_instance()
if not email_service.is_configured:
    raise Exception("Email service not properly configured")

class PasswordResetService:
    @staticmethod
    def generate_verification_code() -> str:
        """Generate a 6-digit verification code."""
        return ''.join(secrets.choice(string.digits) for _ in range(6))

    @staticmethod
    def send_reset_email(email: str, db: Session) -> Optional[str]:
        """
        Send a password reset email with a verification code.
        Returns the verification code if email is sent successfully, None otherwise.
        """
        try:
            # Generate verification code
            verification_code = PasswordResetService.generate_verification_code()
            
            # Get user details before sending email
            user = db.query(User).filter(User.email == email).first()
            if not user:
                return None

            # Store the verification code in the database with expiration time
            db.add(PasswordResetToken(
                user_id=user.user_id,
                token=verification_code,
                expires_at=datetime.utcnow() + timedelta(minutes=15)
            ))
            db.commit()

            # Send email with personalized message including both code and link
            email_service.send_email(
                to_email=email,
                subject="Password Reset Request",
                body=f"Dear {user.name} {user.prenom},\n\n"
                     f"We received a request to reset your password.\n\n"
                     f"Your verification code is: {verification_code}\n\n"
                     f"You can also click on the following link to reset your password:\n"
                     f"http://localhost:8000/password-reset/reset-password?token={verification_code}\n\n"
                     f"This code/link will expire in 15 minutes.\n\n"
                     f"If you didn't request this password reset, please ignore this email.\n\n"
                     f"Best regards,\n"
                     f"The Attendify Team"
            )
            
            return verification_code

        except Exception as e:
            print(f"Error sending reset email: {str(e)}")
            return None

    @staticmethod
    def verify_reset_code_and_change_password(email: str, verification_code: str, new_password: str, db: Session) -> bool:
        """
        Verify the verification code and reset the password if valid.
        Returns True if password was successfully reset, False otherwise.
        """
        try:
            print(f"Attempting to reset password for email: {email}")
            print(f"Verification code received: {verification_code}")
            
            # Get user and token in a single query
            user = db.query(User).filter(User.email == email).first()
            if not user:
                print(f"User not found for email: {email}")
                return False

            print(f"User found with ID: {user.user_id}")
            
            token = db.query(PasswordResetToken).filter(
                PasswordResetToken.user_id == user.user_id,
                PasswordResetToken.token == verification_code,
                PasswordResetToken.expires_at > datetime.utcnow()
            ).first()

            if not token:
                print(f"Token not found or expired for user {user.user_id}, email: {email}")
                return False

            print(f"Found token with token_id: {token.token_id}")
            print(f"Token expires at: {token.expires_at}")

            # Update password
            user.password_hash = User.hash_password(new_password)
            
            # Delete the used token
            db.delete(token)
            
            # Commit all changes in one transaction
            db.commit()
            print(f"Password reset successful for user {user.user_id}")
            return True

        except Exception as e:
            print(f"Error resetting password: {str(e)}")
            return False
            return verification_code
        except Exception as e:
            print(f"Error sending reset email: {str(e)}")
            return None

    @staticmethod
    def verify_code_and_reset_password(email: str, verification_code: str, new_password: str) -> bool:
        """
        Verify the verification code and reset the password if valid.
        Returns True if password was successfully reset, False otherwise.
        """
        try:
            # Get user by email
            with get_db() as db:
                user = db.query(User).filter(User.email == email).first()
                if not user:
                    return False

                # Here you would typically check if the verification code is valid
                # and hasn't expired. For now, we'll just accept any code.
                # In a real implementation, you would store the code in the database
                # with an expiration timestamp.

                # Update password
                user.password = User.hash_password(new_password)
                db.commit()
                return True

        except Exception as e:
            print(f"Error resetting password: {str(e)}")
            return False
