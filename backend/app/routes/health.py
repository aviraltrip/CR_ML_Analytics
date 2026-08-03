from fastapi import APIRouter

from app.dependencies import model, card_vocab

router = APIRouter()


@router.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "model_loaded": model is not None,
        "vocab_loaded": card_vocab is not None,
    }
