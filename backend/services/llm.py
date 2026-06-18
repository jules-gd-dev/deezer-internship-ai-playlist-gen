import re
import json
from typing import List, Optional

import httpx
from fastapi import HTTPException

from config import logger


def extract_json(text: str) -> dict:
    match = re.search(r"\{[\s\S]*\}", text)
    if not match:
        raise ValueError("Could not parse JSON from response")
    return json.loads(match.group(0))


def build_system_prompt(  # pylint: disable=too-many-arguments,too-many-positional-arguments
    genre_instruction: str,
    user_prompt: str,
    count: int,
    is_retry: bool = False,
    failed_tracks: Optional[List[dict]] = None,
) -> str:
    base = "You are a music expert helping the user curate a playlist. "
    strict = (
        "- You MUST ONLY generate tracks that ACTUALLY EXIST on streaming platforms.\n"
        "- Do NOT invent or hallucinate song titles or artist names.\n"
        "- Every track must be verifiably real and at least moderately well-known.\n"
        "- If you are unsure even 1% about a track's existence, do NOT include it.\n"
        "- It is better to return fewer tracks with fewer artists than to include fake tracks.\n"
        "- Only include tracks by real artists that have verified discographies.\n"
    )
    niche_directive = (
        f"The user specifically requested: \"{user_prompt}\"\n"
        "Your playlist must match this EXACT subgenre or niche, not the broader genre category.\n"
        "For example, if they request 'russian post punk', "
        "do NOT include non-Russian post-punk bands like Joy Division or The Cure.\n"
        "If they request 'hyperpop', do NOT include mainstream pop artists.\n"
        "Go deep into the specific niche requested.\n"
    )

    retry_instruction = ""
    if is_retry and failed_tracks:
        failed_list = "\n".join(
            f"- '{t.get('title', '')}' by {t.get('artist', '')}" for t in failed_tracks
        )
        retry_instruction = (
            f"The following tracks from the previous attempt do NOT exist on streaming platforms:\n"
            f"{failed_list}\n\n"
            f"Please REPLACE them with real tracks. "
            "CRITICAL: Only generate tracks that actually exist. No fake tracks. "
        )

    prompt_str = (
        base
        + f"Generate a playlist of exactly {count} songs. "
        + niche_directive
        + genre_instruction
        + strict
        + retry_instruction
    )

    prompt_str += (
        'Respond ONLY with a valid JSON object with a "name" field (playlist title) '
        'and a "tracks" array where each item has "title" and "artist" fields. '
        'Example: {"name": "Hyperpop Energy Mix", "tracks": [{"title": "Bohemian Rhapsody", "artist": "Queen"}]} '
        "Do NOT wrap the JSON in code blocks or markdown. Return raw JSON only."
    )
    return prompt_str


async def call_llm(
    api_key: str, model: str, system_prompt: str, user_prompt: str
) -> dict:
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://github.com/julesgaydonat/deezer-playlist",
        "X-Title": "Deezer Playlist Generator",
    }
    messages = [{"role": "system", "content": system_prompt}]
    messages.append({"role": "user", "content": user_prompt})

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            json={"model": model, "messages": messages},
        )
        if response.status_code != 200:
            logger.error(
                "OpenRouter API error: %s - %s", response.status_code, response.text
            )
            raise HTTPException(
                status_code=502,
                detail=f"OpenRouter API returned status code {response.status_code}",
            )
        res_data = response.json()
    choices = res_data.get("choices", [])
    if not choices:
        raise ValueError("No response choices from OpenRouter")
    content = choices[0].get("message", {}).get("content", "")
    if not content:
        raise ValueError("Empty completion response from OpenRouter")
    return extract_json(content)
