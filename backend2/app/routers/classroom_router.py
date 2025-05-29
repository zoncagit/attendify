from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from sqlalchemy import delete
from typing import List, Optional, Dict, Any
import random
import string
import logging

from app.database import get_db
from app.models import Class, Group, ClassUser, GroupUser, User, Attendance, Session
from app.auth import get_current_user
from pydantic import BaseModel, Field

class ClassCreate(BaseModel):
    class_name: str = Field(..., min_length=1, max_length=100)

class GroupCreate(BaseModel):
    group_name: str = Field(..., min_length=1, max_length=100)
    class_id: int

class ClassResponse(BaseModel):
    class_id: int
    class_name: str
    class_code: str
    created_by: int

    class Config:
        from_attributes = True

class GroupResponse(BaseModel):
    group_id: int
    group_name: str
    group_code: str
    class_id: int

    class Config:
        from_attributes = True

router = APIRouter(prefix="/api/v1/classes", tags=["Classrooms"])

def generate_class_code(length: int = 6) -> str:
    """Generate a random class code"""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))

def generate_group_code(length: int = 6) -> str:
    """Generate a random group code"""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))

@router.post("/", response_model=ClassResponse, status_code=status.HTTP_201_CREATED)
def create_class(
    class_data: ClassCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new class
    
    - **class_name**: Name for the new class
    - Returns: Created class with unique class_code
    
    The authenticated user will be set as the admin of the class.
    """
    # Generate unique class code
    while True:
        class_code = generate_class_code()
        if not db.query(Class).filter(Class.class_code == class_code).first():
            break
    
    # Create the class
    new_class = Class(
        class_name=class_data.class_name,
        class_code=class_code,
        created_by=current_user.user_id
    )
    
    try:
        db.add(new_class)
        db.flush()  # Get the new class ID
        
        # Add creator as admin of the class
        class_user = ClassUser(
            class_id=new_class.class_id,
            user_id=current_user.user_id,
            role="admin"
        )
        db.add(class_user)
        db.commit()
        db.refresh(new_class)
        return new_class
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create class: {str(e)}"
        )

@router.get("/", response_model=List[ClassResponse])
def get_user_classes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all classes for the current user"""
    classes = (db.query(Class)
        .join(ClassUser, Class.class_id == ClassUser.class_id)
        .filter(ClassUser.user_id == current_user.user_id)
        .all())
    return classes

@router.get("/{class_id}", response_model=ClassResponse)
def get_class(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific class that the current user is a member of
    """
    # First check if the class exists
    class_data = db.query(Class).filter(Class.class_id == class_id).first()
    if not class_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class not found"
        )
    
    # Check if user is a member of the class
    class_member = db.query(ClassUser).filter(
        ClassUser.class_id == class_id,
        ClassUser.user_id == current_user.user_id
    ).first()
    
    if not class_member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this class"
        )
    
    return class_data

@router.post("/{class_id}/groups", response_model=GroupResponse, status_code=status.HTTP_201_CREATED)
def create_group(
    class_id: int,
    group_data: GroupCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new group in a class
    
    - **class_id**: ID of the class to create group in
    - **group_name**: Name of the new group
    - Returns: Created group with unique group_code
    
    Only class admins can create groups. The creator is automatically added to the group.
    """
    # Check if class exists
    class_info = db.query(Class).filter(Class.class_id == class_id).first()
    if not class_info:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class not found"
        )
    
    # Check if user is admin of the class
    class_user = (db.query(ClassUser)
        .filter(
            ClassUser.class_id == class_id,
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
        exists = db.query(Group).filter(Group.group_code == group_code).first()
        if not exists:
            break
    
    # Create the group
    new_group = Group(
        group_name=group_data.group_name,
        group_code=group_code,
        class_id=class_id,
        created_by=current_user.user_id
    )
    
    try:
        db.add(new_group)
        db.flush()  # Get the new group ID
        
        # Add creator to the group as admin
        group_user = GroupUser(
            group_id=new_group.group_id,
            user_id=current_user.user_id,
            role='admin'  # Set creator as admin of the group
        )
        db.add(group_user)
        
        db.commit()
        db.refresh(new_group)
        return new_group
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create group: {str(e)}"
        )

@router.get("/{class_id}/groups", response_model=List[GroupResponse])
def list_class_groups(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all groups in a class that the current user is a member of
    """
    # First check if the class exists
    class_data = db.query(Class).filter(Class.class_id == class_id).first()
    if not class_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class not found"
        )
    
    # Check if user is a member of the class
    class_member = db.query(ClassUser).filter(
        ClassUser.class_id == class_id,
        ClassUser.user_id == current_user.user_id
    ).first()
    
    if not class_member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this class"
        )
    
    # Get all groups in the class
    groups = db.query(Group).filter(Group.class_id == class_id).all()
    return groups

@router.post("/groups/join/{group_code}", status_code=status.HTTP_200_OK)
def join_group(
    group_code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Join a group using a group code
    
    - **group_code**: The unique code of the group to join
    - Returns: Success message
    
    If the user is not already a member of the class, they will be automatically added
    with the 'member' role before being added to the group.
    """
    # Find the group by code
    group = db.query(Group).filter(Group.group_code == group_code).first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )
    
    # Check if already in any group in this class
    existing_group = (db.query(GroupUser)
        .join(Group, GroupUser.group_id == Group.group_id)
        .filter(
            Group.class_id == group.class_id,
            GroupUser.user_id == current_user.user_id
        )
        .first())
    
    if existing_group:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"You are already a member of another group in this class. Please leave that group before joining a new one."
        )
        
    # Check if already in this specific group (redundant but safe)
    group_member = (db.query(GroupUser)
        .filter(
            GroupUser.group_id == group.group_id,
            GroupUser.user_id == current_user.user_id
        )
        .first())
    
    if group_member:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are already a member of this group"
        )
    
    try:
        # Check if user is already in the class
        class_user = (db.query(ClassUser)
            .filter(
                ClassUser.class_id == group.class_id,
                ClassUser.user_id == current_user.user_id
            )
            .first())
        
        was_added_to_class = False
        # If not in class, add to class first
        if not class_user:
            class_user = ClassUser(
                class_id=group.class_id,
                user_id=current_user.user_id,
                role="member"
            )
            db.add(class_user)
            was_added_to_class = True
        
        # Add to group
        group_user = GroupUser(
            user_id=current_user.user_id,
            group_id=group.group_id
        )
        db.add(group_user)
        
        db.commit()
        
        if was_added_to_class:
            return {"message": "Successfully joined the group and class"}
        return {"message": "Successfully joined the group"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to join group: {str(e)}"
        )

@router.delete("/groups/leave/{group_id}", status_code=status.HTTP_200_OK)
def leave_group(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Leave a group
    If this is the only group the user is in for this class,
    they will also be removed from the class
    """
    # Get the group with its class
    group = db.query(Group).filter(Group.group_id == group_id).first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )
    
    # Check if user is in the group
    group_membership = (
        db.query(GroupUser)
        .filter(
            GroupUser.group_id == group_id,
            GroupUser.user_id == current_user.user_id
        )
        .first()
    )
    
    if not group_membership:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are not a member of this group"
        )
    
    # Check if user is trying to leave their only admin group
    if group_membership.role == "admin":
        # Count other admins in the group
        other_admins = (
            db.query(GroupUser)
            .filter(
                GroupUser.group_id == group_id,
                GroupUser.user_id != current_user.user_id,
                GroupUser.role == "admin"
            )
            .count()
        )
        if other_admins == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot leave group as the only admin. Assign another admin first."
            )
    
    try:
        # Remove from group
        db.delete(group_membership)
        
        # Check if this is the only group the user is in for this class
        other_groups_in_class = (
            db.query(GroupUser)
            .join(Group, GroupUser.group_id == Group.group_id)
            .filter(
                Group.class_id == group.class_id,
                GroupUser.user_id == current_user.user_id,
                Group.group_id != group_id
            )
            .count()
        )
        
        # If no other groups in this class, remove from class (if not admin)
        if other_groups_in_class == 0:
            class_membership = (
                db.query(ClassUser)
                .filter(
                    ClassUser.class_id == group.class_id,
                    ClassUser.user_id == current_user.user_id,
                    ClassUser.role != "admin"  # Don't remove admins from class
                )
                .first()
            )
            if class_membership:
                db.delete(class_membership)
        
        db.commit()
        return {"message": "Successfully left the group"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to leave group: {str(e)}"
        )

@router.delete("/{class_id}/leave")
def leave_class(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Leave a class"""
    # Check if user is in the class
    membership = (
        db.query(ClassUser)
        .filter(
            ClassUser.class_id == class_id,
            ClassUser.user_id == current_user.user_id
        )
        .first()
    )
    
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are not a member of this class"
        )

    # Don't allow teachers to leave their own class
    if membership.role == "teacher":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Teachers cannot leave their own class"
        )

    try:
        db.delete(membership)
        db.commit()
        return {"message": "Successfully left the class"}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to leave class: {str(e)}"
        )


@router.get("/{class_id}/users", response_model=List[Dict[str, Any]], status_code=status.HTTP_200_OK)
def get_class_users(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all users in a specific class
    
    - **class_id**: ID of the class
    - Returns: List of users with their roles and group information
    
    Only members of the class can view this information.
    """
    # Check if user is a member of the class
    class_member = db.query(ClassUser).filter(
        ClassUser.class_id == class_id,
        ClassUser.user_id == current_user.user_id
    ).first()
    
    if not class_member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this class"
        )
    
    # Get all users in the class with their roles
    class_users = db.query(
        User.user_id,
        User.name,
        User.prenom,
        User.email,
        ClassUser.role.label('class_role'),
        Group.group_name,
        GroupUser.role.label('group_role')
    ).join(
        ClassUser, User.user_id == ClassUser.user_id
    ).outerjoin(
        GroupUser, User.user_id == GroupUser.user_id
    ).outerjoin(
        Group, GroupUser.group_id == Group.group_id
    ).filter(
        ClassUser.class_id == class_id
    ).all()
    
    # Format the response
    result = []
    for user in class_users:
        user_dict = {
            'user_id': user.user_id,
            'name': user.name,
            'prenom': user.prenom,
            'email': user.email,
            'class_role': user.class_role,
            'group': user.group_name,
            'group_role': user.group_role
        }
        result.append(user_dict)
    
    return result


@router.get("/groups/{group_id}/users", response_model=List[Dict[str, Any]], status_code=status.HTTP_200_OK)
def get_group_users(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all users in a specific group
    
    - **group_id**: ID of the group
    - Returns: List of users in the group with their roles
    
    Only members of the group's class can view this information.
    """
    # Get the group with its class information
    group = db.query(Group).filter(Group.group_id == group_id).first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )
    
    # Check if current user is a member of the group's class
    class_member = db.query(ClassUser).filter(
        ClassUser.class_id == group.class_id,
        ClassUser.user_id == current_user.user_id
    ).first()
    
    if not class_member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this group's information"
        )
    
    # Get all users in the group with their roles
    group_users = (db.query(User, GroupUser.role)
        .join(GroupUser, User.user_id == GroupUser.user_id)
        .filter(GroupUser.group_id == group_id)
        .all())
    
    # Format the response
    return [
        {
            "user_id": user.user_id,
            "email": user.email,
            "first_name": user.name,
            "last_name": user.prenom,
            "role": role
        }
        for user, role in group_users
    ]

@router.delete("/{class_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_class(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check if class exists
    db_class = db.query(Class).filter(Class.class_id == class_id).first()
    if not db_class:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class not found"
        )

    # Check if user is admin of the class
    class_user = db.query(ClassUser).filter(
        (ClassUser.class_id == class_id) &
        (ClassUser.user_id == current_user.user_id) &
        (ClassUser.role == "admin")
    ).first()

    if not class_user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete this class"
        )

    # Delete all related data
    try:
        if logging.getLogger().isEnabledFor(logging.INFO):
            logging.info(f"Deleting class with ID: {class_id}")
        # First delete attendance records for sessions in this class
        db.execute(
            delete(Attendance).where(
                Attendance.session_id.in_(
                    db.query(Session.session_id)
                    .filter(Session.class_id == class_id)
                )
            )
        )
        
        # Then delete the sessions
        db.execute(
            delete(Session)
            .where(Session.class_id == class_id)
        )

        # Delete group memberships
        db.execute(
            delete(GroupUser)
            .where(GroupUser.group_id.in_(
                db.query(Group.group_id)
                .filter(Group.class_id == class_id)
                .subquery()
            ))
        )

        # Delete groups
        db.execute(
            delete(Group)
            .where(Group.class_id == class_id)
        )

        # Delete class users
        db.execute(
            delete(ClassUser)
            .where(ClassUser.class_id == class_id)
        )

        # Finally, delete the class
        db.execute(
            delete(Class)
            .where(Class.class_id == class_id)
        )
        
        db.commit()
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting class: {str(e)}"
        )

@router.delete("/groups/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_group(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a group
    
    - **group_id**: ID of the group to delete
    
    Only the admin of the class can delete a group.
    This will also delete all group memberships for this group.
    """
    # Get the group with its class
    group = db.query(Group).filter(Group.group_id == group_id).first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )
    
    # Check if current user is the admin of the class
    class_ = db.query(Class).filter(Class.class_id == group.class_id).first()
    if not class_ or class_.created_by != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the class admin can delete groups"
        )
    
    try:
        # First, delete all group memberships
        db.execute(delete(GroupUser).where(GroupUser.group_id == group_id))
        
        # Delete the group
        db.delete(group)
        db.commit()
        
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete group: {str(e)}"
        )