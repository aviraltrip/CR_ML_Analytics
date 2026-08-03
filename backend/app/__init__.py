"""
Clash Royale Deck Analytics — FastAPI Application.

App factory and package initialization.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.middleware.rate_limit import RateLimitMiddleware
from app.middleware.cache import CacheMiddleware
from app.routes import register_routes


def create_app() -> FastAPI:
    app = FastAPI(
        title="Clash Royale Deck Analytics API",
        description=(
            "REST API for Clash Royale deck analysis, matchup prediction, "
            "and deck evaluation powered by ML synergy models."
        ),
        version=settings.APP_VERSION,
    )

    # --- CORS ---
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # --- Custom Middleware ---
    app.add_middleware(RateLimitMiddleware, max_requests=settings.RATE_LIMIT_MAX, window_seconds=settings.RATE_LIMIT_WINDOW)
    app.add_middleware(CacheMiddleware, default_ttl=settings.CACHE_TTL)

    # --- Routes ---
    register_routes(app)

    return app


app = create_app()
