"""
Shared ML model state — loaded once at startup, reused across all routes.
"""

import json
import os
import pickle
from typing import Optional

import numpy as np
import pandas as pd

from app.config import settings

# ---------------------------------------------------------------------------
# Global state (populated at startup)
# ---------------------------------------------------------------------------
model: Optional[object] = None
card_vocab: Optional[dict] = None
card_elixir: dict = {}


def load_model_and_vocab() -> None:
    """Load the ML model and card vocabulary into global state."""
    global model, card_vocab

    if os.path.exists(settings.MODEL_PATH) and os.path.exists(settings.VOCAB_PATH):
        with open(settings.MODEL_PATH, "rb") as f:
            model = pickle.load(f)
        with open(settings.VOCAB_PATH, "r", encoding="utf-8") as f:
            card_vocab = json.load(f)


def load_card_elixir() -> None:
    """Load card elixir costs into global state."""
    global card_elixir

    if os.path.exists(settings.ELIXIR_PATH):
        with open(settings.ELIXIR_PATH, "r", encoding="utf-8") as f:
            card_elixir = json.load(f)


def ensure_model_loaded() -> None:
    """Raise 503 if the ML model is not available."""
    if model is None or card_vocab is None:
        from fastapi import HTTPException
        raise HTTPException(status_code=503, detail="ML model not loaded. Train models first.")


# ---------------------------------------------------------------------------
# Helper functions (preserved from original main.py)
# ---------------------------------------------------------------------------
def calculate_aec(deck_cards: list[str], card_elixir_map: dict) -> float:
    costs = [card_elixir_map.get(c, 3.5) for c in deck_cards]
    return sum(costs) / len(costs)


def calculate_elixir_penalty(aec: float) -> float:
    if 2.8 <= aec <= 4.2:
        return 0.0
    elif aec < 2.8:
        return ((2.8 - aec) ** 2) * 0.15
    else:
        return ((aec - 4.2) ** 2) * 0.15


def load_csv(path: str) -> pd.DataFrame:
    """Load a CSV file, raising 404 if missing."""
    from fastapi import HTTPException
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail=f"Data file not found: {os.path.basename(path)}")
    return pd.read_csv(path)
