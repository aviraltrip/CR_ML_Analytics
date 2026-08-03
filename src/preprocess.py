"""
preprocess.py — Clean, deduplicate, and preprocess Clash Royale battle logs.
"""

import argparse
import json
import os

import pandas as pd

from pipeline_config import PROCESSED_BATTLES_PATH, RAW_BATTLELOG_PATH


def get_canonical_battle(row: dict) -> dict:
    """
    Given a raw battle row, returns a canonical representation where Player 1 (p1)
    is always the player with the lexicographically smaller tag.
    This guarantees that the same battle queried from either player's side is
    deduplicated identically.
    """
    tag_a = row["player_tag"]
    tag_b = row["opponent_tag"]

    if tag_a < tag_b:
        p1_tag, p2_tag = tag_a, tag_b
        p1_trophies, p2_trophies = row["player_trophies"], row["opponent_trophies"]
        p1_crowns, p2_crowns = row["player_crowns"], row["opponent_crowns"]
        p1_deck, p2_deck = row["player_deck"], row["opponent_deck"]
        p1_levels, p2_levels = row["player_deck_levels"], row["opponent_deck_levels"]
        p1_won = row["player_won"]
    else:
        p1_tag, p2_tag = tag_b, tag_a
        p1_trophies, p2_trophies = row["opponent_trophies"], row["player_trophies"]
        p1_crowns, p2_crowns = row["opponent_crowns"], row["player_crowns"]
        p1_deck, p2_deck = row["opponent_deck"], row["player_deck"]
        p1_levels, p2_levels = row["opponent_deck_levels"], row["player_deck_levels"]
        p1_won = not row["player_won"]

    # Decks need canonical representations. Sort cards alphabetically to create signatures.
    p1_deck_sorted = sorted(p1_deck)
    p2_deck_sorted = sorted(p2_deck)

    # We map levels to the sorted cards.
    p1_card_levels_paired = sorted(zip(p1_deck, p1_levels), key=lambda x: x[0])
    p2_card_levels_paired = sorted(zip(p2_deck, p2_levels), key=lambda x: x[0])

    p1_levels_sorted = [x[1] for x in p1_card_levels_paired]
    p2_levels_sorted = [x[1] for x in p2_card_levels_paired]

    return {
        "battle_time": row["battle_time"],
        "game_mode": row["game_mode"],
        "p1_tag": p1_tag,
        "p2_tag": p2_tag,
        "p1_trophies": p1_trophies,
        "p2_trophies": p2_trophies,
        "p1_crowns": p1_crowns,
        "p2_crowns": p2_crowns,
        "p1_deck": ",".join(p1_deck_sorted),
        "p2_deck": ",".join(p2_deck_sorted),
        "p1_levels": ",".join(map(str, p1_levels_sorted)),
        "p2_levels": ",".join(map(str, p2_levels_sorted)),
        "p1_won": int(p1_won),
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--in-file",
        default=str(RAW_BATTLELOG_PATH),
        help="Input path to raw JSONL battle logs",
    )
    parser.add_argument(
        "--out-csv",
        default=str(PROCESSED_BATTLES_PATH),
        help="Output path for processed CSV battles",
    )
    args = parser.parse_args()

    if not os.path.exists(args.in_file):
        print(f"Error: Input file {args.in_file} does not exist.")
        return

    print(f"Reading raw battles from {args.in_file}...")

    battles = []
    skipped_malformed = 0

    with open(args.in_file, "r", encoding="utf-8") as f:
        for line in f:
            if not line.strip():
                continue
            try:
                row = json.loads(line)
                required_fields = [
                    "player_tag",
                    "opponent_tag",
                    "player_deck",
                    "opponent_deck",
                    "battle_time",
                ]
                if any(field not in row or not row[field] for field in required_fields):
                    skipped_malformed += 1
                    continue
                battles.append(row)
            except json.JSONDecodeError:
                skipped_malformed += 1

    print(
        f"Loaded {len(battles)} raw rows. Skipped {skipped_malformed} malformed lines."
    )

    canonical_battles = {}
    for b in battles:
        try:
            canonical = get_canonical_battle(b)
            key = (canonical["battle_time"], canonical["p1_tag"], canonical["p2_tag"])
            canonical_battles[key] = canonical
        except Exception:  # noqa: BLE001
            skipped_malformed += 1

    unique_battles = list(canonical_battles.values())
    print(f"Deduplicated to {len(unique_battles)} unique matches.")

    df = pd.DataFrame(unique_battles)

    out_dir = os.path.dirname(args.out_csv)
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)

    df.to_csv(args.out_csv, index=False)
    print(f"Saved processed battles to {args.out_csv}")


if __name__ == "__main__":
    main()
