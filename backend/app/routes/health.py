from fastapi import APIRouter

from app import dependencies

router = APIRouter()


@router.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "model_loaded": dependencies.model is not None,
        "vocab_loaded": dependencies.card_vocab is not None,
    }

