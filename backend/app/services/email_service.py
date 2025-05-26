# app/services/email_service.py
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import logging
from typing import Optional
from app.config import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EmailService:
    _instance = None
    is_configured = False

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def __init__(self):
        if self.__class__._instance is not None:
            raise ValueError("EmailService is a singleton - use get_instance() instead")

        try:
            # Load settings from Pydantic
            self.smtp_server = settings.smtp_server
            self.smtp_port = settings.smtp_port
            self.smtp_user = settings.smtp_user
            self.smtp_password = settings.smtp_password
            self.email_from = settings.email_from
            self.email_from_name = settings.email_from_name
            
            # Log configuration
            logger.info(f"SMTP Server: {self.smtp_server}")
            logger.info(f"SMTP Port: {self.smtp_port}")
            logger.info(f"SMTP User: {self.smtp_user}")
            logger.info(f"From Email: {self.email_from}")
            logger.info(f"Email From Name: {self.email_from_name}")
            logger.info("Email service initialized successfully")
            
            # Set flag to indicate email is configured
            self.is_configured = True

        except Exception as e:
            logger.error(f"Failed to initialize email service: {str(e)}", exc_info=True)
            self.is_configured = False

    def send_email(self, to_email: str, subject: str, body: str, html: Optional[str] = None) -> bool:
        if not self.is_configured:
            logger.warning("Email service is not configured - cannot send email")
            return False

        try:
            # Create message
            msg = MIMEMultipart()
            msg['From'] = f"{self.email_from_name} <{self.email_from}>"
            msg['To'] = to_email
            msg['Subject'] = subject

            if html:
                msg.attach(MIMEText(body, 'plain'))
                msg.attach(MIMEText(html, 'html'))
            else:
                msg.attach(MIMEText(body, 'plain'))

            # Send email
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_user, self.smtp_password)
                server.sendmail(self.email_from, to_email, msg.as_string())
                logger.info(f"Email sent successfully to {to_email}")
                return True

        except smtplib.SMTPAuthenticationError:
            logger.error("Failed to authenticate with SMTP server")
            return False
        except smtplib.SMTPException as e:
            logger.error(f"SMTP error occurred: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"Failed to send email: {str(e)}")
            return False