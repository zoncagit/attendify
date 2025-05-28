from pydantic import BaseModel, Field
from typing import Optional

class VerificationRequest(BaseModel):
    """
    Request model for email verification.
    
    Attributes:
        verification_code: A 6-digit verification code sent to the user's email
    """
    verification_code: str = Field(
        ...,
        min_length=6,
        max_length=6,
        pattern='^\d{6}$',
        example="123456",
        description="6-digit verification code sent to the user's email"
    )

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "verification_code": "123456"
            }
        }
