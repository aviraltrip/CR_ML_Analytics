from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.dependencies import load_csv

router = APIRouter()


class ModelLeaderboardFilter(BaseModel):
    min_games: int = 5
    page: int = 1
    page_size: int = 20


@router.get("/model-leaderboard")
def get_model_leaderboard(filter: ModelLeaderboardFilter = None) -> dict:
    """Return ML-predicted leaderboard with pagination."""
    try:
        if filter is None:
            filter = ModelLeaderboardFilter()

        df = load_csv("data/model_leaderboard.csv")
        df_filtered = (
            df[df["matches_played"] >= filter.min_games]
            .copy()
            .reset_index(drop=True)
        )
        if "Predictive_Rank" in df_filtered.columns:
            df_filtered = df_filtered.drop(columns=["Predictive_Rank"])
        df_filtered.insert(0, "Predictive_Rank", df_filtered.index + 1)

        total = len(df_filtered)
        start = (filter.page - 1) * filter.page_size
        end = start + filter.page_size
        page = df_filtered.iloc[start:end].to_dict(orient="records")

        return {
            "model_leaderboard": page,
            "total": total,
            "page": filter.page,
            "page_size": filter.page_size,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
