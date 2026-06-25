import pytest
import httpx
import re
from fastapi.testclient import TestClient
from main import app
from routers.generate import rate_limit_store

client = TestClient(app)

# Helper function to generate mock tracks for the mock responses
def make_mock_tracks(count):
    return [{"title": f"Song {i}", "artist": f"Artist {i}"} for i in range(1, count + 1)]

# Setup mock for LLM and Deezer
@pytest.fixture(autouse=True)
def mock_external_calls(monkeypatch):
    rate_limit_store.clear()
    
    async def mock_post(*args, **kwargs):
        json_body = kwargs.get("json", {})
        messages = json_body.get("messages", [])
        count = 20
        for m in messages:
            if m.get("role") == "system":
                match = re.search(r"Generate a playlist of exactly (\d+) songs", m.get("content", ""))
                if match:
                    count = int(match.group(1))
                    break
        
        class MockResponse:
            status_code = 200
            def json(self):
                # Return JSON with the exact count of tracks requested
                tracks_list = make_mock_tracks(count)
                import json
                content_str = json.dumps({"name": "Mock Playlist", "tracks": tracks_list})
                return {
                    "choices": [
                        {
                            "message": {
                                "content": content_str
                            }
                        }
                    ]
                }
        return MockResponse()

    async def mock_get(client_obj, url, *args, **kwargs):
        params = kwargs.get("params", {})
        query = params.get("q", "Artist Title")
        
        parts = query.split(" ")
        artist = parts[0] if len(parts) > 0 else "Artist"
        title = " ".join(parts[1:]) if len(parts) > 1 else "Title"
        
        class MockResponse:
            status_code = 200
            def json(self):
                return {
                    "data": [
                        {
                            "id": 9999,
                            "title": title,
                            "artist": {"name": artist},
                            "album": {
                                "title": "Mock Album",
                                "cover_medium": "https://example.com/cover.jpg"
                            },
                            "preview": "https://example.com/preview.mp3",
                            "link": "https://deezer.com/track/9999",
                            "duration": 180
                        }
                    ]
                }
        return MockResponse()

    monkeypatch.setattr(httpx.AsyncClient, "post", mock_post)
    monkeypatch.setattr(httpx.AsyncClient, "get", mock_get)
    monkeypatch.setenv("OPENROUTER_API_KEY", "fake-test-key")
    monkeypatch.setenv("GROQ_API_KEY", "fake-test-key")

# 20 separate tests with different prompts all requesting exactly 20 tracks

def test_prompt_1_acoustic_rain():
    response = client.post("/api/generate", json={"prompt": "Warm acoustic selections for a rainy day", "count": 20})
    assert response.status_code == 200
    assert len(response.json()["tracks"]) == 20

def test_prompt_2_coding_beats():
    response = client.post("/api/generate", json={"prompt": "Deep electronic beats for late night coding focus", "count": 20})
    assert response.status_code == 200
    assert len(response.json()["tracks"]) == 20

def test_prompt_3_hiphop_drive():
    response = client.post("/api/generate", json={"prompt": "Golden era hip-hop classics for a highway drive", "count": 20})
    assert response.status_code == 200
    assert len(response.json()["tracks"]) == 20

def test_prompt_4_french_acoustic():
    response = client.post("/api/generate", json={"prompt": "Chill and melancholic French acoustic songs", "count": 20})
    assert response.status_code == 200
    assert len(response.json()["tracks"]) == 20

def test_prompt_5_workout_rock():
    response = client.post("/api/generate", json={"prompt": "High energy rock for weightlifting sessions", "count": 20})
    assert response.status_code == 200
    assert len(response.json()["tracks"]) == 20

def test_prompt_6_sunday_jazz():
    response = client.post("/api/generate", json={"prompt": "Relaxing jazz for a Sunday brunch", "count": 20})
    assert response.status_code == 200
    assert len(response.json()["tracks"]) == 20

def test_prompt_7_classical_study():
    response = client.post("/api/generate", json={"prompt": "Classical music for intense studying", "count": 20})
    assert response.status_code == 200
    assert len(response.json()["tracks"]) == 20

def test_prompt_8_synthwave_night():
    response = client.post("/api/generate", json={"prompt": "Retro synthwave for driving at night", "count": 20})
    assert response.status_code == 200
    assert len(response.json()["tracks"]) == 20

def test_prompt_9_party_pop():
    response = client.post("/api/generate", json={"prompt": "Energetic pop hits for a house party", "count": 20})
    assert response.status_code == 200
    assert len(response.json()["tracks"]) == 20

def test_prompt_10_ambient_sleep():
    response = client.post("/api/generate", json={"prompt": "Slow and atmospheric ambient soundscapes", "count": 20})
    assert response.status_code == 200
    assert len(response.json()["tracks"]) == 20

def test_prompt_11_metal_focus():
    response = client.post("/api/generate", json={"prompt": "Heavy metal for coding under pressure", "count": 20})
    assert response.status_code == 200
    assert len(response.json()["tracks"]) == 20

def test_prompt_12_sunny_indie():
    response = client.post("/api/generate", json={"prompt": "Upbeat indie folk for a sunny morning", "count": 20})
    assert response.status_code == 200
    assert len(response.json()["tracks"]) == 20

def test_prompt_13_romantic_rb():
    response = client.post("/api/generate", json={"prompt": "Smooth R&B for a romantic dinner", "count": 20})
    assert response.status_code == 200
    assert len(response.json()["tracks"]) == 20

def test_prompt_14_cardio_house():
    response = client.post("/api/generate", json={"prompt": "Deep house music for workout cardio", "count": 20})
    assert response.status_code == 200
    assert len(response.json()["tracks"]) == 20

def test_prompt_15_rock_covers():
    response = client.post("/api/generate", json={"prompt": "Acoustic covers of popular rock songs", "count": 20})
    assert response.status_code == 200
    assert len(response.json()["tracks"]) == 20

def test_prompt_16_psychedelic_sixties():
    response = client.post("/api/generate", json={"prompt": "Psychedelic rock from the late 60s", "count": 20})
    assert response.status_code == 200
    assert len(response.json()["tracks"]) == 20

def test_prompt_17_lofi_beats():
    response = client.post("/api/generate", json={"prompt": "Lofi hiphop beats to relax/study to", "count": 20})
    assert response.status_code == 200
    assert len(response.json()["tracks"]) == 20

def test_prompt_18_beach_reggae():
    response = client.post("/api/generate", json={"prompt": "Reggae vibes for a beach day", "count": 20})
    assert response.status_code == 200
    assert len(response.json()["tracks"]) == 20

def test_prompt_19_gaming_soundtrack():
    response = client.post("/api/generate", json={"prompt": "Epic cinematic soundtrack for gaming", "count": 20})
    assert response.status_code == 200
    assert len(response.json()["tracks"]) == 20

def test_prompt_20_phonk_gym():
    response = client.post("/api/generate", json={"prompt": "Aggressive phonk for gym motivation", "count": 20})
    assert response.status_code == 200
    assert len(response.json()["tracks"]) == 20
