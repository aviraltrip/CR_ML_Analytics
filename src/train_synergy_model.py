"""
train_synergy_model.py — Train a Multi-Layer Perceptron (MLP) to predict matchup outcomes using card synergies.
"""

import argparse
import json
import os
import pickle

import numpy as np
import pandas as pd
from sklearn.metrics import accuracy_score, classification_report, roc_auc_score
from sklearn.model_selection import train_test_split
from sklearn.neural_network import MLPClassifier


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--in-csv",
        default="data/processed_battles.csv",
        help="Input path to processed battles CSV",
    )
    parser.add_argument(
        "--out-dir",
        default="models",
        help="Directory to save the trained model artifacts",
    )
    args = parser.parse_args()

    if not os.path.exists(args.in_csv):
        # Try relative to script path if cwd is different
        args.in_csv = os.path.join(os.path.dirname(__file__), "..", args.in_csv)
        if not os.path.exists(args.in_csv):
            print(f"Error: Input file {args.in_csv} does not exist.")
            return

    print(f"Reading processed battles from {args.in_csv}...")
    df = pd.read_csv(args.in_csv)

    # 1. Load or extract card vocabulary
    # We want to match the same vocabulary as the original model
    vocab_path = os.path.join(args.out_dir, "card_vocab.json")
    if os.path.exists(vocab_path):
        print(f"Loading existing card vocabulary from {vocab_path}...")
        with open(vocab_path, "r", encoding="utf-8") as f:
            card_vocab = json.load(f)
    else:
        print("Extracting card vocabulary...")
        all_cards = set()
        for _, row in df.iterrows():
            p1_cards = str(row["p1_deck"]).split(",")
            p2_cards = str(row["p2_deck"]).split(",")
            all_cards.update(p1_cards)
            all_cards.update(p2_cards)
        card_list = sorted(all_cards)
        card_vocab = {card: idx for idx, card in enumerate(card_list)}

    num_cards = len(card_vocab)
    print(f"Using vocabulary with {num_cards} unique cards.")

    # 2. Build feature matrix X (presence and level differences) and target y
    print("Building synergy feature matrix (X) and target labels (y)...")
    X = []
    y = []

    for _, row in df.iterrows():
        p1_cards = str(row["p1_deck"]).split(",")
        p2_cards = str(row["p2_deck"]).split(",")
        p1_levels = [float(lvl) for lvl in str(row["p1_levels"]).split(",")]
        p2_levels = [float(lvl) for lvl in str(row["p2_levels"]).split(",")]
        p1_won = row["p1_won"]

        # Create presence and level vectors
        p1_vec = np.zeros(num_cards)
        p2_vec = np.zeros(num_cards)
        p1_lvl_vec = np.zeros(num_cards)
        p2_lvl_vec = np.zeros(num_cards)

        for card, lvl in zip(p1_cards, p1_levels):
            if card in card_vocab:
                idx = card_vocab[card]
                p1_vec[idx] = 1.0
                p1_lvl_vec[idx] = lvl

        for card, lvl in zip(p2_cards, p2_levels):
            if card in card_vocab:
                idx = card_vocab[card]
                p2_vec[idx] = 1.0
                p2_lvl_vec[idx] = lvl

        # Extract starting trophies and construct scaled trophy difference
        p1_tr = float(
            row.get("p1_trophies", 0) if pd.notna(row.get("p1_trophies")) else 0.0
        )
        p2_tr = float(
            row.get("p2_trophies", 0) if pd.notna(row.get("p2_trophies")) else 0.0
        )
        trophy_diff = (p1_tr - p2_tr) / 1000.0

        # Concatenate presence differences, card level differences, and scaled trophy differences
        presence_diff = p1_vec - p2_vec
        level_diff = p1_lvl_vec - p2_lvl_vec
        feature_vec = np.concatenate([presence_diff, level_diff, [trophy_diff]])
        X.append(feature_vec)
        y.append(p1_won)

    X = np.array(X)
    y = np.array(y)

    # 3. Train/test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"Train size: {len(X_train)}, Test size: {len(X_test)}")

    # 4. Train MLP Model
    print("Training Multi-Layer Perceptron (MLP) Synergy model...")
    # A single hidden layer of 16 units with strong L2 regularization (alpha=1.0)
    # yields the best generalization without overfitting.
    model = MLPClassifier(
        hidden_layer_sizes=(16,),
        activation="relu",
        solver="adam",
        alpha=1.0,
        max_iter=1000,
        random_state=42,
        early_stopping=True,
        validation_fraction=0.1,
    )
    model.fit(X_train, y_train)

    # 5. Evaluate Model
    y_train_pred = model.predict(X_train)
    y_train_pred_proba = model.predict_proba(X_train)[:, 1]
    y_test_pred = model.predict(X_test)
    y_test_pred_proba = model.predict_proba(X_test)[:, 1]

    train_accuracy = accuracy_score(y_train, y_train_pred)
    test_accuracy = accuracy_score(y_test, y_test_pred)
    train_roc_auc = roc_auc_score(y_train, y_train_pred_proba)
    test_roc_auc = roc_auc_score(y_test, y_test_pred_proba)

    print("\n=== Model Performance ===")
    print(f"Train Accuracy: {train_accuracy:.2%}")
    print(f"Test Accuracy:  {test_accuracy:.2%}")
    print(f"Train ROC-AUC:  {train_roc_auc:.3f}")
    print(f"Test ROC-AUC:   {test_roc_auc:.3f}")
    print("\nTest Classification Report:")
    print(classification_report(y_test, y_test_pred))

    # 6. Save synergy model
    os.makedirs(args.out_dir, exist_ok=True)
    model_path = os.path.join(args.out_dir, "synergy_predictor.pkl")
    with open(model_path, "wb") as f:
        pickle.dump(model, f)
    print(f"Synergy model saved to {model_path}")


if __name__ == "__main__":
    main()
