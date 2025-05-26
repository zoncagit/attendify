from app.database import SessionLocal
from app.auth.hashing import verify_password

def test_password():
    print("=== Testing Password Verification ===")
    
    # Connect to the database using the application's configuration
    db = SessionLocal()
    
    try:
        # Get the user
        user = db.execute(
            "SELECT email, password_hash FROM users WHERE email = :email",
            {"email": "fouad.www1@gmail.com"}
        ).first()
        
        if not user:
            print("❌ User not found")
            return
            
        print(f"User found: {user.email}")
        print(f"Stored hash: {user.password_hash}")
        
        # Test with correct password
        is_valid = verify_password("hind", user.password_hash)
        print(f"\nTesting with correct password (hind):")
        print(f"Result: {'✅ SUCCESS' if is_valid else '❌ FAILED'}")
        
        # Test with incorrect password
        is_invalid = verify_password("wrongpassword", user.password_hash)
        print(f"\nTesting with wrong password (wrongpassword):")
        print(f"Result: {'✅ FAILED (as expected)' if not is_invalid else '❌ SUCCEEDED (this is bad!)'}")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    test_password()
