from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.dependencies import load_csv
from app.models import LeaderboardFilter

router = APIRouter()


class LeaderboardResponse(BaseModel):
    leaderboard: list[dict]
    total: int
    page: int
    page_size: int


@router.get("/leaderboard", response_model=LeaderboardResponse)
def get_leaderboard(filter: LeaderboardFilter = Depends()) -> LeaderboardResponse:
    """Return filtered, paginated deck leaderboard."""
    try:
        df = load_csv("data/deck_leaderboard.csv")
        df_filtered = (
            df[df["matches_played"] >= filter.min_games]
            .copy()
            .reset_index(drop=True)
        )
        df_filtered.insert(0, "Rank", df_filtered.index + 1)

        total = len(df_filtered)
        start = (filter.page - 1) * filter.page_size
        end = start + filter.page_size
        page = df_filtered.iloc[start:end].to_dict(orient="records")

        return LeaderboardResponse(leaderboard=page, total=total, page=filter.page, page_size=filter.page_size)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
