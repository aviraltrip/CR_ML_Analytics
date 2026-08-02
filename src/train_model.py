"""
train_model.py — Train a Logistic Regression model to predict matchup outcomes.
"""

import argparse
import json
import os
import pickle
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, roc_auc_score


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--in-csv", default="../data/processed_battles.csv",
                         help="Input path to processed battles CSV")
    parser.add_argument("--out-dir", default="../models",
                         help="Directory to save the trained model artifacts")
    args = parser.parse_args()

    if not os.path.exists(args.in_csv):
        print(f"Error: Input file {args.in_csv} does not exist.")
        return

    print(f"Reading processed battles from {args.in_csv}...")
    df = pd.read_csv(args.in_csv)

    # 1. Extract card vocabulary
    print("Extracting card vocabulary...")
    all_cards = set()
    for _, row in df.iterrows():
        p1_cards = row["p1_deck"].split(",")
        p2_cards = row["p2_deck"].split(",")
        all_cards.update(p1_cards)
        all_cards.update(p2_cards)
        
    card_list = sorted(list(all_cards))
    card_vocab = {card: idx for idx, card in enumerate(card_list)}
    num_cards = len(card_vocab)
    print(f"Found {num_cards} unique cards in the dataset.")

    # 2. Build feature matrix X and target y
    print("Building feature matrix (X) and target labels (y)...")
    X = []
    y = []

    for _, row in df.iterrows():
        p1_cards = row["p1_deck"].split(",")
        p2_cards = row["p2_deck"].split(",")
        p1_levels = [float(lvl) for lvl in str(row["p1_levels"]).split(",")]
        p2_levels = [float(lvl) for lvl in str(row["p2_levels"]).split(",")]
        p1_won = row["p1_won"]

        # Create presence and level vectors for both players
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

        # Feature vector represents presence difference followed by card level difference
        presence_diff = p1_vec - p2_vec
        level_diff = p1_lvl_vec - p2_lvl_vec
        feature_vec = np.concatenate([presence_diff, level_diff])
        X.append(feature_vec)
        y.append(p1_won)

    X = np.array(X)
    y = np.array(y)

    # 3. Train/test split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    print(f"Train size: {len(X_train)}, Test size: {len(X_test)}")

    # 4. Train Model
    print("Training Logistic Regression model...")
    # L2 regularization (Ridge) is standard to prevent overfitting on smaller datasets
    model = LogisticRegression(C=1.0, max_iter=1000, random_state=42)
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

    # 6. Save artifacts
    os.makedirs(args.out_dir, exist_ok=True)
    
    # Save model
    model_path = os.path.join(args.out_dir, "matchup_predictor.pkl")
    with open(model_path, "wb") as f:
        pickle.dump(model, f)
        
    # Save card vocabulary
    vocab_path = os.path.join(args.out_dir, "card_vocab.json")
    with open(vocab_path, "w", encoding="utf-8") as f:
        json.dump(card_vocab, f, indent=4)

    print(f"Model saved to {model_path}")
    print(f"Vocabulary saved to {vocab_path}")

    # 7. Print card coefficients (weights)
    print("\n=== Feature Coefficients (Impact on Win Probability) ===")
    coefs = model.coef_[0]
    presence_coefs = coefs[:num_cards]
    level_coefs = coefs[num_cards:]

    card_presence_impacts = [(card, presence_coefs[idx]) for card, idx in card_vocab.items()]
    card_presence_impacts = sorted(card_presence_impacts, key=lambda x: x[1], reverse=True)

    card_level_impacts = [(card, level_coefs[idx]) for card, idx in card_vocab.items()]
    card_level_impacts = sorted(card_level_impacts, key=lambda x: x[1], reverse=True)

    print("\nTop 5 Cards increasing Win Probability (Presence difference):")
    for card, weight in card_presence_impacts[:5]:
        print(f" - {card}: weight = {weight:+.4f}")

    print("\nTop 5 Cards decreasing Win Probability (Presence difference):")
    for card, weight in card_presence_impacts[-5:]:
        print(f" - {card}: weight = {weight:+.4f}")

    print("\nTop 5 Cards where Level Difference increases Win Probability the most:")
    for card, weight in card_level_impacts[:5]:
        print(f" - {card}: weight = {weight:+.4f}")


if __name__ == "__main__":
    main()
