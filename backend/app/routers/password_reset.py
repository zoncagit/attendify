import logging
from fastapi import APIRouter, HTTPException, Depends, Request
from sqlalchemy.orm import Session
from app.services.password_reset_service import PasswordResetService
from pydantic import BaseModel
from fastapi.responses import HTMLResponse
from app.database import get_db
from app.models import User, PasswordResetToken
from datetime import datetime, timedelta
from app.services.email_service import EmailService

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize email service
email_service = EmailService.get_instance()
if not email_service.is_configured:
    logger.error("Email service not configured properly")
    raise Exception("Email service not configured properly")

router = APIRouter()

class ResetPasswordRequest(BaseModel):
    email: str

class VerifyCodeRequest(BaseModel):
    email: str
    verification_code: str
    new_password: str

@router.post("/request-password-reset")
async def request_password_reset(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Request a password reset. Sends a verification code to the provided email."""
    try:
        # Use the service to handle the password reset request
        verification_code = PasswordResetService.send_reset_email(request.email, db)
        
        if not verification_code:
            raise HTTPException(status_code=404, detail="User not found")

        return {"message": "Reset email sent successfully", "token": verification_code}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error requesting password reset: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to process password reset request")

@router.get("/reset-password")
async def reset_password_page(token: str):
    """Password reset page with token in URL."""
    return HTMLResponse(
        content="""
        <html>
            <head>
                <title>Reset Password</title>
            </head>
            <body>
                <h1>Reset Password</h1>
                <form method="post" action="reset-password">
                    <input type="hidden" name="token" value="{token}">
                    <input type="email" name="email" placeholder="Email" required>
                    <input type="password" name="new_password" placeholder="New Password" required>
                    <button type="submit">Reset Password</button>
                </form>
            </body>
        </html>
        """.format(token=token)
    )

@router.post("/reset-password")
async def reset_password_submit(request: Request, db: Session = Depends(get_db)):
    """Handle password reset form submission."""
    try:
        # Get form data
        form_data = await request.form()
        email = form_data.get("email")
        token = form_data.get("token")
        new_password = form_data.get("new_password")

        print(f"Form data received:")
        print(f"Email: {email}")
        print(f"Token: {token}")
        print(f"New password: {new_password and '***'}")

        if not all([email, token, new_password]):
            raise HTTPException(status_code=400, detail="Missing required fields: email, token, new_password")

        # Verify the token and reset the password using the provided database session
        success = PasswordResetService.verify_reset_code_and_change_password(
            email=email,
            verification_code=token,
            new_password=new_password,
            db=db
        )
        if not success:
            raise HTTPException(status_code=400, detail="Invalid token or password reset failed")
        
        return {"message": "Password reset successful"}

    except HTTPException as he:
        logger.error(f"Password reset HTTP error: {str(he)}")
        raise
    except Exception as e:
        logger.error(f"Password reset error: {str(e)}")
        raise HTTPException(status_code=500, detail="An error occurred while resetting password")