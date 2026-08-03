from fastapi import APIRouter

from app.models import SwapRequest
from app.services.deck_analysis import deck_analysis_service

router = APIRouter()


@router.post("/find-swaps")
def find_swaps(request: SwapRequest) -> dict:
    """Suggest card swaps using leave-one-out analysis."""
    return deck_analysis_service.find_swaps(request.cards, request.levels)
