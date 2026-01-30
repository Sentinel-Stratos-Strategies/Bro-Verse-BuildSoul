from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from datetime import datetime
from enum import Enum


class MemoryLayer(str, Enum):
    CANON = "CANON"
    PROFILE = "PROFILE"
    EPISODIC = "EPISODIC"
    AFFECTIVE = "AFFECTIVE"


class MemoryStatus(str, Enum):
    ACTIVE = "active"
    DEPRECATED = "deprecated"
    REVOKED = "revoked"


class MemoryItem(BaseModel):
    id: str
    layer: MemoryLayer
    type: str
    title: str
    content: str
    summary: Optional[str] = None

    user_id: str
    avatar_ids: List[str] = Field(default_factory=list)
    topic_tags: List[str] = Field(default_factory=list)

    source_type: str
    source_id: Optional[str] = None
    created_by: str

    created_at: datetime
    effective_at: datetime
    expires_at: Optional[datetime] = None

    salience: float = Field(default=0.5, ge=0.0, le=1.0)
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    valence: Optional[float] = Field(default=None, ge=-1.0, le=1.0)
    intensity: Optional[float] = Field(default=None, ge=0.0, le=1.0)

    visibility: str = "private"
    status: MemoryStatus = MemoryStatus.ACTIVE

    embedding_id: Optional[str] = None
    embedding_model: Optional[str] = None


class CreateMemoryRequest(BaseModel):
    layer: MemoryLayer
    type: str
    title: str
    content: str
    user_id: str
    avatar_ids: Optional[List[str]] = None
    topic_tags: Optional[List[str]] = None
    salience: float = 0.5
    confidence: float = 1.0
    valence: Optional[float] = None
    intensity: Optional[float] = None


class AvatarConfig(BaseModel):
    id: str
    name: str
    archetype: str
    version: str
    core_covenant: dict
    voice: dict
    behavioral_modes: dict
    boundaries: dict
    memory_permissions: dict
