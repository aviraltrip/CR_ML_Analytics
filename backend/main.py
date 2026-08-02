"""
FastAPI backend for Clash Royale Deck Analytics.
Wraps existing ML logic in REST endpoints without modifying any prediction,
preprocessing, or inference functions.
"""

import json
import os
import pickle
from typing import Optional

import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ---------------------------------------------------------------------------
# App definition (must come before decorators that reference it)
# ---------------------------------------------------------------------------
app = FastAPI(
    title="Clash Royale Deck Analytics API",
    description="REST API for Clash Royale deck analysis, matchup prediction, and deck evaluation.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, "models")
DATA_DIR = os.path.join(BASE_DIR, "data")

# ---------------------------------------------------------------------------
# Load ML model and vocab (cached at startup)
# ---------------------------------------------------------------------------
model = None
card_vocab = None
card_elixir = {}


def load_model_and_vocab():
    global model, card_vocab
    model_path = os.path.join(MODELS_DIR, "synergy_predictor.pkl")
    vocab_path = os.path.join(MODELS_DIR, "card_vocab.json")
    if os.path.exists(model_path) and os.path.exists(vocab_path):
        with open(model_path, "rb") as f:
            model = pickle.load(f)
        with open(vocab_path, "r", encoding="utf-8") as f:
            card_vocab = json.load(f)


def load_card_elixir():
    global card_elixir
    elixir_path = os.path.join(MODELS_DIR, "card_elixir.json")
    if os.path.exists(elixir_path):
        with open(elixir_path, "r", encoding="utf-8") as f:
            card_elixir = json.load(f)


@app.on_event("startup")
def startup_event():
    load_model_and_vocab()
    load_card_elixir()


# ---------------------------------------------------------------------------
# Helper functions (preserved exactly from streamlit_app.py)
# ---------------------------------------------------------------------------
def calculate_aec(deck_cards, card_elixir_map):
    costs = [card_elixir_map.get(c, 3.5) for c in deck_cards]
    return sum(costs) / len(costs)


def calculate_elixir_penalty(aec):
    if 2.8 <= aec <= 4.2:
        return 0.0
    elif aec < 2.8:
        return ((2.8 - aec) ** 2) * 0.15
    else:
        return ((aec - 4.2) ** 2) * 0.15


# ---------------------------------------------------------------------------
# Pydantic models for request bodies
# ---------------------------------------------------------------------------
class DeckRequest(BaseModel):
    cards: list[str]
    levels: Optional[dict[str, int]] = None


class MatchupRequest(BaseModel):
    deck1_cards: list[str]
    deck1_levels: Optional[dict[str, int]] = None
    deck1_trophies: int = 11500
    deck2_cards: list[str]
    deck2_levels: Optional[dict[str, int]] = None
    deck2_trophies: int = 11500


class SwapRequest(BaseModel):
    cards: list[str]
    levels: Optional[dict[str, int]] = None


# ---------------------------------------------------------------------------
# API Routes
# ---------------------------------------------------------------------------
@app.get("/health")
def health():
    return {
        "status": "ok",
        "model_loaded": model is not None,
        "vocab_loaded": card_vocab is not None,
    }


@app.get("/data")
def get_data(min_games: int = 5):
    """Load all data CSVs and return them."""
    try:
        processed_path = os.path.join(DATA_DIR, "processed_battles.csv")
        leaderboard_path = os.path.join(DATA_DIR, "deck_leaderboard.csv")
        card_stats_path = os.path.join(DATA_DIR, "card_stats.csv")
        model_leaderboard_path = os.path.join(DATA_DIR, "model_leaderboard.csv")

        if not all(
            os.path.exists(p) for p in [processed_path, leaderboard_path, card_stats_path]
        ):
            raise HTTPException(
                status_code=404,
                detail="Data files are missing. Run the data pipeline first.",
            )

        df_battles = pd.read_csv(processed_path)
        df_leaderboard = pd.read_csv(leaderboard_path)
        df_card_stats = pd.read_csv(card_stats_path)

        df_model_leaderboard = None
        if os.path.exists(model_leaderboard_path):
            df_model_leaderboard = pd.read_csv(model_leaderboard_path)

        # Filter leaderboard by min_games
        df_leaderboard_filtered = (
            df_leaderboard[df_leaderboard["matches_played"] >= min_games]
            .copy()
            .reset_index(drop=True)
        )
        df_leaderboard_filtered.insert(0, "Rank", df_leaderboard_filtered.index + 1)

        return {
            "battles_count": len(df_battles),
            "leaderboard": df_leaderboard_filtered.to_dict(orient="records"),
            "card_stats": df_card_stats.to_dict(orient="records"),
            "model_leaderboard": (
                df_model_leaderboard.to_dict(orient="records")
                if df_model_leaderboard is not None
                else None
            ),
            "card_elixir": card_elixir,
            "model_loaded": model is not None,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/leaderboard")
def get_leaderboard(min_games: int = 5):
    """Return filtered deck leaderboard."""
    try:
        leaderboard_path = os.path.join(DATA_DIR, "deck_leaderboard.csv")
        if not os.path.exists(leaderboard_path):
            raise HTTPException(status_code=404, detail="Leaderboard data not found.")

        df = pd.read_csv(leaderboard_path)
        df_filtered = (
            df[df["matches_played"] >= min_games]
            .copy()
            .reset_index(drop=True)
        )
        df_filtered.insert(0, "Rank", df_filtered.index + 1)

        return {
            "leaderboard": df_filtered.to_dict(orient="records"),
            "count": len(df_filtered),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/card-stats")
def get_card_stats():
    """Return card statistics for the Overrated vs Underrated chart."""
    try:
        card_stats_path = os.path.join(DATA_DIR, "card_stats.csv")
        if not os.path.exists(card_stats_path):
            raise HTTPException(status_code=404, detail="Card stats not found.")

        df = pd.read_csv(card_stats_path)
        return {"card_stats": df.to_dict(orient="records")}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/model-leaderboard")
def get_model_leaderboard(min_games: int = 5):
    """Return ML-predicted leaderboard."""
    try:
        model_lb_path = os.path.join(DATA_DIR, "model_leaderboard.csv")
        if not os.path.exists(model_lb_path):
            raise HTTPException(
                status_code=404,
                detail="Model leaderboard not found. Run simulated_round_robin.py first.",
            )

        df = pd.read_csv(model_lb_path)
        df_filtered = (
            df[df["matches_played"] >= min_games]
            .copy()
            .reset_index(drop=True)
        )
        df_filtered.insert(0, "Predictive_Rank", df_filtered.index + 1)

        return {
            "model_leaderboard": df_filtered.to_dict(orient="records"),
            "count": len(df_filtered),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/evaluate-deck")
def evaluate_deck(request: DeckRequest):
    """
    Evaluate a deck: look up in historical leaderboard first,
    then fall back to ML synergy prediction if not found.
    Preserves all logic from streamlit_app.py Tab 3 (Deck Evaluator).
    """
    try:
        if model is None or card_vocab is None:
            raise HTTPException(status_code=503, detail="ML model not loaded.")

        if len(request.cards) != 8:
            raise HTTPException(status_code=400, detail="Exactly 8 cards are required.")

        # Sort cards alphabetically for signature lookup
        search_sig = ",".join(sorted(request.cards))

        # Load leaderboard
        leaderboard_path = os.path.join(DATA_DIR, "deck_leaderboard.csv")
        df_leaderboard = pd.read_csv(leaderboard_path)

        deck_match = df_leaderboard[df_leaderboard["deck"] == search_sig]

        result = {
            "found_in_history": False,
            "cards": request.cards,
            "signature": search_sig,
        }

        if len(deck_match) > 0:
            row = deck_match.iloc[0]
            result["found_in_history"] = True
            result["rank"] = int(
                df_leaderboard[df_leaderboard["deck"] == search_sig].index[0]
            ) + 1
            result["matches_played"] = int(row["matches_played"])
            result["win_rate"] = float(row["win_rate"])
            result["wilson_score"] = float(row["wilson_score"])
            result["wins"] = int(row["wins"])
            result["losses"] = int(row["losses"])
        else:
            # ML Prediction path
            levels = request.levels or {}
            for card in request.cards:
                if card not in levels:
                    levels[card] = 11

            # Build feature vectors against all meta decks
            meta_leaderboard_path = os.path.join(DATA_DIR, "model_leaderboard.csv")
            if not os.path.exists(meta_leaderboard_path):
                raise HTTPException(
                    status_code=404,
                    detail="Model leaderboard not found for ML prediction.",
                )

            df_model_leaderboard = pd.read_csv(meta_leaderboard_path)
            meta_decks = df_model_leaderboard["deck"].tolist()
            num_meta = len(meta_decks)

            # Multi-hot vector and level vector for selected deck
            v_sel = np.zeros(len(card_vocab))
            v_sel_lvl = np.zeros(len(card_vocab))
            for card in request.cards:
                if card in card_vocab:
                    idx_v = card_vocab[card]
                    v_sel[idx_v] = 1.0
                    v_sel_lvl[idx_v] = levels.get(card, 11.0)

            X_eval = []
            for opponent_deck in meta_decks:
                v_opp = np.zeros(len(card_vocab))
                v_opp_lvl = np.zeros(len(card_vocab))
                for card in opponent_deck.split(","):
                    if card in card_vocab:
                        idx_o = card_vocab[card]
                        v_opp[idx_o] = 1.0
                        v_opp_lvl[idx_o] = 11.0

                presence_diff = v_sel - v_opp
                level_diff = v_sel_lvl - v_opp_lvl
                X_eval.append(np.concatenate([presence_diff, level_diff, [0.0]]))

            X_eval = np.array(X_eval)
            probs = model.predict_proba(X_eval)[:, 1]

            # Calculate AEC and elixir penalty
            costs = [card_elixir.get(c, 3.5) for c in request.cards]
            aec = sum(costs) / len(costs)
            penalty = calculate_elixir_penalty(aec)

            pred_win_rate = max(0.0, min(1.0, float(np.mean(probs)) - penalty))

            # Estimate Rank
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


@app.post("/predict-matchup")
def predict_matchup(request: MatchupRequest):
    """
    Predict the win probability between two decks using the trained MLP synergy model.
    Also provides LOO-based card contribution analysis.
    Preserves all logic from streamlit_app.py Tab 4 (Matchup Predictor).
    """
    try:
        if model is None or card_vocab is None:
            raise HTTPException(status_code=503, detail="ML model not loaded.")

        if len(request.deck1_cards) != 8 or len(request.deck2_cards) != 8:
            raise HTTPException(
                status_code=400,
                detail="Both decks must have exactly 8 cards.",
            )

        deck1_levels = request.deck1_levels or {}
        deck2_levels = request.deck2_levels or {}

        # Build feature vector for the matchup (exactly as in streamlit_app.py)
        num_cards = len(card_vocab)
        v1 = np.zeros(num_cards)
        v2 = np.zeros(num_cards)
        v1_lvl = np.zeros(num_cards)
        v2_lvl = np.zeros(num_cards)

        for c in request.deck1_cards:
            if c in card_vocab:
                idx = card_vocab[c]
                v1[idx] = 1.0
                v1_lvl[idx] = deck1_levels.get(c, 11.0)
        for c in request.deck2_cards:
            if c in card_vocab:
                idx = card_vocab[c]
                v2[idx] = 1.0
                v2_lvl[idx] = deck2_levels.get(c, 11.0)

        presence_diff = v1 - v2
        level_diff = v1_lvl - v2_lvl
        trophy_diff = (request.deck1_trophies - request.deck2_trophies) / 1000.0
        x_input = np.concatenate([presence_diff, level_diff, [trophy_diff]]).reshape(1, -1)

        # Predict
        prob = model.predict_proba(x_input)[0][1]

        # LOO Contribution Analysis (exactly as in streamlit_app.py)
        contribs = []
        base_prob = float(prob)

        # Evaluate impact of Your cards (removing 1 card)
        for c in request.deck1_cards:
            v1_mod = np.zeros(num_cards)
            v1_lvl_mod = np.zeros(num_cards)
            v1_mod[card_vocab[c]] = 0.0
            v1_lvl_mod[card_vocab[c]] = 0.0

            presence_diff_mod = v1_mod - v2
            level_diff_mod = v1_lvl_mod - v2_lvl
            x_mod = np.concatenate([presence_diff_mod, level_diff_mod, [trophy_diff]]).reshape(
                1, -1
            )

            prob_mod = model.predict_proba(x_mod)[0][1]
            impact = base_prob - float(prob_mod)
            contribs.append(
                {
                    "card": c,
                    "owner": "You (Advantage)" if impact >= 0 else "You (Disadvantage)",
                    "impact": round(impact, 4),
                }
            )

        # Evaluate impact of Opponent cards (removing 1 card)
        for c in request.deck2_cards:
            v2_mod = np.zeros(num_cards)
            v2_lvl_mod = np.zeros(num_cards)
            v2_mod[card_vocab[c]] = 0.0
            v2_lvl_mod[card_vocab[c]] = 0.0

            presence_diff_mod = v1 - v2_mod
            level_diff_mod = v1_lvl - v2_lvl_mod
            x_mod = np.concatenate([presence_diff_mod, level_diff_mod, [trophy_diff]]).reshape(
                1, -1
            )

            prob_mod = model.predict_proba(x_mod)[0][1]
            impact = float(prob_mod) - base_prob
            contribs.append(
                {
                    "card": c,
                    "owner": "Opponent (Weakness)" if impact >= 0 else "Opponent (Threat)",
                    "impact": round(impact, 4),
                }
            )

        # Sort contributions
        contribs_sorted = sorted(contribs, key=lambda x: x["impact"], reverse=True)

        advantages = [c for c in contribs_sorted if c["impact"] > 0][:3]
        disadvantages = sorted([c for c in contribs if c["impact"] < 0], key=lambda x: x["impact"])[:3]

        return {
            "win_probability": round(float(prob), 4),
            "deck1_cards": request.deck1_cards,
            "deck2_cards": request.deck2_cards,
            "verdict": (
                "Favorable"
                if prob > 0.55
                else ("Unfavorable" if prob < 0.45 else "Even")
            ),
            "advantages": advantages,
            "disadvantages": disadvantages,
            "contributions": contribs_sorted,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/find-swaps")
def find_swaps(request: SwapRequest):
    """
    Auto-suggest card swaps using Leave-One-Out (LOO) synergy analysis.
    Identifies the weakest card and suggests top 3 replacements.
    Preserves all logic from streamlit_app.py Tab 3 (Auto-Suggestions).
    """
    try:
        if model is None or card_vocab is None:
            raise HTTPException(status_code=503, detail="ML model not loaded.")

        if len(request.cards) != 8:
            raise HTTPException(status_code=400, detail="Exactly 8 cards are required.")

        levels = request.levels or {}
        for card in request.cards:
            if card not in levels:
                levels[card] = 11

        # Load model leaderboard for meta decks
        meta_leaderboard_path = os.path.join(DATA_DIR, "model_leaderboard.csv")
        if not os.path.exists(meta_leaderboard_path):
            raise HTTPException(
                status_code=404,
                detail="Model leaderboard not found for swap analysis.",
            )

        df_model_leaderboard = pd.read_csv(meta_leaderboard_path)
        meta_decks = df_model_leaderboard["deck"].tolist()

        # Pre-encode meta opponent decks
        opp_vectors = []
        for opp in meta_decks:
            v_opp = np.zeros(len(card_vocab))
            v_opp_lvl = np.zeros(len(card_vocab))
            for card in opp.split(","):
                if card in card_vocab:
                    idx_o = card_vocab[card]
                    v_opp[idx_o] = 1.0
                    v_opp_lvl[idx_o] = 11.0
            opp_vectors.append((v_opp, v_opp_lvl))

        # Build base deck vectors
        v_base = np.zeros(len(card_vocab))
        v_base_lvl = np.zeros(len(card_vocab))
        for c in request.cards:
            if c in card_vocab:
                idx = card_vocab[c]
                v_base[idx] = 1.0
                v_base_lvl[idx] = levels.get(c, 11.0)

        # Compute base win rate
        X_base = []
        for v_opp, v_opp_lvl in opp_vectors:
            presence_diff = v_base - v_opp
            level_diff = v_base_lvl - v_opp_lvl
            X_base.append(np.concatenate([presence_diff, level_diff, [0.0]]))
        X_base = np.array(X_base)
        base_wr_raw = float(np.mean(model.predict_proba(X_base)[:, 1]))

        # Apply elixir penalty to base deck
        aec_base = calculate_aec(request.cards, card_elixir)
        penalty_base = calculate_elixir_penalty(aec_base)
        base_wr = max(0.0, min(1.0, base_wr_raw - penalty_base))

        # Run LOO to find the weakest card
        loo_impacts = {}
        for c in request.cards:
            v_mod = v_base.copy()
            v_mod_lvl = v_base_lvl.copy()
            if c in card_vocab:
                v_mod[card_vocab[c]] = 0.0
                v_mod_lvl[card_vocab[c]] = 0.0

            X_mod = []
            for v_opp, v_opp_lvl in opp_vectors:
                presence_diff = v_mod - v_opp
                level_diff = v_mod_lvl - v_opp_lvl
                X_mod.append(np.concatenate([presence_diff, level_diff, [0.0]]))
            X_mod = np.array(X_mod)
            mod_wr_raw = float(np.mean(model.predict_proba(X_mod)[:, 1]))
            loo_impacts[c] = base_wr_raw - mod_wr_raw

        # Weakest card has the lowest impact on win rate
        weakest_card = min(loo_impacts, key=loo_impacts.get)
        weakest_impact = loo_impacts[weakest_card]

        # Try alternative cards to replace weakest_card
        all_cards = list(card_vocab.keys())
        candidates = [c for c in all_cards if c not in request.cards]

        results = []
        for cand in candidates:
            v_mut = v_base.copy()
            v_mut_lvl = v_base_lvl.copy()

            # Remove weakest card
            v_mut[card_vocab[weakest_card]] = 0.0
            v_mut_lvl[card_vocab[weakest_card]] = 0.0

            # Add candidate card
            v_mut[card_vocab[cand]] = 1.0
            v_mut_lvl[card_vocab[cand]] = 11.0

            # Evaluate mutated deck
            X_mut = []
            for v_opp, v_opp_lvl in opp_vectors:
                presence_diff = v_mut - v_opp
                level_diff = v_mut_lvl - v_opp_lvl
                X_mut.append(np.concatenate([presence_diff, level_diff, [0.0]]))
            X_mut = np.array(X_mut)
            mut_wr_raw = float(np.mean(model.predict_proba(X_mut)[:, 1]))

            # Apply elixir penalty
            cand_deck_cards = [c for c in request.cards if c != weakest_card] + [cand]
            aec = calculate_aec(cand_deck_cards, card_elixir)
            penalty = calculate_elixir_penalty(aec)
            final_mut_wr = max(0.0, min(1.0, mut_wr_raw - penalty))

            results.append(
                {
                    "candidate": cand,
                    "simulated_win_rate": round(final_mut_wr, 4),
                    "elixir_cost": round(aec, 2),
                    "improvement": round(final_mut_wr - base_wr, 4),
                }
            )

        # Sort by improvement descending
        results.sort(key=lambda x: x["improvement"], reverse=True)

        return {
            "weakest_card": weakest_card,
            "weakest_impact": round(weakest_impact, 4),
            "base_win_rate": round(base_wr, 4),
            "top_swaps": results[:3],
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
