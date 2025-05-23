from .auth_router import router as auth_router
from .user_router import router as user_router
from .classroom_router import router as classroom_router
from .session_router import router as session_router
from .attendance_router import router as attendance_router

__all__ = [
    "auth_router",
    "user_router",
    "classroom_router",
    "session_router",
    "attendance_router"
]