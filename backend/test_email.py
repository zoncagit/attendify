import os
from dotenv import load_dotenv
from pathlib import Path

# Set environment variables directly for testing
os.environ['SMTP_SERVER'] = 'smtp.gmail.com'
os.environ['SMTP_PORT'] = '587'
os.environ['SMTP_USER'] = 'mimo90977@gmail.com'
os.environ['SMTP_PASSWORD'] = 'drxarjdqaxqtlfnf'
os.environ['EMAIL_FROM'] = 'mimo90977@gmail.com'
os.environ['EMAIL_FROM_NAME'] = 'Attendify Support'

# Load .env file explicitly
dotenv_path = Path(__file__).parent / ".env"
print(f"Loading .env from: {dotenv_path}")
load_dotenv(dotenv_path)

print("=== Environment Variables ===")
print(f"SMTP_USER: {os.environ.get('SMTP_USER')}")
print(f"SMTP_PASSWORD: {'*' * len(os.environ.get('SMTP_PASSWORD', ''))}")
print(f"EMAIL_FROM: {os.environ.get('EMAIL_FROM')}")

from app.services.email_service import EmailService

def test_email_service():
    # Test email service initialization
    email_service = EmailService.get_instance()
    
    if not email_service.is_configured:
        print("\nEmail service is not properly configured!")
        print("Please check your .env file and ensure the following variables are set:")
        print("- SMTP_USER")
        print("- SMTP_PASSWORD")
        print("- EMAIL_FROM")
        return

    # Test sending email
    try:
        email_service.send_email(
            to_email="mimo90977@gmail.com",
            subject="Test Email",
            body="This is a test email from Attendify."
        )
        print("\nEmail sent successfully!")
    except Exception as e:
        print(f"\nError sending email: {str(e)}")

if __name__ == "__main__":
    test_email_service()
