"""
simulated_round_robin.py — Use the trained synergy model to run a simulated round-robin tournament
between top competitive decks and rank them by expected win rate.
"""

import argparse
import json
import os
import pickle

import numpy as np
import pandas as pd


def calculate_aec(deck_str: str, card_elixir: dict) -> float:
    cards = deck_str.split(",")
    costs = [card_elixir.get(c, 3.5) for c in cards]
    return sum(costs) / len(costs)


def calculate_elixir_penalty(aec: float) -> float:
    if 2.8 <= aec <= 4.2:
        return 0.0
    elif aec < 2.8:
        return ((2.8 - aec) ** 2) * 0.15
    else:
        return ((aec - 4.2) ** 2) * 0.15


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--in-leaderboard",
        default="data/deck_leaderboard.csv",
        help="Path to historical deck leaderboard CSV",
    )
    parser.add_argument(
        "--out-csv",
        default="data/model_leaderboard.csv",
        help="Output path for simulated predictive leaderboard CSV",
    )
    parser.add_argument(
        "--model-path",
        default="models/synergy_predictor.pkl",
        help="Path to trained synergy model",
    )
    parser.add_argument(
        "--vocab-path",
        default="models/card_vocab.json",
        help="Path to card vocabulary JSON",
    )
    parser.add_argument(
        "--num-decks",
        type=int,
        default=200,
        help="Number of top decks to include in the tournament",
    )
    args = parser.parse_args()


    for path_attr in ["in_leaderboard", "model_path", "vocab_path"]:
        path_val = getattr(args, path_attr)
        if not os.path.exists(path_val):

            alt_path = os.path.join(os.path.dirname(__file__), "..", path_val)
            if os.path.exists(alt_path):
                setattr(args, path_attr, alt_path)
            else:
                print(f"Error: {path_attr} file {path_val} not found.")
                return

    print(f"Loading decks from {args.in_leaderboard}...")
    df_leaderboard = pd.read_csv(args.in_leaderboard)






    df_popular = df_leaderboard.sort_values(by="matches_played", ascending=False).head(100).copy()
    

    popular_decks = set(df_popular["deck"])
    df_remaining = df_leaderboard[~df_leaderboard["deck"].isin(popular_decks)]
    

    df_remaining_filtered = df_remaining[df_remaining["matches_played"] >= 15]
    df_elite = df_remaining_filtered.sort_values(by="wilson_score", ascending=False).head(100).copy()
    
    df_meta = pd.concat([df_popular, df_elite], ignore_index=True)
    decks = df_meta["deck"].tolist()
    num_decks = len(decks)
    print(f"Selected {len(df_popular)} popular decks and {len(df_elite)} elite performing decks.")
    print(f"Running tournament with {num_decks} unique decks...")

    print(f"Loading synergy model from {args.model_path}...")
    with open(args.model_path, "rb") as f:
        model = pickle.load(f)

    print(f"Loading card vocabulary from {args.vocab_path}...")
    with open(args.vocab_path, "r", encoding="utf-8") as f:
        card_vocab = json.load(f)
    num_cards = len(card_vocab)


    elixir_path = os.path.join(os.path.dirname(args.vocab_path), "card_elixir.json")
    if os.path.exists(elixir_path):
        print(f"Loading card elixir database from {elixir_path}...")
        with open(elixir_path, "r", encoding="utf-8") as f:
            card_elixir = json.load(f)
    else:
        print(
            "Warning: card_elixir.json not found. Elixir regularization will default all cards to 3.5 cost."
        )
        card_elixir = {}


    print("Generating simulated round-robin matchups...")
    X_matchups = []
    matchup_pairs = []

    for i in range(num_decks):
        for j in range(num_decks):
            if i == j:
                continue


            v_i = np.zeros(num_cards)
            v_i_lvl = np.zeros(num_cards)
            for card in decks[i].split(","):
                if card in card_vocab:
                    v_i[card_vocab[card]] = 1.0
                    v_i_lvl[card_vocab[card]] = 11.0


            v_j = np.zeros(num_cards)
            v_j_lvl = np.zeros(num_cards)
            for card in decks[j].split(","):
                if card in card_vocab:
                    v_j[card_vocab[card]] = 1.0
                    v_j_lvl[card_vocab[card]] = 11.0


            presence_diff = v_i - v_j
            level_diff = v_i_lvl - v_j_lvl
            X_matchups.append(np.concatenate([presence_diff, level_diff, [0.0]]))
            matchup_pairs.append((i, j))

    X_matchups = np.array(X_matchups)
    print(f"Total simulated matches: {len(X_matchups):,}")


    print("Predicting match outcomes...")
    probs = model.predict_proba(X_matchups)[:, 1]


    win_sums = np.zeros(num_decks)
    counts = np.zeros(num_decks)

    for (i, j), prob in zip(matchup_pairs, probs):
        win_sums[i] += prob
        counts[i] += 1

    expected_win_rates = win_sums / counts


    penalized_win_rates = []
    elixir_costs = []
    for idx, deck_str in enumerate(decks):
        aec = calculate_aec(deck_str, card_elixir)
        penalty = calculate_elixir_penalty(aec)
        penalized_wr = max(0.0, min(1.0, expected_win_rates[idx] - penalty))
        penalized_win_rates.append(penalized_wr)
        elixir_costs.append(aec)


    df_meta["simulated_win_rate"] = penalized_win_rates
    df_meta["elixir_cost"] = elixir_costs


    df_predicted_leaderboard = df_meta.sort_values(
        by="simulated_win_rate", ascending=False
    ).reset_index(drop=True)
    df_predicted_leaderboard.insert(
        0, "Predictive_Rank", df_predicted_leaderboard.index + 1
    )


    out_dir = os.path.dirname(args.out_csv)
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)
    df_predicted_leaderboard.to_csv(args.out_csv, index=False)

    print(f"Simulated leaderboard saved to {args.out_csv}")

    print("\nTop 5 ML-Predicted Decks (Expected Win Rate against the Meta):")
    for idx, row in df_predicted_leaderboard.head(5).iterrows():
        print(
            f"{row['Predictive_Rank']}. Win Rate: {row['simulated_win_rate']:.2%} | Deck: {row['deck']}"
        )


if __name__ == "__main__":
    main()
