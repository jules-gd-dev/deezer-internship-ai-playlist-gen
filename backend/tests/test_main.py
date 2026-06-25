from fastapi.testclient import TestClient
import httpx
from main import app
from routers.generate import rate_limit_store

client = TestClient(app)

def test_version():
    """Test the /version endpoint returns 200 and a version dictionary."""
    response = client.get("/version")
    assert response.status_code == 200
    data = response.json()
    assert "version" in data
    assert isinstance(data["version"], str)

def test_generate_missing_prompt():
    """Test that omitting prompt returns a 422 validation error."""
    response = client.post("/api/generate", json={"genre": "rock"})
    assert response.status_code == 422

def test_generate_empty_prompt():
    """Test that sending an empty or blank prompt returns 400 Bad Request."""
    response = client.post("/api/generate", json={"prompt": "   ", "genre": "rock"})
    assert response.status_code == 400
    assert "Prompt is required" in response.json()["detail"]

def test_generate_success(monkeypatch):
    """Test a successful generation flow by mocking LLM and Deezer HTTP clients."""
    rate_limit_store.clear()
    # Mock OpenRouter POST call
    async def mock_post(*_args, **_kwargs):
        class MockResponse:
            status_code = 200
            def json(self):
                return {
                    "choices": [
                        {
                            "message": {
                                "content": (
                                    '{"name": "Test Playlist", '
                                    '"tracks": [{"title": "Yesterday", "artist": "The Beatles"}]}'
                                ),
                            }
                        }
                    ]
                }
        return MockResponse()

    # Mock Deezer GET call
    async def mock_get(*_args, **_kwargs):
        class MockResponse:
            status_code = 200
            def json(self):
                return {
                    "data": [
                        {
                            "id": 123456,
                            "title": "Yesterday",
                            "artist": {"name": "The Beatles"},
                            "album": {
                                "title": "Help!",
                                "cover_medium": "https://example.com/cover.jpg"
                            },
                            "preview": "https://example.com/preview.mp3",
                            "link": "https://deezer.com/track/123456",
                            "duration": 125
                        }
                    ]
                }
        return MockResponse()

    # Set mock methods
    monkeypatch.setattr(httpx.AsyncClient, "post", mock_post)
    monkeypatch.setattr(httpx.AsyncClient, "get", mock_get)

    # Ensure OPENROUTER_API_KEY environment variable is mock-configured
    monkeypatch.setenv("OPENROUTER_API_KEY", "fake-test-key")

    import time
    start_time = time.perf_counter()
    response = client.post(
        "/api/generate",
        json={"prompt": "Peaceful morning", "count": 1, "genre": "rock"}
    )
    duration = time.perf_counter() - start_time

    assert response.status_code == 200
    assert duration < 3.5
    data = response.json()
    assert data["name"] == "Test Playlist"
    assert data["total"] == 1
    assert data["matched"] == 1
    assert len(data["tracks"]) == 1

    track = data["tracks"][0]
    assert track["id"] == 123456
    assert track["title"] == "Yesterday"
    assert track["artist"] == "The Beatles"
    assert track["albumName"] == "Help!"
    assert track["albumCover"] == "https://example.com/cover.jpg"
    assert track["previewUrl"] == "https://example.com/preview.mp3"
    assert track["deezerUrl"] == "https://deezer.com/track/123456"
    assert track["duration"] == 125


def test_rate_limiting(monkeypatch):
    """Test that rate limiting enforces a maximum of 10 requests per hour per IP."""
    rate_limit_store.clear()

    # Mock OpenRouter POST call
    async def mock_post(*_args, **_kwargs):
        class MockResponse:
            status_code = 200
            def json(self):
                return {
                    "choices": [
                        {
                            "message": {
                                "content": (
                                    '{"name": "Test Playlist", '
                                    '"tracks": [{"title": "Yesterday", "artist": "The Beatles"}]}'
                                ),
                            }
                        }
                    ]
                }
        return MockResponse()

    # Mock Deezer GET call
    async def mock_get(*_args, **_kwargs):
        class MockResponse:
            status_code = 200
            def json(self):
                return {
                    "data": [
                        {
                            "id": 123456,
                            "title": "Yesterday",
                            "artist": {"name": "The Beatles"},
                            "album": {
                                "title": "Help!",
                                "cover_medium": "https://example.com/cover.jpg"
                            },
                            "preview": "https://example.com/preview.mp3",
                            "link": "https://deezer.com/track/123456",
                            "duration": 125
                        }
                    ]
                }
        return MockResponse()

    # Set mock methods
    monkeypatch.setattr(httpx.AsyncClient, "post", mock_post)
    monkeypatch.setattr(httpx.AsyncClient, "get", mock_get)

    # Ensure OPENROUTER_API_KEY environment variable is mock-configured
    monkeypatch.setenv("OPENROUTER_API_KEY", "fake-test-key")

    # The first 10 requests from the same client IP should pass
    for _ in range(10):
        response = client.post(
            "/api/generate",
            json={"prompt": "Peaceful morning", "count": 1, "genre": "rock"}
        )
        assert response.status_code == 200

    # The 11th request from the same client IP should fail with 429
    response = client.post(
        "/api/generate",
        json={"prompt": "Peaceful morning", "count": 1, "genre": "rock"}
    )
    assert response.status_code == 429
    assert "Rate limit exceeded" in response.json()["detail"]

    # Clear rate limit store afterwards
    rate_limit_store.clear()
