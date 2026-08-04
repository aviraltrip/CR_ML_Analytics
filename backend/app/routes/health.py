from fastapi import APIRouter
from fastapi.responses import RedirectResponse

from app import dependencies

router = APIRouter()


@router.get("/")
def root() -> dict:
    return {
        "message": "Welcome to the Clash Royale Deck Analytics API!",
        "documentation": "/docs",
        "frontend": "http://localhost:3000",
        "status": "active"
    }


@router.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "model_loaded": dependencies.model is not None,
        "vocab_loaded": dependencies.card_vocab is not None,
    }


