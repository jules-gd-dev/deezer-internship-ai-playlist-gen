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

def check_generation(prompt, count=20):
    import time
    start_time = time.perf_counter()
    response = client.post("/api/generate", json={"prompt": prompt, "count": count})
    duration = time.perf_counter() - start_time
    assert response.status_code == 200
    assert len(response.json()["tracks"]) == count
    assert duration < 3.5

def test_prompt_1_acoustic_rain():
    check_generation("Warm acoustic selections for a rainy day")

def test_prompt_2_coding_beats():
    check_generation("Deep electronic beats for late night coding focus")

def test_prompt_3_hiphop_drive():
    check_generation("Golden era hip-hop classics for a highway drive")

def test_prompt_4_french_acoustic():
    check_generation("Chill and melancholic French acoustic songs")

def test_prompt_5_workout_rock():
    check_generation("High energy rock for weightlifting sessions")

def test_prompt_6_sunday_jazz():
    check_generation("Relaxing jazz for a Sunday brunch")

def test_prompt_7_classical_study():
    check_generation("Classical music for intense studying")

def test_prompt_8_synthwave_night():
    check_generation("Retro synthwave for driving at night")

def test_prompt_9_party_pop():
    check_generation("Energetic pop hits for a house party")

def test_prompt_10_ambient_sleep():
    check_generation("Slow and atmospheric ambient soundscapes")

def test_prompt_11_metal_focus():
    check_generation("Heavy metal for coding under pressure")

def test_prompt_12_sunny_indie():
    check_generation("Upbeat indie folk for a sunny morning")

def test_prompt_13_romantic_rb():
    check_generation("Smooth R&B for a romantic dinner")

def test_prompt_14_cardio_house():
    check_generation("Deep house music for workout cardio")

def test_prompt_15_rock_covers():
    check_generation("Acoustic covers of popular rock songs")

def test_prompt_16_psychedelic_sixties():
    check_generation("Psychedelic rock from the late 60s")

def test_prompt_17_lofi_beats():
    check_generation("Lofi hiphop beats to relax/study to")

def test_prompt_18_beach_reggae():
    check_generation("Reggae vibes for a beach day")

def test_prompt_19_gaming_soundtrack():
    check_generation("Epic cinematic soundtrack for gaming")

def test_prompt_20_phonk_gym():
    check_generation("Aggressive phonk for gym motivation")

