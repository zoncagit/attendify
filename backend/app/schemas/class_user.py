from pydantic import BaseModel
from datetime import datetime

class ClassUserCreate(BaseModel):
    class_id: int
    user_id: int

class ClassUserOut(BaseModel):
    class_id: int
    user_id: int
    joined_at: datetime

    class Config:
        orm_mode = True