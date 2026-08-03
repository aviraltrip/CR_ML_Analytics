from fastapi import APIRouter

from app.models import DeckRequest
from app.services.deck_analysis import deck_analysis_service

router = APIRouter()


@router.post("/evaluate-deck")
def evaluate_deck(request: DeckRequest) -> dict:
    """Evaluate a deck using either historical lookups or ML-based prediction."""
    return deck_analysis_service.evaluate_deck(request.cards, request.levels)
