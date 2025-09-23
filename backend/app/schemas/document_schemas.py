from pydantic import BaseModel
from typing import Optional, List

class DocumentIn(BaseModel):
    title: str
    description: Optional[str] = None
    content: str

class DocumentOut(BaseModel):
    id: int
    title: str
    description: Optional[str] = None

class DocumentListOut(BaseModel):
    items: List[DocumentOut]
