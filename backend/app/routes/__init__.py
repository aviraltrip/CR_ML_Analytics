"""Route registration for the API."""

from fastapi import FastAPI

from . import card_stats, data, evaluate, health, leaderboard, matchup, model_leaderboard, swaps


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
