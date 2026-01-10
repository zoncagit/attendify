import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add the project root to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import after setting up the path
from app.database import Base, get_db
from app.models.user import User

def verify_user_email(email: str):
    # Create database session
    db = next(get_db())
    
    try:
        print(f"🔍 Searching for user with email: {email}")
        # Find user by email
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            print(f"❌ User with email {email} not found")
            return False
        
        print(f"✅ Found user: {user.name} {user.prenom} (ID: {user.user_id})")
        print(f"   Current status - Verified: {user.is_verified}, Active: {user.is_active}")
        
        # Update user verification status
        user.is_verified = True
        user.is_active = True
        db.commit()
        
        print("\n✅ Successfully updated user:")
        print(f"   Email verified: {user.is_verified}")
        print(f"   Account active: {user.is_active}")
        print("\nYou can now log in with this account.")
        return True
        
    except Exception as e:
        print(f"\n❌ Error verifying user: {str(e)}")
        db.rollback()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("\nUsage: python verify_user_direct.py <email>")
        print("Example: python verify_user_direct.py test@example.com\n")
        sys.exit(1)
    
    email = sys.argv[1]
    print("\n" + "="*50)
    print(f"  Verifying user: {email}")
    print("="*50)
    
    verify_user_email(email)
