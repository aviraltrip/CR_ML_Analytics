"""
card_stats.py — Calculate popularity, win rate, and overrated/underrated status for each card.
"""

import argparse
import os

import pandas as pd


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--in-csv",
        default="../data/processed_battles.csv",
        help="Input path to processed battles CSV",
    )
    parser.add_argument(
        "--out-csv",
        default="../data/card_stats.csv",
        help="Output path for card statistics CSV",
    )
    args = parser.parse_args()

    if not os.path.exists(args.in_csv):
        print(f"Error: Input file {args.in_csv} does not exist.")
        return

    print(f"Reading processed battles from {args.in_csv}...")
    df = pd.read_csv(args.in_csv)

    # Flatten the dataset to card level.
    # We create a list of dicts: each containing {"card": card_name, "won": 1/0}
    card_records = []

    # Process P1 plays
    for _, row in df.iterrows():
        p1_won = row["p1_won"]
        p2_won = 1 - p1_won

        p1_cards = row["p1_deck"].split(",")
        p2_cards = row["p2_deck"].split(",")

        for c in p1_cards:
            card_records.append({"card": c, "won": p1_won})
        for c in p2_cards:
            card_records.append({"card": c, "won": p2_won})

    card_df = pd.DataFrame(card_records)
    total_deck_plays = len(df) * 2  # Each match has 2 players

    print(
        f"Aggregating stats for {len(card_df)} card instances across {total_deck_plays} deck plays..."
    )

    # Group by card and aggregate
    stats = (
        card_df.groupby("card")
        .agg(matches_played=("won", "count"), wins=("won", "sum"))
        .reset_index()
    )

    stats["losses"] = stats["matches_played"] - stats["wins"]
    stats["popularity"] = stats["matches_played"] / total_deck_plays
    stats["win_rate"] = stats["wins"] / stats["matches_played"]

    # Average win rate is exactly 50% since every match has 1 winner and 1 loser
    stats["win_rate_diff"] = stats["win_rate"] - 0.50

    # Classify cards as Overrated/Underrated
    # Median popularity will be our threshold for high/low presence
    median_popularity = stats["popularity"].median()
    print(f"Median card popularity: {median_popularity:.3%}")

    def classify_card(row):
        is_popular = row["popularity"] >= median_popularity
        win_diff = row["win_rate_diff"]

        if is_popular and win_diff < 0:
            return "Overrated"  # Commonly played, but wins less than 50%
        elif not is_popular and win_diff > 0:
            return "Underrated"  # Rarely played, but wins more than 50%
        elif is_popular and win_diff >= 0:
            return "Strong/Meta"  # Commonly played and wins well
        else:
            return "Weak/Niche"  # Rarely played and wins poorly

    stats["status"] = stats.apply(classify_card, axis=1)

    # Sort by win rate differential descending
    stats = stats.sort_values(by="win_rate_diff", ascending=False).reset_index(
        drop=True
    )

    # Ensure output directory exists
    out_dir = os.path.dirname(args.out_csv)
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)

    stats.to_csv(args.out_csv, index=False)
    print(f"Card stats saved to {args.out_csv}")

    # Print some quick highlights
    print("\nTop 5 Underrated Cards (Low popularity, high win rate):")
    underrated = stats[stats["status"] == "Underrated"].head(5)
    for _, row in underrated.iterrows():
        print(
            f" - {row['card']}: Win Rate = {row['win_rate']:.1%}, Popularity = {row['popularity']:.1%}"
        )

    print("\nTop 5 Overrated Cards (High popularity, low win rate):")
    overrated = stats[stats["status"] == "Overrated"].tail(
        5
    )  # Sort is descending, so overrated (lowest win rates) are at the bottom
    # Let's sort overrated by win_rate ascending
    overrated = stats[stats["status"] == "Overrated"].sort_values("win_rate").head(5)
    for _, row in overrated.iterrows():
        print(
            f" - {row['card']}: Win Rate = {row['win_rate']:.1%}, Popularity = {row['popularity']:.1%}"
        )


if __name__ == "__main__":
    main()
