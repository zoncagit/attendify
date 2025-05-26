from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import random
import string

from app.database import get_db
from app.models.group import Group
from app.models.group_user import GroupUser
from app.models.class_user import ClassUser
from app.models.user import User
from app.auth.oauth2 import get_current_user
from pydantic import BaseModel, Field

router = APIRouter(prefix="/groups", tags=["Groups"])

class GroupCreate(BaseModel):
    group_name: str = Field(..., min_length=1, max_length=100)
    class_id: int

class GroupResponse(BaseModel):
    group_id: int
    group_name: str
    group_code: str
    class_id: int

    class Config:
        from_attributes = True

def generate_group_code(length: int = 6) -> str:
    """Generate a random group code"""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))

@router.post("/", response_model=GroupResponse, status_code=status.HTTP_201_CREATED)
def create_group(
    group_data: GroupCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new group in a class
    Only class admins can create groups
    """
    # Check if user is admin of the class
    class_user = (db.query(ClassUser)
        .filter(
            ClassUser.class_id == group_data.class_id,
            ClassUser.user_id == current_user.user_id,
            ClassUser.role == "admin"
        )
        .first())
    
    if not class_user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only class admins can create groups"
        )
    
    # Generate unique group code
    while True:
        group_code = generate_group_code()
        if not db.query(Group).filter(Group.group_code == group_code).first():
            break
    
    # Create the group
    group = Group(
        group_name=group_data.group_name,
        group_code=group_code,
        class_id=group_data.class_id
    )
    
    db.add(group)
    db.commit()
    db.refresh(group)
    
    # Add creator to the group
    group_user = GroupUser(
        group_id=group.group_id,
        user_id=current_user.user_id
    )
    db.add(group_user)
    db.commit()
    
    return group

@router.post("/{group_code}/join", response_model=dict)
def join_group(
    group_code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Join a group using group code
    Automatically adds user to the class if not already a member
    """
    # Find the group by code
    group = db.query(Group).filter(Group.group_code == group_code).first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )
    
    # Check if user is already in the group
    existing_member = (db.query(GroupUser)
        .filter(
            GroupUser.group_id == group.group_id,
            GroupUser.user_id == current_user.user_id
        )
        .first())
    
    if existing_member:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are already a member of this group"
        )
    
    # Check if user is in the class, if not add them
    class_user = (db.query(ClassUser)
        .filter(
            ClassUser.class_id == group.class_id,
            ClassUser.user_id == current_user.user_id
        )
        .first())
    
    if not class_user:
        class_user = ClassUser(
            class_id=group.class_id,
            user_id=current_user.user_id,
            role="member"
        )
        db.add(class_user)
    
    # Add user to the group
    group_user = GroupUser(
        group_id=group.group_id,
        user_id=current_user.user_id
    )
    db.add(group_user)
    db.commit()
    
    return {"message": "Successfully joined the group"}

@router.delete("/{group_code}/leave", status_code=status.HTTP_204_NO_CONTENT)
def leave_group(
    group_code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Leave a group
    If this is the only group the user is in for this class,
    they will also be removed from the class
    """
    # Find the group by code
    group = db.query(Group).filter(Group.group_code == group_code).first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )
    
    # Find the group membership
    group_user = (db.query(GroupUser)
        .filter(
            GroupUser.group_id == group.group_id,
            GroupUser.user_id == current_user.user_id
        )
        .first())
    
    if not group_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are not a member of this group"
        )
    
    # Remove user from the group
    db.delete(group_user)
    
    # Check if this was the only group the user was in for this class
    other_groups = (db.query(GroupUser)
        .join(Group, GroupUser.group_id == Group.group_id)
        .filter(
            GroupUser.user_id == current_user.user_id,
            Group.class_id == group.class_id,
            Group.group_id != group.group_id
        )
        .count())
    
    # If no other groups in this class, remove from class
    if other_groups == 0:
        class_user = (db.query(ClassUser)
            .filter(
                ClassUser.class_id == group.class_id,
                ClassUser.user_id == current_user.user_id
            )
            .first())
        
        if class_user and class_user.role != "admin":  # Don't remove admins
            db.delete(class_user)
    
    db.commit()
    return None

@router.get("/class/{class_id}", response_model=List[GroupResponse])
def get_class_groups(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all groups in a class"""
    # Check if user has access to the class
    class_access = (db.query(ClassUser)
        .filter(
            ClassUser.class_id == class_id,
            ClassUser.user_id == current_user.user_id
        )
        .first())
    
    if not class_access:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this class"
        )
    
    # Get all groups in the class
    groups = db.query(Group).filter(Group.class_id == class_id).all()
    return groups
