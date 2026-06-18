import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("backend")

MAX_RETRIES = 2
MATCH_THRESHOLD = 0.6


def get_openrouter_api_key() -> str:
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise RuntimeError(
            "OPENROUTER_API_KEY not set. "
            "Please set the OPENROUTER_API_KEY environment variable."
        )
    return api_key


def get_openrouter_model() -> str:
    return os.getenv("OPENROUTER_MODEL", "openai/gpt-4o")
