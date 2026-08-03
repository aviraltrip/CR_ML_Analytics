"""Single entrypoint for the data and ML pipeline."""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

from pipeline_config import (
    CARD_STATS_PATH,
    DATA_DIR,
    DECK_LEADERBOARD_PATH,
    DEFAULT_MAX_PLAYERS,
    DEFAULT_MIN_MATCHES,
    DEFAULT_SEED_TAGS,
    DEFAULT_SLEEP_SECONDS,
    MODEL_LEADERBOARD_PATH,
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
    parser = argparse.ArgumentParser(description="Run the Clash Royale data and ML pipeline")
    parser.add_argument("--seed", default=DEFAULT_SEED_TAGS, help="Comma-separated seed player tags")
    parser.add_argument("--max-players", type=int, default=DEFAULT_MAX_PLAYERS, help="Number of players to visit")
    parser.add_argument("--sleep", type=float, default=DEFAULT_SLEEP_SECONDS, help="Seconds to wait between requests")
    parser.add_argument("--min-matches", type=int, default=DEFAULT_MIN_MATCHES, help="Minimum matches for leaderboard")
    parser.add_argument("--skip-scrape", action="store_true", help="Skip scraping and use existing raw data")
    args = parser.parse_args()

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    MODELS_DIR = Path(__file__).resolve().parent.parent / "models"
    MODELS_DIR.mkdir(parents=True, exist_ok=True)

    if not args.skip_scrape:
        run_step("api_scraper.py", "--seed", args.seed, "--max-players", str(args.max_players), "--sleep", str(args.sleep), "--out", str(RAW_BATTLELOG_PATH))

    run_step("preprocess.py", "--in-file", str(RAW_BATTLELOG_PATH), "--out-csv", str(PROCESSED_BATTLES_PATH))
    run_step("aggregate_decks.py", "--in-csv", str(PROCESSED_BATTLES_PATH), "--out-csv", str(DECK_LEADERBOARD_PATH), "--min-matches", str(args.min_matches))
    run_step("card_stats.py", "--in-csv", str(PROCESSED_BATTLES_PATH), "--out-csv", str(CARD_STATS_PATH))
    run_step("train_model.py")
    run_step("train_synergy_model.py")
    run_step("simulated_round_robin.py", "--out-csv", str(MODEL_LEADERBOARD_PATH))

    print("\nPipeline completed successfully.")
    print(f"Artifacts written to: {DATA_DIR}")
    print(f"Models written to: {MODELS_DIR}")


if __name__ == "__main__":
    main()
