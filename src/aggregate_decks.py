"""
aggregate_decks.py — Group battles by deck, calculate win rates and Wilson scores.
"""

import argparse
import math
import os

import pandas as pd

from pipeline_config import DECK_LEADERBOARD_PATH, PROCESSED_BATTLES_PATH


def wilson_score_lower_bound(wins: int, total: int, z: float = 1.96) -> float:
    """
    Computes the Wilson score interval lower bound for a Bernoulli parameter.
    z = 1.96 corresponds to a 95% confidence interval.
    """
    if total == 0:
        return 0.0
    p = wins / total
    denominator = 1 + (z**2) / total
    centre_adjusted_probability = p + (z**2) / (2 * total)
    adjusted_variance = z * math.sqrt((p * (1 - p) + (z**2) / (4 * total)) / total)
    return (centre_adjusted_probability - adjusted_variance) / denominator


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--in-csv",
        default=str(PROCESSED_BATTLES_PATH),
        help="Input path to processed battles CSV",
    )
    parser.add_argument(
        "--out-csv",
        default=str(DECK_LEADERBOARD_PATH),
        help="Output path for deck leaderboard CSV",
    )
    parser.add_argument(
        "--min-matches",
        type=int,
        default=5,
        help="Minimum matches played to be listed on the leaderboard",
    )
    args = parser.parse_args()

    if not os.path.exists(args.in_csv):
        print(f"Error: Input file {args.in_csv} does not exist.")
        return

    print(f"Reading processed battles from {args.in_csv}...")
    df = pd.read_csv(args.in_csv)



    df_p1 = pd.DataFrame({"deck": df["p1_deck"], "won": df["p1_won"]})

    df_p2 = pd.DataFrame({"deck": df["p2_deck"], "won": 1 - df["p1_won"]})

    all_plays = pd.concat([df_p1, df_p2], ignore_index=True)

    print(f"Total deck plays observed: {len(all_plays)}")


    grouped = (
        all_plays.groupby("deck")
        .agg(matches_played=("won", "count"), wins=("won", "sum"))
        .reset_index()
    )

    grouped["losses"] = grouped["matches_played"] - grouped["wins"]
    grouped["win_rate"] = grouped["wins"] / grouped["matches_played"]


    grouped["wilson_score"] = grouped.apply(
        lambda row: wilson_score_lower_bound(
            int(row["wins"]), int(row["matches_played"])
        ),
        axis=1,
    )


    filtered_grouped = grouped[grouped["matches_played"] >= args.min_matches].copy()


    leaderboard = filtered_grouped.sort_values(
        by="wilson_score", ascending=False
    ).reset_index(drop=True)


    out_dir = os.path.dirname(args.out_csv)
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)

    leaderboard.to_csv(args.out_csv, index=False)
    print(
        f"Leaderboard created with {len(leaderboard)} decks (min_matches >= {args.min_matches})."
    )
    print(f"Saved to {args.out_csv}")

    if len(leaderboard) > 0:
        print("\nTop 5 Decks by Wilson Score:")
        for idx, row in leaderboard.head(5).iterrows():
            print(
                f"{idx + 1}. Score: {row['wilson_score']:.3f} | Win Rate: {row['win_rate']:.3f} ({int(row['wins'])}W-{int(row['losses'])}L) | Deck: {row['deck']}"
            )


if __name__ == "__main__":
    main()
