from fastapi import FastAPI
from app.database import engine
from app.models import Base
from app.routers import auth_router, user_router, classroom_router, session_router, attendance_router

app = FastAPI()

# Create tables
Base.metadata.create_all(bind=engine)

# Include routers
app.include_router(auth_router.router)
app.include_router(user_router.router)
app.include_router(classroom_router.router)
app.include_router(session_router.router)
app.include_router(attendance_router.router)

@app.get("/")
def root():
    return {"message": "Attendance Management API"}