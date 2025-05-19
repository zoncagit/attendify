from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class ClassBase(BaseModel):
    class_name: str
    class_code: str

class ClassCreate(ClassBase):
    pass

class ClassOut(ClassBase):
    class_id: int
    created_by: Optional[int]
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True