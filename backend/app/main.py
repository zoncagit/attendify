from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from fastapi.openapi.utils import get_openapi
from app.database import engine, Base
from app.auth.auth import router as auth_router
from app.routers.classroom_router import router as classroom_router
from app.routers.group_router import router as group_router
from app.routers.user_router import router as user_router
from app.routers.session_router import router as session_router
from app.socketio.face_recognition import register_face_recognition_handlers
from app.socketio.attendance import register_attendance_handlers
import socketio
import logging

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
    debug=True,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*", "http://localhost:5500", "http://127.0.0.1:5500"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Include API routers
app.include_router(auth_router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(classroom_router, prefix="/api/v1/classes", tags=["Classrooms"])
app.include_router(group_router, prefix="/api/v1/groups", tags=["Groups"])
app.include_router(user_router, tags=["Users"])
app.include_router(session_router, tags=["Sessions"])

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

@app.get("/")
def root():
    return {"message": "Welcome to Attendify API"}

