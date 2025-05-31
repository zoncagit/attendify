from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.openapi.utils import get_openapi
from app.database import engine, Base, init_db
from app.auth.auth import router as auth_router
from app.routers.classroom_router import router as classroom_router
from app.routers.group_router import router as group_router
from app.routers.user_router import router as user_router
from app.routers.session_router import router as session_router
import socketio
from app.socketio.face_recognition import register_face_recognition_handlers
import logging
import uvicorn

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create all tables on startup
def create_tables():
    """Initialize database tables"""
    logger.info("Creating database tables...")
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Error creating database tables: {str(e)}")
        raise

# Create tables when the app starts
create_tables()

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

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

# Define allowed origins
origins = [
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://localhost:5000",
    "http://127.0.0.1:5000",
    "*"  # Allow all origins in development
]

# Add CORS middleware with specific origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins in development
    allow_credentials=False,  # Set to False when using "*"
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Create Socket.IO server with proper CORS settings
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins=["*"],  # Allow all origins in development
    logger=True,
    engineio_logger=True,
    ping_timeout=60,
    ping_interval=25,
    allow_upgrades=True,
    max_http_buffer_size=1e8,
    always_connect=True,
    handle_sigint=True,
    async_handlers=True,
    namespaces=['/']
)

# Create Socket.IO ASGI app with proper configuration
socket_app = socketio.ASGIApp(
    socketio_server=sio,
    socketio_path='socket.io',
    on_startup=[lambda: print("Socket.IO server started")],
    on_shutdown=[lambda: print("Socket.IO server stopped")]
)

# Register Socket.IO handlers
register_face_recognition_handlers(sio)

# Mount Socket.IO app with proper path
app.mount("/socket.io", socket_app)

# Include routers with proper prefixes
app.include_router(auth_router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(classroom_router, prefix="/api/v1/classes", tags=["Classrooms"])
app.include_router(group_router, prefix="/api/v1/groups", tags=["Groups"])
app.include_router(user_router, prefix="/api/v1/users", tags=["Users"])
app.include_router(session_router, tags=["Sessions"])

# Configure OAuth2
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

# Update OpenAPI schema for Swagger UI
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

@app.get("/")
def root():
    return {"message": "Welcome to Attendify API"}

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=5000, reload=True)