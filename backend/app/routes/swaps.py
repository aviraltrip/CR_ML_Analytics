from fastapi import APIRouter, Depends, HTTPException
import numpy as np

from app.dependencies import (
    ensure_model_loaded, model, card_vocab, card_elixir,
    load_csv, calculate_aec, calculate_elixir_penalty,
)
from app.models import SwapRequest

router = APIRouter()


@router.post("/find-swaps")
def find_swaps(request: SwapRequest) -> dict:
    """
    Auto-suggest card swaps using Leave-One-Out (LOO) synergy analysis.
    Identifies the weakest card and suggests top 3 replacements.
    """
    try:
        ensure_model_loaded()

        if len(request.cards) != 8:
            raise HTTPException(status_code=400, detail="Exactly 8 cards are required.")

        levels = request.levels or {}
        for card in request.cards:
            if card not in levels:
                levels[card] = 11

        df_model_leaderboard = load_csv("data/model_leaderboard.csv")
        meta_decks = df_model_leaderboard["deck"].tolist()

        num_cards = len(card_vocab)

        # Pre-encode meta opponent decks
        opp_vectors = []
        for opp in meta_decks:
            v_opp = np.zeros(num_cards)
            v_opp_lvl = np.zeros(num_cards)
            for card in opp.split(","):
                if card in card_vocab:
                    idx_o = card_vocab[card]
                    v_opp[idx_o] = 1.0
                    v_opp_lvl[idx_o] = 11.0
            opp_vectors.append((v_opp, v_opp_lvl))

        # Build base deck vectors
        v_base = np.zeros(num_cards)
        v_base_lvl = np.zeros(num_cards)
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

        weakest_card = min(loo_impacts, key=loo_impacts.get)
        weakest_impact = loo_impacts[weakest_card]

        # Try alternative cards to replace weakest_card
        all_cards = list(card_vocab.keys())
        candidates = [c for c in all_cards if c not in request.cards]

        results = []
        for cand in candidates:
            v_mut = v_base.copy()
            v_mut_lvl = v_base_lvl.copy()
            v_mut[card_vocab[weakest_card]] = 0.0
            v_mut_lvl[card_vocab[weakest_card]] = 0.0
            v_mut[card_vocab[cand]] = 1.0
            v_mut_lvl[card_vocab[cand]] = 11.0

            X_mut = []
            for v_opp, v_opp_lvl in opp_vectors:
                presence_diff = v_mut - v_opp
                level_diff = v_mut_lvl - v_opp_lvl
                X_mut.append(np.concatenate([presence_diff, level_diff, [0.0]]))
            X_mut = np.array(X_mut)
            mut_wr_raw = float(np.mean(model.predict_proba(X_mut)[:, 1]))

            cand_deck_cards = [c for c in request.cards if c != weakest_card] + [cand]
            aec = calculate_aec(cand_deck_cards, card_elixir)
            penalty = calculate_elixir_penalty(aec)
            final_mut_wr = max(0.0, min(1.0, mut_wr_raw - penalty))

            results.append({
                "candidate": cand,
                "simulated_win_rate": round(final_mut_wr, 4),
                "elixir_cost": round(aec, 2),
                "improvement": round(final_mut_wr - base_wr, 4),
            })

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
