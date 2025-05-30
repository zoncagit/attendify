import sys
import os
import warnings
import requests
import json
import time
from datetime import datetime, timedelta

# Suppress bcrypt warning
warnings.filterwarnings("ignore", message="Error reading bcrypt version")

# Add the parent directory to the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app import models, crud, schemas
from app.auth.hashing import hash_password, verify_password
from app.models.user import UserRole

# Update these with your server details
BASE_URL = "http://localhost:8000"  # Update if your server is running on a different port

# Test user credentials
TEST_TEACHER_EMAIL = "test_teacher@example.com"
TEST_STUDENT_EMAIL = "test_student@example.com"
TEST_PASSWORD = "testpassword123"

TEACHER_CREDS = {
    "username": TEST_TEACHER_EMAIL,  # Changed from email to username
    "password": TEST_PASSWORD
}

STUDENT_CREDS = {
    "username": TEST_STUDENT_EMAIL,  # Changed from email to username
    "password": TEST_PASSWORD
}

def create_test_users():
    """Create test users if they don't exist"""
    db = SessionLocal()
    
    # Create test teacher
    teacher = db.query(models.User).filter(models.User.email == TEST_TEACHER_EMAIL).first()
    if not teacher:
        password_hash = hash_password(TEST_PASSWORD)
        teacher = models.User(
            email=TEST_TEACHER_EMAIL,
            password_hash=password_hash,
            name="Teacher",
            prenom="Test",
            role=UserRole.TEACHER,
            is_verified=True
        )
        db.add(teacher)
        db.commit()
        db.refresh(teacher)
        print(f"Created test teacher with ID: {teacher.user_id}")
    
    # Create test student
    student = db.query(models.User).filter(models.User.email == TEST_STUDENT_EMAIL).first()
    if not student:
        password_hash = hash_password(TEST_PASSWORD)
        student = models.User(
            email=TEST_STUDENT_EMAIL,
            password_hash=password_hash,
            name="Student",
            prenom="Test",
            role=UserRole.STUDENT,
            is_verified=True
        )
        db.add(student)
        db.commit()
        db.refresh(student)
        print(f"Created test student with ID: {student.user_id}")
    
    # Create a test class if it doesn't exist
    test_class = db.query(models.Class).filter(models.Class.class_name == "Test Class").first()
    if not test_class:
        test_class = models.Class(
            class_name="Test Class",
            class_code="TEST123",
            created_by=teacher.user_id
        )
        db.add(test_class)
        db.commit()
        db.refresh(test_class)
        print(f"Created test class with ID: {test_class.class_id}")
    
    # Create a test group if it doesn't exist
    test_group = db.query(models.Group).filter(
        models.Group.group_name == "Test Group",
        models.Group.class_id == test_class.class_id
    ).first()
    
    if not test_group:
        test_group = models.Group(
            group_name="Test Group",
            group_code="GRP123",
            class_id=test_class.class_id,
            created_by=teacher.user_id
        )
        db.add(test_group)
        db.commit()
        db.refresh(test_group)
        print(f"Created test group with ID: {test_group.group_id}")
    
    # Add student to the group if not already a member
    group_member = db.query(models.GroupUser).filter(
        models.GroupUser.group_id == test_group.group_id,
        models.GroupUser.user_id == student.user_id
    ).first()
    
    if not group_member:
        group_member = models.GroupUser(
            group_id=test_group.group_id,
            user_id=student.user_id,
            joined_at=datetime.utcnow()
        )
        db.add(group_member)
        db.commit()
        print(f"Added student {student.user_id} to group {test_group.group_id}")
    
    db.close()
    return test_group.group_id

def login(credentials):
    """Helper function to log in and get access token using OAuth2 form data"""
    # Convert credentials to form data format
    form_data = {
        "username": credentials["username"],
        "password": credentials["password"],
        "grant_type": "password",
        "scope": ""
    }
    headers = {
        "Content-Type": "application/x-www-form-urlencoded"
    }
    response = requests.post(
        f"{BASE_URL}/api/v1/auth/login",
        data=form_data,
        headers=headers
    )
    if response.status_code != 200:
        print(f"Login failed: {response.text}")
        return None
    return response.json()["access_token"]

def create_session(token, group_id):
    """Create a new session with QR code"""
    headers = {"Authorization": f"Bearer {token}"}
    session_data = {
        "group_id": group_id,
        "title": "Test Session",
        "description": "Testing QR code functionality"
    }
    response = requests.post(
        f"{BASE_URL}/api/v1/sessions/sessions/",
        json=session_data,
        headers=headers
    )
    if response.status_code != 201:
        print(f"Failed to create session: {response.text}")
        return None
    return response.json()

def mark_attendance(token, qr_code):
    """Mark attendance using QR code"""
    headers = {"Authorization": f"Bearer {token}"}
    attendance_data = {"qr_code": qr_code}
    response = requests.post(
        f"{BASE_URL}/api/v1/sessions/sessions/mark-attendance",
        json=attendance_data,
        headers=headers
    )
    return response

def get_active_session(token, group_id):
    """Get active session for a group"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(
        f"{BASE_URL}/api/v1/sessions/sessions/group/{group_id}/active",
        headers=headers
    )
    if response.status_code != 200:
        return None
    return response.json()

def cleanup_test_data():
    """Clean up test data after testing"""
    db = SessionLocal()
    try:
        # Delete test users
        for email in [TEST_TEACHER_EMAIL, TEST_STUDENT_EMAIL]:
            user = crud.get_user_by_email(db, email=email)
            if user:
                # Delete related records first
                db.query(models.ClassUser).filter(models.ClassUser.user_id == user.user_id).delete()
                db.query(models.GroupUser).filter(models.GroupUser.user_id == user.user_id).delete()
                db.query(models.Session).filter(models.Session.created_by == user.user_id).delete()
                db.query(models.User).filter(models.User.user_id == user.user_id).delete()
        
        # Delete test class and groups
        test_class = db.query(models.Class).filter(models.Class.name == "Test Class").first()
        if test_class:
            db.query(models.Group).filter(models.Group.class_id == test_class.class_id).delete()
            db.query(models.Class).filter(models.Class.class_id == test_class.class_id).delete()
        
        db.commit()
        print("\n✓ Cleaned up test data")
    except Exception as e:
        db.rollback()
        print(f"\n! Error during cleanup: {e}")
    finally:
        db.close()

def test_qr_attendance():
    print("=== Starting QR Code Attendance Test ===\n")
    
    try:
        # Create test users and get a group_id
        print("1. Setting up test environment...")
        group_id = create_test_users()
        print(f"   Using group ID: {group_id}")
        
        # Log in as teacher
        print("\n2. Logging in as teacher...")
        teacher_token = login(TEACHER_CREDS)
        if not teacher_token:
            print("✗ Failed to log in as teacher")
            return
        print("✓ Teacher logged in successfully")
        
        # Log in as student
        print("\n3. Logging in as student...")
        student_token = login(STUDENT_CREDS)
        if not student_token:
            print("✗ Failed to log in as student")
            return
        print("✓ Student logged in successfully")
        
        # Create a new session
        print("\n4. Creating a new session...")
        session = create_session(teacher_token, group_id)
        if not session:
            print("✗ Failed to create session")
            return
        print(f"✓ Session created with ID: {session['session_id']}")
        print(f"   QR Code: {session['qr_code']}")
        
        # Get the active session
        print("\n5. Getting active session...")
        active_session = get_active_session(teacher_token, group_id)
        if not active_session:
            print("✗ No active session found")
            return
        print(f"✓ Active session found: {active_session['title']}")
        
        # Mark attendance as student
        print("\n6. Marking attendance as student...")
        qr_code = active_session['qr_code']
        response = mark_attendance(student_token, qr_code)
        
        if response.status_code == 200:
            print("✓ Attendance marked successfully!")
            print(f"   Response: {response.json()}")
            
            # Verify attendance was recorded
            db = SessionLocal()
            attendance = db.query(models.Attendance).filter(
                models.Attendance.session_id == active_session['session_id']
            ).first()
            if attendance:
                print(f"✓ Attendance record verified in database (ID: {attendance.attendance_id})")
            else:
                print("! Attendance not found in database")
            db.close()
        else:
            print(f"✗ Failed to mark attendance: {response.text}")
        
        print("\n=== Test Completed Successfully ===")
        
    except Exception as e:
        print(f"\n!!! Test Failed: {str(e)}")
        raise
    finally:
        # Clean up test data
        cleanup_test_data()

if __name__ == "__main__":
    test_qr_attendance()
