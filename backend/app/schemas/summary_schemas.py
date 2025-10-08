"""Schemas for summary resources."""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field
from pydantic import ConfigDict


class SummaryIn(BaseModel):
    title: str = Field(min_length=1)
    content: str = Field(min_length=1)
    document_id: int


class SummaryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    content: str
    document_id: int
    created_at: Optional[datetime] = None


class SummaryListOut(BaseModel):
    items: List[SummaryOut]
