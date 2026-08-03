from typing import Any

from app.services.errors import ApiError

DEFAULT_LEVEL = 11


def validate_deck(cards: list[str], *, field_name: str = "cards") -> list[str]:
    if not isinstance(cards, list) or len(cards) != 8:
        raise ApiError("Exactly 8 cards are required.", code="INVALID_REQUEST", status_code=400)
    if not all(isinstance(card, str) and card.strip() for card in cards):
        raise ApiError("Cards must be non-empty strings.", code="INVALID_REQUEST", status_code=400)
    return cards


def normalize_levels(levels: dict[str, int] | None, cards: list[str]) -> dict[str, int]:
    normalized: dict[str, int] = {}
    if levels:
        for card, level in levels.items():
            if isinstance(card, str) and isinstance(level, int):
                normalized[card] = level
    for card in cards:
        normalized.setdefault(card, DEFAULT_LEVEL)
    return normalized


def ensure_mapping(payload: dict[str, Any], required_keys: list[str]) -> None:
    missing = [key for key in required_keys if key not in payload]
    if missing:
        raise ApiError(f"Missing required fields: {', '.join(missing)}", code="INVALID_REQUEST", status_code=400)
