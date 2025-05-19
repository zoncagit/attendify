from app.models import Session, User

def test_imports():
    assert hasattr(Session, 'classroom'), "Session missing classroom relationship"
    assert hasattr(User, 'created_sessions'), "User missing created_sessions"
    print("✅ All models import correctly!")

if __name__ == "__main__":
    test_imports()