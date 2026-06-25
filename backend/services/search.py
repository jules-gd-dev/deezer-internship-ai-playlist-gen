import logging
from duckduckgo_search import DDGS

logger = logging.getLogger("backend.search")

def search_web_context(query: str, max_results: int = 5) -> str:
    """Performs a text search on DuckDuckGo and returns snippet context."""
    try:
        with DDGS() as ddgs:
            results = list(ddgs.text(query, max_results=max_results))
            if not results:
                return ""
            context_pieces = []
            for r in results:
                title = r.get("title", "")
                body = r.get("body", "")
                if title and body:
                    context_pieces.append(f"Source: {title}\nSnippet: {body}")
            return "\n\n".join(context_pieces)
    except Exception as e:  # pylint: disable=broad-exception-caught
        logger.error("Web search failed for query '%s': %s", query, e)
        return ""
