import json
import re
import time
import asyncio
from typing import List, Optional
import httpx
import redis.asyncio as redis

from config import logger, get_redis_url

# Initialize Redis client lazily
redis_client = None
redis_url = get_redis_url()
if redis_url:
    try:
        redis_client = redis.from_url(redis_url, encoding="utf-8", decode_responses=True)
        logger.info("Redis cache client initialized using URL: %s", redis_url)
    except Exception as e:
        logger.error("Failed to initialize Redis client: %s", e)


async def get_cached_track(artist: str, title: str) -> tuple[bool, Optional[dict]]:
    """Check cache for the given artist and title.
    Returns (is_cached, track_data).
    """
    if not redis_client:
        return False, None
    key = f"deezer:track:{artist.strip().lower()}:{title.strip().lower()}"
    try:
        data = await redis_client.get(key)
        if data is not None:
            if data == "null":
                logger.info("Redis negative cache hit for '%s - %s'", artist, title)
                return True, None
            logger.info("Redis cache hit for '%s - %s'", artist, title)
            return True, json.loads(data)
    except Exception as e:
        logger.warning("Redis read error for key '%s': %s", key, e)
    return False, None


async def set_cached_track(artist: str, title: str, track_data: Optional[dict]) -> None:
    """Store the track search result in Redis. Supports negative caching ("null")."""
    if not redis_client:
        return
    key = f"deezer:track:{artist.strip().lower()}:{title.strip().lower()}"
    try:
        value = json.dumps(track_data) if track_data is not None else "null"
        # Cache for 7 days (604800 seconds)
        await redis_client.set(key, value, ex=604800)
    except Exception as e:
        logger.warning("Redis write error for key '%s': %s", key, e)


def is_preview_url_valid(url: str) -> bool:
    if not url:
        return False
    match = re.search(r"exp=(\d+)", url)
    if not match:
        return True
    try:
        expiry = int(match.group(1))
        return expiry > (time.time() + 300)
    except ValueError:
        return False


async def refresh_deezer_preview(client: httpx.AsyncClient, track_id: int) -> Optional[str]:
    try:
        response = await client.get(
            f"https://api.deezer.com/track/{track_id}",
            timeout=5.0
        )
        if response.status_code == 200:
            data = response.json()
            return data.get("preview", "")
    except Exception as e:
        logger.warning("Failed to refresh preview for track %s: %s", track_id, e)
    return None


async def search_deezer_track(
    client: httpx.AsyncClient, title: str, artist: str
) -> Optional[dict]:
    # Check Redis cache first
    is_cached, cached_val = await get_cached_track(artist, title)
    if is_cached:
        if cached_val:
            preview_url = cached_val.get("previewUrl", "")
            if preview_url and not is_preview_url_valid(preview_url):
                track_id = cached_val.get("id")
                if track_id:
                    logger.info("Cached preview URL expired for track %s. Refreshing...", track_id)
                    new_preview = await refresh_deezer_preview(client, track_id)
                    if new_preview:
                        cached_val["previewUrl"] = new_preview
                        await set_cached_track(artist, title, cached_val)
        return cached_val

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
            # Cache the negative result so we don't spam Deezer API for unmatchable tracks
            await set_cached_track(artist, title, None)
            return None
        track = tracks[0]
        artist_data = track.get("artist", {})
        album_data = track.get("album", {})
        result = {
            "id": track.get("id"),
            "title": track.get("title"),
            "artist": artist_data.get("name", artist),
            "albumCover": album_data.get("cover_medium", ""),
            "albumName": album_data.get("title", ""),
            "previewUrl": track.get("preview", ""),
            "deezerUrl": track.get("link", ""),
            "duration": track.get("duration", 0),
        }
        # Save to Redis
        await set_cached_track(artist, title, result)
        return result
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
