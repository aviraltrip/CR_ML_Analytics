"""
Application configuration — all magic numbers and paths in one place.
"""

import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROJECT_ROOT = os.path.dirname(BASE_DIR)

# --- App ---
APP_VERSION = "1.0.0"

# --- CORS ---
CORS_ORIGINS = ["*"]

# --- Rate Limiting ---
RATE_LIMIT_MAX = 100       # max requests per window
RATE_LIMIT_WINDOW = 60     # seconds

# --- Caching ---
CACHE_TTL = 300            # seconds (5 minutes)

# --- Paths ---
MODELS_DIR = os.path.join(PROJECT_ROOT, "models")
DATA_DIR = os.path.join(PROJECT_ROOT, "data")

# --- ML ---
MODEL_PATH = os.path.join(MODELS_DIR, "synergy_predictor.pkl")
VOCAB_PATH = os.path.join(MODELS_DIR, "card_vocab.json")
ELIXIR_PATH = os.path.join(MODELS_DIR, "card_elixir.json")

# --- Data ---
BATTLES_PATH = os.path.join(DATA_DIR, "processed_battles.csv")
LEADERBOARD_PATH = os.path.join(DATA_DIR, "deck_leaderboard.csv")
CARD_STATS_PATH = os.path.join(DATA_DIR, "card_stats.csv")
MODEL_LEADERBOARD_PATH = os.path.join(DATA_DIR, "model_leaderboard.csv")
