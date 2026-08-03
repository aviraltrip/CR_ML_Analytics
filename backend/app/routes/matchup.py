from fastapi import APIRouter

from app.models import MatchupRequest
from app.services.deck_analysis import deck_analysis_service

router = APIRouter()


@router.post("/predict-matchup")
def predict_matchup(request: MatchupRequest) -> dict:
    """Predict a matchup probability and card contribution breakdown."""
    return deck_analysis_service.predict_matchup(
        request.deck1_cards,
        request.deck1_levels,
        request.deck1_trophies,
        request.deck2_cards,
        request.deck2_levels,
        request.deck2_trophies,
    )
