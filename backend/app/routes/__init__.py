"""Route registration — import all route modules and include their routers."""

from fastapi import FastAPI

from app.routes import health, data, leaderboard, card_stats, model_leaderboard
from app.routes import evaluate, matchup, swaps


def register_routes(app: FastAPI) -> None:
    """Attach all route routers to the FastAPI application."""
    app.include_router(health.router, tags=["Health"])
    app.include_router(data.router, tags=["Data"])
    app.include_router(leaderboard.router, tags=["Leaderboard"])
    app.include_router(card_stats.router, tags=["Card Stats"])
    app.include_router(model_leaderboard.router, tags=["Model Leaderboard"])
    app.include_router(evaluate.router, tags=["Evaluate"])
    app.include_router(matchup.router, tags=["Matchup"])
    app.include_router(swaps.router, tags=["Swaps"])
