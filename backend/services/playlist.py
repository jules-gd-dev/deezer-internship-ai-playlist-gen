import os
import re
from typing import List

from config import logger


def get_git_commit() -> str:
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
            return "no_commits_yet"
        return head
    except OSError as e:
        logger.error("Error reading git commit: %s", e)
        return f"error: {str(e)}"


def normalize_track_name(name: str) -> str:
    name = name.lower().strip()
    name = re.sub(r'[\(\[].*?[\)\]]', "", name).strip()
    return name


def deduplicate_tracks(tracks: List[dict]) -> List[dict]:
    seen = set()
    result = []
    for t in tracks:
        title = normalize_track_name(t.get("title", ""))
        artist = t.get("artist", "").lower().strip()
        key = (artist, title)
        if key not in seen:
            seen.add(key)
            result.append(t)
    return result
