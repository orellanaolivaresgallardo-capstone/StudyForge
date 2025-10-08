# app/schemas/document_schemas.py
from pydantic import BaseModel, Field
from pydantic import ConfigDict

class DocumentIn(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=300)
    content: str = Field(min_length=1)

class DocumentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    description: str | None = None
    # Nota: omitimos content en la vista de lista y creación para mantener respuestas livianas

class DocumentListOut(BaseModel):
    items: list[DocumentOut]
