from pydantic import BaseModel, EmailStr

class VerificationCode(BaseModel):
    email: EmailStr
    verification_code: str
