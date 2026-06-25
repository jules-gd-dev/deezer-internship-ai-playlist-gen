import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("backend")

MAX_RETRIES = 2
MATCH_THRESHOLD = 0.6


def get_provider() -> str:
    return os.getenv("PROVIDER", "openrouter").lower()


def get_openrouter_api_key() -> str:
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key and get_provider() == "openrouter":
        raise RuntimeError(
            "OPENROUTER_API_KEY not set. "
            "Please set the OPENROUTER_API_KEY environment variable."
        )
    return api_key or ""


def get_openrouter_model() -> str:
    return os.getenv("OPENROUTER_MODEL", "openai/gpt-4o")


def get_openrouter_fallback_model() -> str:
    return os.getenv("OPENROUTER_FALLBACK_MODEL", "openrouter/free")


def get_groq_api_key() -> str:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key and get_provider() == "groq":
        raise RuntimeError(
            "GROQ_API_KEY not set. "
            "Please set the GROQ_API_KEY environment variable."
        )
    return api_key or ""


def get_groq_model() -> str:
    return os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")


def get_groq_fallback_model() -> str:
    return os.getenv("GROQ_FALLBACK_MODEL", "llama3-8b-8192")


