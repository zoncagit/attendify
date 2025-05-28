from app.database import SessionLocal
from app.models.user import User
from app.auth.hashing import verify_password

def test_login(email: str, password: str):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            print(f"❌ No user found with email: {email}")
            return
            
        print(f"User found: {user.email}")
        print(f"Stored hash: {user.password_hash}")
        
        # Verify the password
        is_valid = verify_password(password, user.password_hash)
        print(f"Password {'✅ is valid' if is_valid else '❌ is invalid'}")
        
        if not is_valid:
            print("\nPossible issues:")
            print("1. The password might be different from what you're trying")
            print("2. The password might have been hashed incorrectly during signup")
            print("3. The stored hash might be corrupted")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    test_login("mimo90977@gmail.com", "fouad1212")
