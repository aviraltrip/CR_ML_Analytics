from fastapi import APIRouter, Depends, HTTPException
from numpy import array as np_array
import numpy as np
import pandas as pd

from app.dependencies import (
    ensure_model_loaded, model, card_vocab, card_elixir,
    load_csv, calculate_aec, calculate_elixir_penalty,
)
from app.models import DeckRequest

router = APIRouter()


@router.post("/evaluate-deck")
def evaluate_deck(request: DeckRequest) -> dict:
    """
    Evaluate a deck: look up in historical leaderboard first,
    then fall back to ML synergy prediction if not found.
    """
    try:
        ensure_model_loaded()

        if len(request.cards) != 8:
            raise HTTPException(status_code=400, detail="Exactly 8 cards are required.")

        levels = request.levels or {}
        for card in request.cards:
            if card not in levels:
                levels[card] = 11

        # Sort cards alphabetically for signature lookup
        search_sig = ",".join(sorted(request.cards))

        # Load leaderboard and check for historical match
        df_leaderboard = load_csv("data/deck_leaderboard.csv")
        deck_match = df_leaderboard[df_leaderboard["deck"] == search_sig]

        result = {
            "found_in_history": False,
            "cards": request.cards,
            "signature": search_sig,
        }

        if len(deck_match) > 0:
            row = deck_match.iloc[0]
            result["found_in_history"] = True
            result["rank"] = int(df_leaderboard[df_leaderboard["deck"] == search_sig].index[0]) + 1
            result["matches_played"] = int(row["matches_played"])
            result["win_rate"] = float(row["win_rate"])
            result["wilson_score"] = float(row["wilson_score"])
            result["wins"] = int(row["wins"])
            result["losses"] = int(row["losses"])
        else:
            # ML Prediction path
            meta_leaderboard_path = "data/model_leaderboard.csv"
            df_model_leaderboard = load_csv(meta_leaderboard_path)
            meta_decks = df_model_leaderboard["deck"].tolist()
            num_meta = len(meta_decks)

            num_cards = len(card_vocab)
            v_sel = np.zeros(num_cards)
            v_sel_lvl = np.zeros(num_cards)
            for card in request.cards:
                if card in card_vocab:
                    idx_v = card_vocab[card]
                    v_sel[idx_v] = 1.0
                    v_sel_lvl[idx_v] = levels.get(card, 11.0)

            X_eval = []
            for opponent_deck in meta_decks:
                v_opp = np.zeros(num_cards)
                v_opp_lvl = np.zeros(num_cards)
                for card in opponent_deck.split(","):
                    if card in card_vocab:
                        idx_o = card_vocab[card]
                        v_opp[idx_o] = 1.0
                        v_opp_lvl[idx_o] = 11.0
                presence_diff = v_sel - v_opp
                level_diff = v_sel_lvl - v_opp_lvl
                X_eval.append(np.concatenate([presence_diff, level_diff, [0.0]]))

            X_eval = np_array(X_eval)
            probs = model.predict_proba(X_eval)[:, 1]

            costs = [card_elixir.get(c, 3.5) for c in request.cards]
            aec = sum(costs) / len(costs)
            penalty = calculate_elixir_penalty(aec)

            pred_win_rate = max(0.0, min(1.0, float(np.mean(probs)) - penalty))

            meta_rates = df_model_leaderboard["simulated_win_rate"].tolist()
            estimated_rank = 1
            for rate in meta_rates:
                if pred_win_rate < rate:
                    estimated_rank += 1
                else:
                    break

            result["found_in_history"] = False
            result["predicted_win_rate"] = round(pred_win_rate, 4)
            result["estimated_rank"] = estimated_rank
            result["total_meta_decks"] = num_meta
            result["avg_elixir_cost"] = round(aec, 2)
            result["elixir_penalty"] = round(penalty, 4)

        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
