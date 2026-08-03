from fastapi import APIRouter, Depends, HTTPException
import numpy as np

from app.dependencies import (
    ensure_model_loaded, model, card_vocab, card_elixir,
    load_csv, calculate_aec, calculate_elixir_penalty,
)
from app.models import MatchupRequest

router = APIRouter()


@router.post("/predict-matchup")
def predict_matchup(request: MatchupRequest) -> dict:
    """
    Predict the win probability between two decks using the trained MLP synergy model.
    Also provides LOO-based card contribution analysis.
    """
    try:
        ensure_model_loaded()

        if len(request.deck1_cards) != 8 or len(request.deck2_cards) != 8:
            raise HTTPException(status_code=400, detail="Both decks must have exactly 8 cards.")

        deck1_levels = request.deck1_levels or {}
        deck2_levels = request.deck2_levels or {}

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

        prob = model.predict_proba(x_input)[0][1]

        # LOO Contribution Analysis
        contribs = []
        base_prob = float(prob)

        for c in request.deck1_cards:
            v1_mod = np.zeros(num_cards)
            v1_lvl_mod = np.zeros(num_cards)
            v1_mod[card_vocab[c]] = 0.0
            v1_lvl_mod[card_vocab[c]] = 0.0
            presence_diff_mod = v1_mod - v2
            level_diff_mod = v1_lvl_mod - v2_lvl
            x_mod = np.concatenate([presence_diff_mod, level_diff_mod, [trophy_diff]]).reshape(1, -1)
            prob_mod = model.predict_proba(x_mod)[0][1]
            impact = base_prob - float(prob_mod)
            contribs.append({"card": c, "owner": "You (Advantage)" if impact >= 0 else "You (Disadvantage)", "impact": round(impact, 4)})

        for c in request.deck2_cards:
            v2_mod = np.zeros(num_cards)
            v2_lvl_mod = np.zeros(num_cards)
            v2_mod[card_vocab[c]] = 0.0
            v2_lvl_mod[card_vocab[c]] = 0.0
            presence_diff_mod = v1 - v2_mod
            level_diff_mod = v1_lvl - v2_lvl_mod
            x_mod = np.concatenate([presence_diff_mod, level_diff_mod, [trophy_diff]]).reshape(1, -1)
            prob_mod = model.predict_proba(x_mod)[0][1]
            impact = float(prob_mod) - base_prob
            contribs.append({"card": c, "owner": "Opponent (Weakness)" if impact >= 0 else "Opponent (Threat)", "impact": round(impact, 4)})

        contribs_sorted = sorted(contribs, key=lambda x: x["impact"], reverse=True)
        advantages = [c for c in contribs_sorted if c["impact"] > 0][:3]
        disadvantages = sorted([c for c in contribs if c["impact"] < 0], key=lambda x: x["impact"])[:3]

        return {
            "win_probability": round(float(prob), 4),
            "deck1_cards": request.deck1_cards,
            "deck2_cards": request.deck2_cards,
            "verdict": "Favorable" if prob > 0.55 else ("Unfavorable" if prob < 0.45 else "Even"),
            "advantages": advantages,
            "disadvantages": disadvantages,
            "contributions": contribs_sorted,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
