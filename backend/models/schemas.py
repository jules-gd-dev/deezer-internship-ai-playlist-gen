from typing import List, Optional
from pydantic import BaseModel


class Message(BaseModel):
    role: str
    content: str


class TrackInput(BaseModel):
    title: str
    artist: str


class GenerateRequest(BaseModel):
    prompt: str
    count: int = 20
    genre: Optional[str] = "any"
    history: Optional[List[Message]] = None
    selected_tracks: Optional[List[TrackInput]] = None


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
    rejected: Optional[bool] = False
    error: Optional[str] = None
