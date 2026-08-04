from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app import dependencies
from app.dependencies import load_csv, ensure_model_loaded
from app.models import DataFilter

router = APIRouter()


class DataResponse(BaseModel):
    battles_count: int
    leaderboard: list[dict]
    leaderboard_total: int
    card_stats: list[dict]
    card_stats_total: int
    model_leaderboard: list[dict] | None
    model_leaderboard_total: int | None
    card_elixir: dict
    model_loaded: bool


@router.get("/data", response_model=DataResponse)
def get_data(filter: DataFilter = Depends()) -> DataResponse:
    """Access to all datasets."""
    try:
        df_battles = load_csv("data/processed_battles.csv")
        df_leaderboard = load_csv("data/deck_leaderboard.csv")
        df_card_stats = load_csv("data/card_stats.csv")
        df_model_leaderboard = None
        model_lb_exists = False

        try:
            df_model_leaderboard = load_csv("data/model_leaderboard.csv")
            model_lb_exists = True
        except HTTPException:
            pass

        # Filter leaderboard by min_games
        df_leaderboard_filtered = (
            df_leaderboard[df_leaderboard["matches_played"] >= filter.min_games]
            .copy()
            .reset_index(drop=True)
        )
        df_leaderboard_filtered.insert(0, "Rank", df_leaderboard_filtered.index + 1)

        # Full datasets for dashboard stats
        lb_list = df_leaderboard_filtered.to_dict(orient="records")
        cs_list = df_card_stats.to_dict(orient="records")

        # Model leaderboard
        mlb_list = None
        mlb_total = None
        if model_lb_exists and df_model_leaderboard is not None:
            df_mlb_filtered = df_model_leaderboard[
                df_model_leaderboard["matches_played"] >= filter.min_games
            ].copy().reset_index(drop=True)
            if "Predictive_Rank" in df_mlb_filtered.columns:
                df_mlb_filtered = df_mlb_filtered.drop(columns=["Predictive_Rank"])
            df_mlb_filtered.insert(0, "Predictive_Rank", df_mlb_filtered.index + 1)
            mlb_total = len(df_mlb_filtered)
            mlb_list = df_mlb_filtered.to_dict(orient="records")

        return DataResponse(
            battles_count=len(df_battles),
            leaderboard=lb_list,
            leaderboard_total=len(df_leaderboard_filtered),
            card_stats=cs_list,
            card_stats_total=len(df_card_stats),
            model_leaderboard=mlb_list,
            model_leaderboard_total=mlb_total,
            card_elixir=dependencies.card_elixir,
            model_loaded=dependencies.model is not None,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
