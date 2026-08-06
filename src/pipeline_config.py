"""Shared configuration for the Clash Royale data/ML pipeline."""

from __future__ import annotations

import os
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
SRC_DIR = ROOT_DIR / "src"

# Load environment variables from .env file if present
env_path = ROOT_DIR / ".env"
if env_path.exists():
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, val = line.split("=", 1)
                os.environ[key.strip()] = val.strip()
DATA_DIR = ROOT_DIR / "data"
MODELS_DIR = ROOT_DIR / "models"

RAW_BATTLELOG_PATH = DATA_DIR / "raw_battlelog.jsonl"
PROCESSED_BATTLES_PATH = DATA_DIR / "processed_battles.csv"
DECK_LEADERBOARD_PATH = DATA_DIR / "deck_leaderboard.csv"
CARD_STATS_PATH = DATA_DIR / "card_stats.csv"
MODEL_LEADERBOARD_PATH = DATA_DIR / "model_leaderboard.csv"

MODEL_PATH = MODELS_DIR / "synergy_predictor.pkl"
VOCAB_PATH = MODELS_DIR / "card_vocab.json"
ELIXIR_PATH = MODELS_DIR / "card_elixir.json"

DEFAULT_SEED_TAGS = os.getenv("CR_SEED_TAGS", "#2Y0V8PG,#PP8L02Y")
DEFAULT_MAX_PLAYERS = int(os.getenv("CR_MAX_PLAYERS", "2000"))
DEFAULT_SLEEP_SECONDS = float(os.getenv("CR_SLEEP_SECONDS", "0.3"))
DEFAULT_MIN_MATCHES = int(os.getenv("CR_MIN_MATCHES", "5"))

CR_API_TOKEN_ENV = "CR_API_TOKEN"
