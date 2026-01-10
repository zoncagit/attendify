from app.database import SessionLocal
from app.models.user import User

def check_user(email: str):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if user:
            print(f"User found: {user.email}")
            print(f"Name: {user.name} {user.prenom}")
            print(f"Is verified: {user.is_verified}")
            print(f"Is active: {user.is_active}")
            print(f"Password hash: {user.password_hash[:20]}...")
        else:
            print(f"No user found with email: {email}")
    except Exception as e:
        print(f"Error: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    check_user("mimo90977@gmail.com")
