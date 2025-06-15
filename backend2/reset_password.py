from app.database import SessionLocal
from app.models.user import User
from app.auth.hashing import hash_password

def reset_user_password(email: str, new_password: str):
    db = SessionLocal()
    try:
        # Find the user
        user = db.query(User).filter(User.email == email).first()
        if not user:
            print(f"❌ No user found with email: {email}")
            return False
            
        print(f"Found user: {user.email}")
        print("Resetting password...")
        
        # Hash and update the new password
        hashed_password = hash_password(new_password)
        user.password_hash = hashed_password
        
        # Ensure the user is verified and active
        user.is_verified = True
        user.is_active = True
        
        db.commit()
        print("✅ Password updated successfully")
        print(f"New hash: {hashed_password}")
        return True
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        db.rollback()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    email = "mimo90977@gmail.com"
    new_password = "fouad1212"  # Change this to your desired password
    
    print(f"Resetting password for {email}...")
    if reset_user_password(email, new_password):
        print("\nYou can now log in with your new password.")
    else:
        print("\nFailed to reset password. Please check the error message above.")
