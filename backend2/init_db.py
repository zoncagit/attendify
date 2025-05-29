from app.database import Base, engine
from app.models import user, session, attendance, classroom, group, pre_verification
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def init_db():
    logger.info("Starting database initialization...")
    logger.info(f"Using database URL: {engine.url}")
    
    # Drop all tables first
    Base.metadata.drop_all(bind=engine)
    logger.info("Dropped all existing tables")
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    logger.info("Created all tables")
    
    logger.info("Database initialized successfully!")

if __name__ == "__main__":
    init_db()
