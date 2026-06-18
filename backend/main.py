from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers.generate import router

app = FastAPI(title="Deezer Playlist Generator Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
