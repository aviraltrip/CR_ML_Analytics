from fastapi import APIRouter, HTTPException

from app.dependencies import load_csv

router = APIRouter()


@router.get("/card-stats")
def get_card_stats() -> dict:
    """Return card statistics for the Overrated vs Underrated chart."""
    try:
        df = load_csv("data/card_stats.csv")
        return {"card_stats": df.to_dict(orient="records")}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
