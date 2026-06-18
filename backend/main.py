import os
import re
import json
import asyncio
import logging
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("backend")

app = FastAPI(title="Deezer Playlist Generator Backend")

# Add CORS Middleware to allow requests from the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the exact domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Message(BaseModel):
    role: str
    content: str

class TrackInput(BaseModel):
    title: str
    artist: str

class GenerateRequest(BaseModel):
    prompt: str
    count: int = 15
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
    tracks: List[EnrichedTrack]
    prompt: str
    total: int
    matched: int

def get_git_commit() -> str:
    """Reads the current git commit hash from the mounted .git directory."""
    try:
        git_dir = os.environ.get("GIT_DIR", "/app/.git")
        if not os.path.exists(git_dir):
            git_dir = ".git"

        head_path = os.path.join(git_dir, "HEAD")
        if not os.path.exists(head_path):
            return "unknown"

        with open(head_path, "r", encoding="utf-8") as f:
            head = f.read().strip()

        if head.startswith("ref:"):
            ref_path = head.split(" ")[1]
            full_ref_path = os.path.join(git_dir, ref_path)
            if os.path.exists(full_ref_path):
                with open(full_ref_path, "r", encoding="utf-8") as f:
                    return f.read().strip()
            else:
                return "no_commits_yet"
        else:
            return head
    except Exception as e:  # pylint: disable=broad-exception-caught
        logger.error("Error reading git commit: %s", e)
        return f"error: {str(e)}"

def extract_json(text: str) -> dict:
    """Helper to extract JSON from the LLM text response."""
    match = re.search(r"\{[\s\S]*\}", text)
    if not match:
        raise ValueError("Could not parse JSON from response")
    return json.loads(match.group(0))

async def search_deezer_track(client: httpx.AsyncClient, title: str, artist: str) -> Optional[dict]:
    """Search Deezer API for a single track and enrich it."""
    query = f"{artist} {title}"
    try:
        response = await client.get(
            "https://api.deezer.com/search",
            params={"q": query, "limit": 1},
            timeout=10.0
        )
        if response.status_code != 200:
            return None

        data = response.json()
        tracks = data.get("data", [])
        if not tracks:
            return None

        track = tracks[0]
        artist_data = track.get("artist", {})
        album_data = track.get("album", {})
        return {
            "id": track.get("id"),
            "title": track.get("title"),
            "artist": artist_data.get("name", artist),
            "albumCover": album_data.get("cover_medium", ""),
            "albumName": album_data.get("title", ""),
            "previewUrl": track.get("preview", ""),
            "deezerUrl": track.get("link", ""),
            "duration": track.get("duration", 0)
        }
    except Exception as e:  # pylint: disable=broad-exception-caught
        logger.error("Error searching Deezer for '%s': %s", query, e)
        return None

async def enrich_tracks(tracks: List[dict]) -> List[dict]:
    """Parallelize enrichment using an httpx client."""
    async with httpx.AsyncClient() as client:
        tasks = [
            search_deezer_track(client, t.get("title", ""), t.get("artist", ""))
            for t in tracks
        ]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        enriched = []
        for r in results:
            if isinstance(r, dict) and r is not None:
                enriched.append(r)
        return enriched

@app.get("/version")
def version():
    """Endpoint returning current git commit hash."""
    return {"version": get_git_commit()}

@app.post("/api/generate", response_model=GenerateResponse)
async def generate(req: GenerateRequest):
    """Endpoint generating and enriching music playlists."""
    if not req.prompt or not req.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt is required")

    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="API key not configured. Please set the OPENROUTER_API_KEY environment variable."
        )

    model = os.getenv("OPENROUTER_MODEL", "openai/gpt-4o")

    # Construct LLM prompt & payload
    genre_instruction = f'Focus on the "{req.genre}" genre. ' if (req.genre and req.genre != "any") else ""

    selected_instruction = ""
    if req.selected_tracks:
        selected_list = ", ".join([f"'{t.title}' by {t.artist}" for t in req.selected_tracks])
        selected_instruction = (
            f"The user has selected the following tracks from the previous playlist to KEEP: [{selected_list}]. "
            "You MUST keep these selected tracks in the new playlist, and add or change the remaining tracks "
            "to fulfill the user's new request. "
        )

    system_prompt = (
        "You are a music expert helping the user curate a playlist. "
        f"Generate a playlist of exactly {req.count} songs. "
        f"{genre_instruction}"
        f"{selected_instruction}"
        "Respond ONLY with a valid JSON object containing a \"tracks\" array, "
        "where each item has \"title\" and \"artist\" fields. "
        "Example: {\"tracks\": [{\"title\": \"Bohemian Rhapsody\", \"artist\": \"Queen\"}]} "
        "Do NOT wrap the JSON in code blocks or markdown. Return raw JSON only."
    )

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://github.com/julesgaydonat/deezer-playlist",
        "X-Title": "Deezer Playlist Generator",
    }

    # Compile history messages
    messages = [{"role": "system", "content": system_prompt}]
    if req.history:
        for msg in req.history:
            messages.append({"role": msg.role, "content": msg.content})

    # Append new user message
    messages.append({"role": "user", "content": req.prompt})

    payload = {
        "model": model,
        "messages": messages
    }

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers=headers,
                json=payload
            )

            if response.status_code != 200:
                logger.error("OpenRouter API error: %s - %s", response.status_code, response.text)
                raise HTTPException(
                    status_code=502,
                    detail=f"OpenRouter API returned status code {response.status_code}"
                )

            res_data = response.json()
        choices = res_data.get("choices", [])
        if not choices:
            raise ValueError("No response choices from OpenRouter")

        content = choices[0].get("message", {}).get("content", "")
        if not content:
            raise ValueError("Empty completion response from OpenRouter")

        json_data = extract_json(content)
        raw_tracks = json_data.get("tracks") or json_data.get("songs") or json_data.get("playlist") or []
        if not isinstance(raw_tracks, list):
            raw_tracks = []

        # Truncate to desired count
        raw_tracks = raw_tracks[:req.count]

        if not raw_tracks:
            raise HTTPException(status_code=500, detail="No tracks generated by LLM")

        # Enrich tracks via Deezer API
        enriched = await enrich_tracks(raw_tracks)

        return GenerateResponse(
            tracks=enriched,
            prompt=req.prompt,
            total=len(raw_tracks),
            matched=len(enriched)
        )

    except HTTPException:
        raise
    except Exception as e:  # pylint: disable=broad-exception-caught
        logger.error("Generation failed: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail=str(e)) from e
