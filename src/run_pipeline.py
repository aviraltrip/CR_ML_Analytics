"""Single entrypoint for the data and ML pipeline."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

from pipeline_config import (
    CARD_STATS_PATH,
    DATA_DIR,
    DECK_LEADERBOARD_PATH,
    MODEL_LEADERBOARD_PATH,
    MODEL_PATH,
    PROCESSED_BATTLES_PATH,
    RAW_BATTLELOG_PATH,
    SRC_DIR,
)


def run_step(script_name: str, *args: str) -> None:
    script_path = SRC_DIR / script_name
    command = [sys.executable, str(script_path), *args]
    print(f"\n>>> Running {' '.join(command)}")
    completed = subprocess.run(command, cwd=str(SRC_DIR), check=False)
    if completed.returncode != 0:
        raise SystemExit(completed.returncode)


def main() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    MODELS_DIR = Path(__file__).resolve().parent.parent / "models"
    MODELS_DIR.mkdir(parents=True, exist_ok=True)

    run_step("api_scraper.py", "--seed", "#2Y0V8PG,#PP8L02Y", "--max-players", "2000", "--out", str(RAW_BATTLELOG_PATH))
    run_step("preprocess.py", "--in-file", str(RAW_BATTLELOG_PATH), "--out-csv", str(PROCESSED_BATTLES_PATH))
    run_step("aggregate_decks.py", "--in-csv", str(PROCESSED_BATTLES_PATH), "--out-csv", str(DECK_LEADERBOARD_PATH))
    run_step("card_stats.py", "--in-csv", str(PROCESSED_BATTLES_PATH), "--out-csv", str(CARD_STATS_PATH))
    run_step("train_model.py")
    run_step("train_synergy_model.py")
    run_step("simulated_round_robin.py", "--out-csv", str(MODEL_LEADERBOARD_PATH))

    print("\nPipeline completed successfully.")
    print(f"Artifacts written to: {DATA_DIR}")
    print(f"Models written to: {MODELS_DIR}")


if __name__ == "__main__":
    main()
