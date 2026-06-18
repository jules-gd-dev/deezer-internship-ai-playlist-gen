import json
import asyncio
from typing import List, Optional
import httpx

from config import logger


async def search_deezer_track(
    client: httpx.AsyncClient, title: str, artist: str
) -> Optional[dict]:
    query = f"{artist} {title}"
    try:
        response = await client.get(
            "https://api.deezer.com/search",
            params={"q": query, "limit": 1},
            timeout=10.0,
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
            "duration": track.get("duration", 0),
        }
    except (httpx.RequestError, json.JSONDecodeError) as e:
        logger.error("Error searching Deezer for '%s': %s", query, e)
        return None


async def enrich_tracks(tracks: List[dict]) -> (List[dict], List[dict]):
    async with httpx.AsyncClient() as client:
        tasks = [
            search_deezer_track(client, t.get("title", ""), t.get("artist", ""))
            for t in tracks
        ]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        enriched = []
        failed = []
        for i, r in enumerate(results):
            if isinstance(r, dict) and r is not None:
                enriched.append(r)
            else:
                failed.append(tracks[i])
        return enriched, failed
