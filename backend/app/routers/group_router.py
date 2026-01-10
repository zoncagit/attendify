from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.database import get_db
from app.models.group import Group
from app.models.group_user import GroupUser
from app.models.class_user import ClassUser
from app.models.user import User
from app.auth.oauth2 import get_current_user
from pydantic import BaseModel, Field

router = APIRouter(prefix="/groups", tags=["Groups"])

class GroupResponse(BaseModel):
    group_id: int
    group_name: str
    group_code: str
    class_id: int

    class Config:
        from_attributes = True

@router.delete("/{group_code}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_user_from_group(
    group_code: str,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Remove a user from a group (group creator only)
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
    
    # Check if current user is the group creator
    if group.created_by != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the group creator can remove users"
        )
    
    # Check if trying to remove the creator
    if user_id == group.created_by:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Group creator cannot be removed from the group"
        )
    
    # Find the group membership
    group_user = (db.query(GroupUser)
        .filter(
            GroupUser.group_id == group.group_id,
            GroupUser.user_id == user_id
        )
        .first())
    
    if not group_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not a member of this group"
        )
    
    # Remove user from the group
    db.delete(group_user)
    
    # Check if this was the only group the user was in for this class
    other_groups = (db.query(GroupUser)
        .join(Group, GroupUser.group_id == Group.group_id)
        .filter(
            GroupUser.user_id == user_id,
            Group.class_id == group.class_id,
            Group.group_id != group.group_id
        )
        .count())
    
    # If no other groups in this class, remove from class
    if other_groups == 0:
        class_user = (db.query(ClassUser)
            .filter(
                ClassUser.class_id == group.class_id,
                ClassUser.user_id == user_id
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

@router.get("/class/{class_id}/count")
async def get_group_count_in_class(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, int]:
    """
    Get the number of groups in a class
    """
    # Check if user is a member of the class
    class_member = (db.query(ClassUser)
        .filter(
            ClassUser.class_id == class_id,
            ClassUser.user_id == current_user.user_id
        )
        .first())
    
    if not class_member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this class"
        )
    
    # Count groups in the class
    group_count = db.query(func.count(Group.group_id)).filter(Group.class_id == class_id).scalar()
    
    return {"group_count": group_count}

@router.get("/class/{class_id}/users/count")
async def get_user_count_in_class(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, int]:
    """
    Get the number of users in a class
    """
    # Check if user is a member of the class
    class_member = (db.query(ClassUser)
        .filter(
            ClassUser.class_id == class_id,
            ClassUser.user_id == current_user.user_id
        )
        .first())
    
    if not class_member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this class"
        )
    
    # Count unique users in the class through class_user table
    user_count = db.query(func.count(ClassUser.user_id.distinct()))\
        .filter(ClassUser.class_id == class_id)\
        .scalar()
    
    return {"user_count": user_count}
