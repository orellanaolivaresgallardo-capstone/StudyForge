from datetime import datetime
from pydantic import BaseModel, EmailStr, Field
from pydantic import ConfigDict

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)  # Pydantic v2: ORM mode
    id: int
    email: EmailStr
    created_at: datetime | None = None
