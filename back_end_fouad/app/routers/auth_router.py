from fastapi import APIRouter
from app.auth.auth import router

# This just re-exports the auth router
# All routes are defined in app/auth/auth.py