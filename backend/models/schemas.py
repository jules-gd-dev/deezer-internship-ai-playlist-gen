from typing import List, Optional
from pydantic import BaseModel


class GenerateRequest(BaseModel):
    prompt: str
    count: int = 20
    genre: Optional[str] = "any"


class EnrichedTrack(BaseModel):
    id: int
    title: str
    artist: str
    albumCover: str
    albumName: str
    previewUrl: str
    deezerUrl: str
    duration: int


class GenerateResponse(BaseModel):
    name: str
    tracks: List[EnrichedTrack]
    total: int
    matched: int
