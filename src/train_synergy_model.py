"""
train_synergy_model.py — Train a Multi-Layer Perceptron (MLP) to predict matchup outcomes using card synergies.
"""

import argparse
import json
import os
import pickle
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.neural_network import MLPClassifier
from sklearn.metrics import accuracy_score, classification_report, roc_auc_score


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--in-csv", default="data/processed_battles.csv",
                         help="Input path to processed battles CSV")
    parser.add_argument("--out-dir", default="models",
                         help="Directory to save the trained model artifacts")
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
        card_list = sorted(list(all_cards))
        card_vocab = {card: idx for idx, card in enumerate(card_list)}
        
    num_cards = len(card_vocab)
    print(f"Using vocabulary with {num_cards} unique cards.")

    # 2. Build feature matrix X (concatenated decks for synergy) and target y
    print("Building synergy feature matrix (X) and target labels (y)...")
    X = []
    y = []

    for _, row in df.iterrows():
        p1_cards = str(row["p1_deck"]).split(",")
        p2_cards = str(row["p2_deck"]).split(",")
        p1_won = row["p1_won"]

        # Create multi-hot vectors
        p1_vec = np.zeros(num_cards)
        p2_vec = np.zeros(num_cards)

        for card in p1_cards:
            if card in card_vocab:
                p1_vec[card_vocab[card]] = 1.0

        for card in p2_cards:
            if card in card_vocab:
                p2_vec[card_vocab[card]] = 1.0

        # Concatenate P1 and P2 presence to allow the neural net to learn counter combinations
        feature_vec = np.concatenate([p1_vec, p2_vec])
        X.append(feature_vec)
        y.append(p1_won)

    X = np.array(X)
    y = np.array(y)

    # 3. Train/test split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    print(f"Train size: {len(X_train)}, Test size: {len(X_test)}")

    # 4. Train MLP Model
    print("Training Multi-Layer Perceptron (MLP) Synergy model...")
    # Hidden layers (64, 32) captures combination features without overfitting easily.
    # L2 regularization (alpha=0.01) helps generalize.
    model = MLPClassifier(
        hidden_layer_sizes=(64, 32),
        activation="relu",
        solver="adam",
        alpha=0.01,
        max_iter=500,
        random_state=42,
        early_stopping=True,
        validation_fraction=0.1
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
