import numpy as np
import pandas as pd

from app import dependencies
from app.dependencies import calculate_aec, calculate_elixir_penalty
from app.services.errors import ApiError
from app.services.validation import normalize_levels, validate_deck


class DeckAnalysisService:
    @property
    def model(self):
        return dependencies.model

    @property
    def card_vocab(self):
        return dependencies.card_vocab

    @property
    def card_elixir(self):
        return dependencies.card_elixir

    def evaluate_deck(self, cards: list[str], levels: dict[str, int] | None) -> dict:
        validate_deck(cards)
        normalized_levels = normalize_levels(levels, cards)
        search_sig = ",".join(sorted(cards))

        df_leaderboard = dependencies.load_csv("data/deck_leaderboard.csv")
        deck_match = df_leaderboard[df_leaderboard["deck"] == search_sig]

        result = {
            "found_in_history": False,
            "cards": cards,
            "signature": search_sig,
            "historical": None
        }

        if len(deck_match) > 0:
            row = deck_match.iloc[0]
            result.update({
                "found_in_history": True,
                "rank": int(df_leaderboard[df_leaderboard["deck"] == search_sig].index[0]) + 1,
                "matches_played": int(row["matches_played"]),
                "win_rate": float(row["win_rate"]),
                "wilson_score": float(row["wilson_score"]),
                "wins": int(row["wins"]),
                "losses": int(row["losses"]),
                "historical": {
                    "rank": int(df_leaderboard[df_leaderboard["deck"] == search_sig].index[0]) + 1,
                    "matches_played": int(row["matches_played"]),
                    "win_rate": float(row["win_rate"]),
                    "wilson_score": float(row["wilson_score"]),
                    "wins": int(row["wins"]),
                    "losses": int(row["losses"]),
                }
            })

        if self.model is None or self.card_vocab is None:
            raise ApiError("ML model not loaded. Train models first.", code="MODEL_UNAVAILABLE")

        df_model_leaderboard = dependencies.load_csv("data/model_leaderboard.csv")
        meta_decks = df_model_leaderboard["deck"].tolist()
        num_cards = len(self.card_vocab)

        v_sel = np.zeros(num_cards)
        v_sel_lvl = np.zeros(num_cards)
        for card in cards:
            if card in self.card_vocab:
                idx_v = self.card_vocab[card]
                v_sel[idx_v] = 1.0
                v_sel_lvl[idx_v] = normalized_levels.get(card, 11.0)

        X_eval = []
        for opponent_deck in meta_decks:
            v_opp = np.zeros(num_cards)
            v_opp_lvl = np.zeros(num_cards)
            for card in opponent_deck.split(","):
                if card in self.card_vocab:
                    idx_o = self.card_vocab[card]
                    v_opp[idx_o] = 1.0
                    v_opp_lvl[idx_o] = 11.0
            presence_diff = v_sel - v_opp
            level_diff = v_sel_lvl - v_opp_lvl
            X_eval.append(np.concatenate([presence_diff, level_diff, [0.0]]))

        X_eval = np.array(X_eval)
        probs = self.model.predict_proba(X_eval)[:, 1]
        costs = [self.card_elixir.get(c, 3.5) for c in cards]
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

        result.update(
            {
                "predicted_win_rate": round(pred_win_rate, 4),
                "estimated_rank": estimated_rank,
                "total_meta_decks": len(meta_decks),
                "avg_elixir_cost": round(aec, 2),
                "elixir_penalty": round(penalty, 4),
            }
        )

        try:
            swaps = self.find_swaps(cards, normalized_levels)
            result.update(swaps)
        except Exception:
            pass

        return result

    def predict_matchup(self, deck1_cards: list[str], deck1_levels: dict[str, int] | None, deck1_trophies: int, deck2_cards: list[str], deck2_levels: dict[str, int] | None, deck2_trophies: int) -> dict:
        validate_deck(deck1_cards, field_name="deck1_cards")
        validate_deck(deck2_cards, field_name="deck2_cards")
        if self.model is None or self.card_vocab is None:
            raise ApiError("ML model not loaded. Train models first.", code="MODEL_UNAVAILABLE")

        deck1_levels_norm = normalize_levels(deck1_levels, deck1_cards)
        deck2_levels_norm = normalize_levels(deck2_levels, deck2_cards)
        num_cards = len(self.card_vocab)

        v1 = np.zeros(num_cards)
        v2 = np.zeros(num_cards)
        v1_lvl = np.zeros(num_cards)
        v2_lvl = np.zeros(num_cards)

        for card in deck1_cards:
            if card in self.card_vocab:
                idx = self.card_vocab[card]
                v1[idx] = 1.0
                v1_lvl[idx] = deck1_levels_norm.get(card, 11.0)
        for card in deck2_cards:
            if card in self.card_vocab:
                idx = self.card_vocab[card]
                v2[idx] = 1.0
                v2_lvl[idx] = deck2_levels_norm.get(card, 11.0)

        presence_diff = v1 - v2
        level_diff = v1_lvl - v2_lvl
        trophy_diff = (deck1_trophies - deck2_trophies) / 1000.0
        x_input = np.concatenate([presence_diff, level_diff, [trophy_diff]]).reshape(1, -1)
        prob = self.model.predict_proba(x_input)[0][1]

        contribs = []
        base_prob = float(prob)
        for card in deck1_cards:
            v1_mod = v1.copy()
            v1_lvl_mod = v1_lvl.copy()
            v1_mod[self.card_vocab[card]] = 0.0
            v1_lvl_mod[self.card_vocab[card]] = 0.0
            presence_diff_mod = v1_mod - v2
            level_diff_mod = v1_lvl_mod - v2_lvl
            x_mod = np.concatenate([presence_diff_mod, level_diff_mod, [trophy_diff]]).reshape(1, -1)
            prob_mod = self.model.predict_proba(x_mod)[0][1]
            impact = base_prob - float(prob_mod)
            contribs.append({"card": card, "owner": "You (Advantage)" if impact >= 0 else "You (Disadvantage)", "impact": round(impact, 4)})

        for card in deck2_cards:
            v2_mod = v2.copy()
            v2_lvl_mod = v2_lvl.copy()
            v2_mod[self.card_vocab[card]] = 0.0
            v2_lvl_mod[self.card_vocab[card]] = 0.0
            presence_diff_mod = v1 - v2_mod
            level_diff_mod = v1_lvl - v2_lvl_mod
            x_mod = np.concatenate([presence_diff_mod, level_diff_mod, [trophy_diff]]).reshape(1, -1)
            prob_mod = self.model.predict_proba(x_mod)[0][1]
            impact = base_prob - float(prob_mod)
            contribs.append({"card": card, "owner": "Opponent (Weakness)" if impact >= 0 else "Opponent (Threat)", "impact": round(impact, 4)})

        contribs_sorted = sorted(contribs, key=lambda x: x["impact"], reverse=True)
        advantages = [c for c in contribs_sorted if c["impact"] > 0][:3]
        disadvantages = sorted([c for c in contribs if c["impact"] < 0], key=lambda x: x["impact"])[:3]

        return {
            "win_probability": round(float(prob), 4),
            "deck1_cards": deck1_cards,
            "deck2_cards": deck2_cards,
            "verdict": "Favorable" if prob > 0.55 else ("Unfavorable" if prob < 0.45 else "Even"),
            "advantages": advantages,
            "disadvantages": disadvantages,
            "contributions": contribs_sorted,
        }

    def find_swaps(self, cards: list[str], levels: dict[str, int] | None) -> dict:
        validate_deck(cards)
        normalized_levels = normalize_levels(levels, cards)
        if self.model is None or self.card_vocab is None:
            raise ApiError("ML model not loaded. Train models first.", code="MODEL_UNAVAILABLE")

        df_model_leaderboard = dependencies.load_csv("data/model_leaderboard.csv")
        meta_decks = df_model_leaderboard["deck"].tolist()
        num_cards = len(self.card_vocab)

        opp_vectors = []
        for opp in meta_decks:
            v_opp = np.zeros(num_cards)
            v_opp_lvl = np.zeros(num_cards)
            for card in opp.split(","):
                if card in self.card_vocab:
                    idx_o = self.card_vocab[card]
                    v_opp[idx_o] = 1.0
                    v_opp_lvl[idx_o] = 11.0
            opp_vectors.append((v_opp, v_opp_lvl))

        v_base = np.zeros(num_cards)
        v_base_lvl = np.zeros(num_cards)
        for card in cards:
            if card in self.card_vocab:
                idx = self.card_vocab[card]
                v_base[idx] = 1.0
                v_base_lvl[idx] = normalized_levels.get(card, 11.0)

        X_base = []
        for v_opp, _ in opp_vectors:
            presence_diff = v_base - v_opp
            level_diff = v_base_lvl - np.zeros(num_cards)
            X_base.append(np.concatenate([presence_diff, level_diff, [0.0]]))
        X_base = np.array(X_base)
        base_wr_raw = float(np.mean(self.model.predict_proba(X_base)[:, 1]))

        aec_base = calculate_aec(cards, self.card_elixir)
        penalty_base = calculate_elixir_penalty(aec_base)
        base_wr = max(0.0, min(1.0, base_wr_raw - penalty_base))

        loo_impacts = {}
        for card in cards:
            v_mod = v_base.copy()
            v_mod_lvl = v_base_lvl.copy()
            if card in self.card_vocab:
                v_mod[self.card_vocab[card]] = 0.0
                v_mod_lvl[self.card_vocab[card]] = 0.0
            X_mod = []
            for v_opp, _ in opp_vectors:
                presence_diff = v_mod - v_opp
                level_diff = v_mod_lvl - np.zeros(num_cards)
                X_mod.append(np.concatenate([presence_diff, level_diff, [0.0]]))
            X_mod = np.array(X_mod)
            mod_wr_raw = float(np.mean(self.model.predict_proba(X_mod)[:, 1]))
            loo_impacts[card] = base_wr_raw - mod_wr_raw

        weakest_card = min(loo_impacts, key=loo_impacts.get)
        weakest_impact = loo_impacts[weakest_card]
        results = []
        for cand in [c for c in list(self.card_vocab.keys()) if c not in cards]:
            v_mut = v_base.copy()
            v_mut_lvl = v_base_lvl.copy()
            v_mut[self.card_vocab[weakest_card]] = 0.0
            v_mut_lvl[self.card_vocab[weakest_card]] = 0.0
            v_mut[self.card_vocab[cand]] = 1.0
            v_mut_lvl[self.card_vocab[cand]] = 11.0

            X_mut = []
            for v_opp, _ in opp_vectors:
                presence_diff = v_mut - v_opp
                level_diff = v_mut_lvl - np.zeros(num_cards)
                X_mut.append(np.concatenate([presence_diff, level_diff, [0.0]]))
            X_mut = np.array(X_mut)
            mut_wr_raw = float(np.mean(self.model.predict_proba(X_mut)[:, 1]))
            cand_deck_cards = [c for c in cards if c != weakest_card] + [cand]
            aec = calculate_aec(cand_deck_cards, self.card_elixir)
            penalty = calculate_elixir_penalty(aec)
            final_mut_wr = max(0.0, min(1.0, mut_wr_raw - penalty))
            results.append({"candidate": cand, "simulated_win_rate": round(final_mut_wr, 4), "elixir_cost": round(aec, 2), "improvement": round(final_mut_wr - base_wr, 4)})

        results.sort(key=lambda x: x["improvement"], reverse=True)
        return {
            "weakest_card": weakest_card,
            "weakest_impact": round(weakest_impact, 4),
            "base_win_rate": round(base_wr, 4),
            "top_swaps": results[:3],
        }


deck_analysis_service = DeckAnalysisService()
