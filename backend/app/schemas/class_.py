from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ClassBase(BaseModel):
    name: str
    subject: Optional[str] = None
    class_code: str

class ClassCreate(ClassBase):
    pass

class ClassUpdate(BaseModel):
    name: Optional[str] = None
    subject: Optional[str] = None
    class_code: Optional[str] = None

class ClassResponse(ClassBase):
    id: int
    creator_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True 