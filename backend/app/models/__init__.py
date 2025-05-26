from sqlalchemy.ext.declarative import declarative_base

# Import all models to ensure they are registered with SQLAlchemy
from .user import User
from .classroom import Class
from .class_user import ClassUser
from .session import Session
from .attendance import Attendance, AttendanceStatus
from .log import Log
from .password_reset_token import PasswordResetToken
from .pre_verification import PreVerification
from .group import Group
from .group_user import GroupUser

# Import modules to ensure they are registered with SQLAlchemy
from . import user
from . import classroom
from . import class_user
from . import session
from . import attendance
from . import log
from . import password_reset_token
from . import pre_verification
from . import group
from . import group_user

Base = declarative_base()

__all__ = [
    # Models
    "User", 
    "Class", 
    "ClassUser", 
    "Session", 
    "Attendance", 
    "AttendanceStatus", 
    "Log", 
    "PasswordResetToken", 
    "PreVerification", 
    "Group", 
    "GroupUser",
    # Base
    "Base",
    # Modules
    "user",
    "classroom",
    "class_user",
    "session",
    "attendance",
    "log",
    "password_reset_token",
    "pre_verification",
    "group",
    "group_user"
]