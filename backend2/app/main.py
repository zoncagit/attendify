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
from app.routers.session import router as session_router
from app.routers.face_recognition import router as face_recognition_router
import logging

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

app = FastAPI(
    title="Attendify API",
    description="API for Attendify application",
    version="1.0.0",
    debug=True,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or specify your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers with proper prefixes
app.include_router(auth_router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(classroom_router, prefix="/api/v1/classes", tags=["Classrooms"])
app.include_router(group_router, prefix="/api/v1/groups", tags=["Groups"])
app.include_router(user_router, prefix="/api/v1/users", tags=["Users"])
app.include_router(session_router, prefix="/api/v1/sessions", tags=["Sessions"])
app.include_router(face_recognition_router, prefix="/api/v1/face-recognition", tags=["Face Recognition"])

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

@app.on_event("startup")
async def startup_event():
    """Initialize database on startup."""
    init_db()

@app.get("/")
def root():
    return {"message": "Welcome to Attendify API"}