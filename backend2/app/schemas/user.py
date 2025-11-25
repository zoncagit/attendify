from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    name: str
    prenom: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

    class Config:
        from_attributes = True

class UserOut(UserBase):
    user_id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

    class Config:
        orm_mode = True

class PasswordResetRequest(BaseModel):
    email: EmailStr

    class Config:
        from_attributes = True

class PasswordReset(BaseModel):
    token: str
    new_password: str
    confirm_password: str

    @property
    def passwords_match(self) -> bool:
        return self.new_password == self.confirm_password

class UserProfile(UserBase):
    user_id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    role: Optional[str] = None
    profile_picture: Optional[str] = None

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    name: Optional[str] = None
    prenom: Optional[str] = None
    profile_picture: Optional[str] = None
    bio: Optional[str] = None
    phone_number: Optional[str] = None

    class Config:
        from_attributes = True
