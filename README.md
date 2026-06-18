# Deezer Playlist Generator

Generate curated Deezer playlists from a text prompt using AI (OpenRouter) and Deezer's search API.

## How it works

1. You describe a vibe, mood, or scene (e.g. *"rainy night in Tokyo"*, *"hyperpunk gym session"*).
2. The backend sends your prompt to OpenRouter (`openai/gpt-4o` by default) and asks it to generate track titles + artists.
3. Each track is looked up on the Deezer API to get real metadata (cover art, preview URL, Deezer link).
4. If the match rate is below 60%, the LLM is called again (up to 2 retries) to replace hallucinated tracks.
5. The final playlist appears with playable 30-second previews.

### Prompt sent to the AI

The full system prompt sent to OpenRouter is built as follows:

```
You are a music expert helping the user curate a playlist.
Generate a playlist of exactly {count} songs.
The user specifically requested: "{user_prompt}"
Your playlist must match this EXACT subgenre or niche, not the broader genre category.
For example, if they request 'russian post punk',
do NOT include non-Russian post-punk bands like Joy Division or The Cure.
If they request 'hyperpop', do NOT include mainstream pop artists.
Go deep into the specific niche requested.

- You MUST ONLY generate tracks that ACTUALLY EXIST on streaming platforms.
- Do NOT invent or hallucinate song titles or artist names.
- Every track must be verifiably real and at least moderately well-known.
- If you are unsure even 1% about a track's existence, do NOT include it.
- It is better to return fewer tracks with fewer artists than to include fake tracks.
- Only include tracks by real artists that have verified discographies.

Respond ONLY with a valid JSON object with a "name" field (playlist title)
and a "tracks" array where each item has "title" and "artist" fields.
Example: {"name": "Hyperpop Energy Mix", "tracks": [{"title": "Bohemian Rhapsody", "artist": "Queen"}]}
Do NOT wrap the JSON in code blocks or markdown. Return raw JSON only.
```

On retry (match rate ≤ 60%), the prompt also includes the list of unmatched tracks and asks the LLM to replace them.

## Stack

- **Frontend**: Next.js 16 (App Router), Tailwind CSS v4, Lucide icons
- **Backend**: Python 3.11, FastAPI, httpx, Pydantic
- **APIs**: OpenRouter (LLM), Deezer (track search & previews)
- **Infra**: Docker Compose

## Structure

```
├── frontend/          # Next.js app (port 3001)
│   └── src/
│       ├── app/
│       ├── components/
│       └── types/
├── backend/           # FastAPI (port 8001)
│   ├── main.py
│   ├── config.py
│   ├── models/
│   ├── services/
│   ├── routers/
│   └── tests/
├── docker-compose.yml
└── .env.example
```

## Setup

```bash
# 1. Clone & copy env
cp .env.example .env

# 2. Fill in your OpenRouter API key in .env
#    Get one at https://openrouter.ai/keys

# 3. Start both services
docker compose up --build

# 4. Open http://localhost:3001
```

### Environment variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `OPENROUTER_API_KEY` | Yes | — | API key from openrouter.ai |
| `OPENROUTER_MODEL` | No | `openai/gpt-4o` | LLM model to use |

## Development

```bash
# Backend tests
docker compose run --rm backend pytest

# Backend lint
docker compose run --rm backend pylint main.py config.py models/ services/ routers/ tests/

# Frontend build (after source changes)
docker compose exec frontend npm run build && docker compose restart frontend
```
