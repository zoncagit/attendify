from .user import UserCreate, UserOut, UserLogin, PasswordResetRequest, PasswordReset, UserProfile
from .verification import VerificationRequest
from .classroom import ClassBase, ClassCreate, ClassOut
from .session import (
    SessionBase, 
    SessionCreate, 
    SessionOut,
    SessionQRCode,
    QRCodeStatus,
    AttendanceMarkRequest,
    SessionShareLink
)
from .attendance import (
    AttendanceBase as Attendance,
    AttendanceCreate,
    AttendanceUpdate,
    AttendanceOut,
    AttendanceBulkCreate,
    AttendanceStats,
    AttendanceStatus
)

__all__ = [
    # User related
    "UserCreate", 
    "UserOut", 
    "UserLogin", 
    "PasswordResetRequest", 
    "PasswordReset",
    "UserProfile",
    
    # Verification
    "VerificationRequest",
    
    # Classroom related
    "ClassBase",
    "ClassCreate",
    "ClassOut",
    
    # Session related
    "SessionBase",
    "SessionCreate",
    "SessionOut",
    "SessionQRCode",
    "SessionShareLink",
    "QRCodeStatus",
    "AttendanceMarkRequest",
    
    # Attendance related
    "Attendance",
    "AttendanceCreate",
    "AttendanceUpdate",
    "AttendanceOut",
    "AttendanceBulkCreate",
    "AttendanceStats",
    "AttendanceStatus"
]
