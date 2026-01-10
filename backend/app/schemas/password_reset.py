from pydantic import BaseModel, EmailStr, Field

class ResetPasswordRequest(BaseModel):
    """Schema for password reset request.
    
    Attributes:
        email: The user's email address
        token: The reset token received via email
        password: New password (must be at least 8 characters long)
    """
    email: EmailStr = Field(..., description="The user's email address")
    token: str = Field(..., description="The reset token received via email")
    password: str = Field(..., min_length=8, description="New password (min 8 characters)")

# Make the class available when importing from this module
__all__ = ["ResetPasswordRequest"]
