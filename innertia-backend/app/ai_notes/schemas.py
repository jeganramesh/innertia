"""
Pydantic schemas for the AI Notes module.
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict


# ============ Request Schemas ============

class GenerateRequest(BaseModel):
    """Request schema for generating immersive notes."""
    class_id: str
    lesson_title: str
    raw_text: str
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "class_id": "uuid-of-class",
            "lesson_title": "Introduction to Photosynthesis",
            "raw_text": "Photosynthesis is the process by which plants convert light energy into chemical energy..."
        }
    })


class SaveNotesRequest(BaseModel):
    """Request schema for saving generated notes."""
    class_id: str
    lesson_title: str
    raw_text: str
    structured_content: dict


# ============ Response Schemas ============

class Section(BaseModel):
    """Schema for a structured section."""
    heading: str
    content: str
    key_points: List[str] = []


class MermaidDiagram(BaseModel):
    """Schema for a Mermaid diagram."""
    title: str
    code: str


class ThreeDSuggestion(BaseModel):
    """Schema for 3D visualization suggestion."""
    type: str
    description: str


class ImageResult(BaseModel):
    """Schema for an Unsplash image result."""
    url: str
    alt: str
    photographer: str
    photographer_url: str


class GenerateResponse(BaseModel):
    """Response schema for generated notes."""
    title: str
    overview: str
    sections: List[Section]
    mermaid_diagrams: List[MermaidDiagram]
    image_queries: List[str]
    three_d_suggestions: List[ThreeDSuggestion]
    images: List[ImageResult] = []


# ============ Output Schemas ============

class AINoteOut(BaseModel):
    """Schema for AI note response."""
    id: str
    class_id: str
    lesson_title: str
    raw_text: str
    structured_content: dict
    created_by: str
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class AINoteList(BaseModel):
    """Schema for list of AI notes."""
    notes: List[AINoteOut]
    total: int
