"""
Initialize and expose the email service.
"""

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

from .email_service import EmailService
from .auth_service import create_user, get_user_by_email, verify_user_password

# Initialize email service
email_service = EmailService()

__all__ = ['email_service', 'create_user', 'get_user_by_email', 'verify_user_password']
