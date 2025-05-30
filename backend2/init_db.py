from app.database import init_db
from app.models.user import User
from app.models.classroom import Class
from app.models.class_user import ClassUser
from app.models.attendance import Attendance
from app.models.log import Log
from app.models.session import Session
from app.models.password_reset_token import PasswordResetToken
from app.models.group import Group
from app.models.group_user import GroupUser

def main():
    """Initialize the database by creating all tables."""
    print("Creating database tables...")
    init_db()
    print("Database tables created successfully!")

if __name__ == "__main__":
    main() 