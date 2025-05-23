import logging
from fastapi import FastAPI
from app.database import engine
from app.models import Base
from app.auth.auth import router as auth_router
from app.routers.password_reset import router as password_reset_router

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(debug=True)

# Include routers directly
app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(password_reset_router, prefix="/password-reset", tags=["password-reset"])

@app.get("/")
def root():
    return {"message": "Attendance API"}