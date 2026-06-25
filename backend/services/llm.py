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
    selected_tracks: Optional[List[dict]] = None,
    search_context: Optional[str] = None,
    already_matched_tracks: Optional[List[dict]] = None,
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

    selected_instruction = ""
    if selected_tracks:
        selected_list = ", ".join([f"'{t.get('title', '')}' by {t.get('artist', '')}" for t in selected_tracks])
        selected_instruction = (
            f"The user has selected the following tracks from the previous playlist to KEEP: [{selected_list}]. "
            "You MUST keep these selected tracks in the new playlist, and add or change the remaining tracks "
            "to fulfill the user's new request. "
        )

    context_instruction = ""
    if search_context:
        context_instruction = (
            "Here is some web search context about the requested music style/genre. "
            "Use it to find real, existing songs and artists (names, titles, styles):\n"
            f"{search_context}\n\n"
            "CRITICAL: Do NOT hallucinate. Do NOT invent artists or song names. Use the search context to verify.\n"
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

    already_matched_instruction = ""
    if already_matched_tracks:
        matched_list = "\n".join([f"- '{t.get('title', '')}' by {t.get('artist', '')}" for t in already_matched_tracks])
        already_matched_instruction = (
            f"The following tracks are already in the playlist. You MUST NOT include or regenerate them:\n"
            f"{matched_list}\n\n"
        )

    prompt_str = (
        base
        + f"Generate a playlist of exactly {count} songs. "
        + niche_directive
        + genre_instruction
        + selected_instruction
        + context_instruction
        + strict
        + retry_instruction
        + already_matched_instruction
    )

    prompt_str += (
        'Respond ONLY with a valid JSON object with a "name" field (playlist title) '
        'and a "tracks" array where each item has "title" and "artist" fields. '
        'Example: {"name": "Hyperpop Energy Mix", "tracks": [{"title": "Bohemian Rhapsody", "artist": "Queen"}]} '
        "Do NOT wrap the JSON in code blocks or markdown. Return raw JSON only."
    )
    return prompt_str


async def call_llm(
    api_key: str,
    model: str,
    system_prompt: str,
    user_prompt: str,
    history: Optional[List[dict]] = None,
    fallback_model: Optional[str] = None,
    api_url: str = "https://openrouter.ai/api/v1/chat/completions",
) -> dict:
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://github.com/julesgaydonat/deezer-playlist",
        "X-Title": "Deezer Playlist Generator",
    }
    messages = [{"role": "system", "content": system_prompt}]
    if history:
        for msg in history:
            messages.append({"role": msg.get("role", "user"), "content": msg.get("content", "")})
    messages.append({"role": "user", "content": user_prompt})

    models_to_try = [model]
    if fallback_model and fallback_model != model:
        models_to_try.append(fallback_model)

    last_error = None
    for current_model in models_to_try:
        try:
            logger.info("Calling LLM at %s with model: %s", api_url, current_model)
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    api_url,
                    headers=headers,
                    json={"model": current_model, "messages": messages},
                )
                if response.status_code != 200:
                    logger.warning(
                        "Model %s failed with status %d: %s", 
                        current_model, response.status_code, response.text
                    )
                    last_error = f"API status {response.status_code}: {response.text}"
                    continue
                res_data = response.json()
            choices = res_data.get("choices", [])
            if not choices:
                last_error = "No response choices from OpenRouter"
                continue
            content = choices[0].get("message", {}).get("content", "")
            if not content:
                last_error = "Empty completion response from OpenRouter"
                continue
            
            return extract_json(content)
        except Exception as e:
            logger.warning("Error calling model %s: %s", current_model, e)
            last_error = str(e)
            continue

    # If all models failed:
    raise HTTPException(
        status_code=502,
        detail=f"LLM API failed. Last error from {models_to_try[-1]}: {last_error}",
    )
