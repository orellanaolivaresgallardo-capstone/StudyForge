from typing import Optional, List
from pydantic import BaseModel, Field, field_validator
from pydantic import ConfigDict

class DocumentIn(BaseModel):
    title: str = Field(min_length=1)
    content: str = Field(min_length=1)
    description: Optional[str] = None

    @field_validator("title", "content", mode="before")
    @classmethod
    def not_blank(cls, v: str):
        if v is None:
            raise ValueError("no puede estar vacío")
        v2 = v.strip()
        if not v2:
            raise ValueError("no puede estar vacío")
        return v2  # ya sale sin espacios de sobra

class DocumentOut(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    # Permite construir desde objetos ORM (SQLAlchemy)
    model_config = ConfigDict(from_attributes=True)

class DocumentListOut(BaseModel):
    items: List[DocumentOut]

