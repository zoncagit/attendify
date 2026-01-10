"""
Notification service for sending attendance-related emails.
"""
import logging
from typing import Optional
from datetime import datetime, date

from app.services.email_service import EmailService

logger = logging.getLogger(__name__)


class NotificationService:
    """Service for sending attendance-related notifications via email."""
    
    def __init__(self):
        self.email_service = EmailService.get_instance()
    
    def send_class_reminder(
        self, 
        to_email: str, 
        student_name: str,
        class_name: str, 
        session_topic: Optional[str],
        session_time: str,
        session_date: str
    ) -> bool:
        """
        Send a reminder email for an upcoming class session.
        """
        subject = f"Reminder: {class_name} session today"
        
        topic_text = f" - {session_topic}" if session_topic else ""
        
        body = f"""Hello {student_name},

This is a reminder that you have an upcoming class session:

Class: {class_name}{topic_text}
Date: {session_date}
Time: {session_time}

Please make sure to attend and mark your attendance.

Best regards,
Attendify Team
"""
        
        html = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: 'DM Sans', sans-serif; color: #1e293b; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #6d28d9, #7c3aed); color: white; padding: 20px; border-radius: 4px 4px 0 0; }}
        .content {{ background: #f8fafc; padding: 20px; border-radius: 0 0 4px 4px; }}
        .session-info {{ background: white; padding: 15px; border-radius: 4px; margin: 15px 0; border-left: 4px solid #6d28d9; }}
        .footer {{ color: #64748b; font-size: 12px; margin-top: 20px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📚 Class Reminder</h1>
        </div>
        <div class="content">
            <p>Hello <strong>{student_name}</strong>,</p>
            <p>This is a reminder that you have an upcoming class session:</p>
            <div class="session-info">
                <strong>Class:</strong> {class_name}{topic_text}<br>
                <strong>Date:</strong> {session_date}<br>
                <strong>Time:</strong> {session_time}
            </div>
            <p>Please make sure to attend and mark your attendance.</p>
            <div class="footer">
                <p>Best regards,<br>Attendify Team</p>
            </div>
        </div>
    </div>
</body>
</html>
"""
        
        return self.email_service.send_email(to_email, subject, body, html)
    
    def send_missed_class_notification(
        self,
        to_email: str,
        student_name: str,
        class_name: str,
        session_topic: Optional[str],
        session_date: str
    ) -> bool:
        """
        Send a notification for a missed class session.
        """
        subject = f"Missed Class: {class_name}"
        
        topic_text = f" ({session_topic})" if session_topic else ""
        
        body = f"""Hello {student_name},

We noticed you were marked absent for the following class session:

Class: {class_name}{topic_text}
Date: {session_date}

If you believe this was an error, please contact your class instructor.

Best regards,
Attendify Team
"""
        
        html = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: 'DM Sans', sans-serif; color: #1e293b; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 20px; border-radius: 4px 4px 0 0; }}
        .content {{ background: #f8fafc; padding: 20px; border-radius: 0 0 4px 4px; }}
        .session-info {{ background: white; padding: 15px; border-radius: 4px; margin: 15px 0; border-left: 4px solid #f59e0b; }}
        .footer {{ color: #64748b; font-size: 12px; margin-top: 20px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⚠️ Missed Class</h1>
        </div>
        <div class="content">
            <p>Hello <strong>{student_name}</strong>,</p>
            <p>We noticed you were marked absent for the following class session:</p>
            <div class="session-info">
                <strong>Class:</strong> {class_name}{topic_text}<br>
                <strong>Date:</strong> {session_date}
            </div>
            <p>If you believe this was an error, please contact your class instructor.</p>
            <div class="footer">
                <p>Best regards,<br>Attendify Team</p>
            </div>
        </div>
    </div>
</body>
</html>
"""
        
        return self.email_service.send_email(to_email, subject, body, html)
    
    def send_absence_warning(
        self,
        to_email: str,
        student_name: str,
        class_name: str,
        absence_count: int,
        total_sessions: int,
        attendance_percentage: float
    ) -> bool:
        """
        Send a warning email when absences exceed threshold (default: 3).
        """
        subject = f"⚠️ Attendance Warning: {class_name}"
        
        body = f"""Hello {student_name},

This is an attendance warning for {class_name}.

Your current attendance statistics:
- Total Sessions: {total_sessions}
- Absences: {absence_count}
- Attendance Rate: {attendance_percentage:.1f}%

You have exceeded the allowed number of absences. Please take immediate action to improve your attendance.

If you have any concerns, please contact your class instructor.

Best regards,
Attendify Team
"""
        
        html = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: 'DM Sans', sans-serif; color: #1e293b; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 20px; border-radius: 4px 4px 0 0; }}
        .content {{ background: #f8fafc; padding: 20px; border-radius: 0 0 4px 4px; }}
        .stats {{ background: white; padding: 15px; border-radius: 4px; margin: 15px 0; border-left: 4px solid #ef4444; }}
        .stat-row {{ display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }}
        .stat-row:last-child {{ border-bottom: none; }}
        .warning {{ color: #ef4444; font-weight: bold; }}
        .footer {{ color: #64748b; font-size: 12px; margin-top: 20px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚨 Attendance Warning</h1>
        </div>
        <div class="content">
            <p>Hello <strong>{student_name}</strong>,</p>
            <p>This is an attendance warning for <strong>{class_name}</strong>.</p>
            <div class="stats">
                <div class="stat-row">
                    <span>Total Sessions:</span>
                    <span>{total_sessions}</span>
                </div>
                <div class="stat-row">
                    <span>Absences:</span>
                    <span class="warning">{absence_count}</span>
                </div>
                <div class="stat-row">
                    <span>Attendance Rate:</span>
                    <span class="{'warning' if attendance_percentage < 75 else ''}">{attendance_percentage:.1f}%</span>
                </div>
            </div>
            <p><strong>You have exceeded the allowed number of absences.</strong> Please take immediate action to improve your attendance.</p>
            <p>If you have any concerns, please contact your class instructor.</p>
            <div class="footer">
                <p>Best regards,<br>Attendify Team</p>
            </div>
        </div>
    </div>
</body>
</html>
"""
        
        return self.email_service.send_email(to_email, subject, body, html)


# Singleton instance
_notification_service: Optional[NotificationService] = None


def get_notification_service() -> NotificationService:
    """Get or create the notification service singleton."""
    global _notification_service
    if _notification_service is None:
        _notification_service = NotificationService()
    return _notification_service
