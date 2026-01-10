from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from fastapi.openapi.utils import get_openapi
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path
from app.database import engine, Base
from app.auth.auth import router as auth_router
from app.routers.classroom_router import router as classroom_router
from app.routers.group_router import router as group_router
from app.routers.user_router import router as user_router
from app.routers.session_router import router as session_router
from app.routers.analytics_router import router as analytics_router
from app.routers.notification_router import router as notification_router
from app.socketio.face_recognition import register_face_recognition_handlers
from app.socketio.attendance import register_attendance_handlers
import socketio
import logging
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize database tables
def create_tables():
    logger.info("Creating database tables...")
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Error creating database tables: {str(e)}")
        raise

create_tables()

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

# Create FastAPI app
app = FastAPI(
    title="Attendify API",
    description="API for Attendify application",
    version="1.0.0",
    debug=os.getenv("DEBUG", "false").lower() == "true",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# CORS - Updated for PythonAnywhere compatibility
ALLOWED_ORIGINS = [
    "*",
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    # PythonAnywhere domains (replace YOUR_USERNAME with actual username)
    "https://*.pythonanywhere.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Static files for uploads (profile photos, etc.)
STATIC_DIR = Path(__file__).parent.parent / "static"
STATIC_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

# Include API routers
app.include_router(auth_router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(classroom_router, prefix="/api/v1/classes", tags=["Classrooms"])
app.include_router(group_router, prefix="/api/v1/groups", tags=["Groups"])
app.include_router(user_router, tags=["Users"])
app.include_router(session_router, tags=["Sessions"])
app.include_router(analytics_router, tags=["Analytics"])
app.include_router(notification_router, tags=["Notifications"])

# Custom OpenAPI with security
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title="Attendify API",
        version="1.0.0",
        description="API for Attendify application",
        routes=app.routes,
    )
    openapi_schema["components"]["securitySchemes"] = {
        "OAuth2PasswordBearer": {
            "type": "oauth2",
            "flows": {
                "password": {
                    "tokenUrl": "/api/v1/auth/login",
                    "scopes": {
                        "student": "Read access to student resources",
                        "teacher": "Read and write access to teacher resources",
                        "admin": "Admin access"
                    }
                }
            }
        }
    }
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

# Socket.IO server
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins=["*", "http://localhost:5500", "http://127.0.0.1:5500"],
    logger=True,
    engineio_logger=True,
    ping_timeout=60,
    ping_interval=25,
)

# Register Socket.IO event handlers
register_face_recognition_handlers(sio)
register_attendance_handlers(sio)

# Basic Socket.IO event handlers
@sio.event
async def connect(sid, environ):
    logger.info(f"Client connected: {sid}")

@sio.event
async def disconnect(sid):
    logger.info(f"Client disconnected: {sid}")

@sio.event
async def message(sid, data):
    logger.info(f"Message from {sid}: {data}")
    await sio.emit('message', {'data': f'Received: {data}'}, room=sid)

# Create ASGI app
socket_app = socketio.ASGIApp(
    socketio_server=sio,
    socketio_path='/socket.io',
    other_asgi_app=app
)

# Serve Frontend
@app.get("/")
async def read_index():
    frontend_path = Path(__file__).parent.parent.parent / "frontend" / "index.html"
    return FileResponse(str(frontend_path))

# Mount frontend directory to serve other static assets (JS, CSS, etc.)
app.mount("/", StaticFiles(directory=str(Path(__file__).parent.parent.parent / "frontend"), html=True), name="frontend")

