"""Clash Royale Deck Analytics — FastAPI application factory."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .dependencies import load_card_elixir, load_model_and_vocab
from .middleware.cache import CacheMiddleware
from .middleware.rate_limit import RateLimitMiddleware
from .routes import register_routes


@asynccontextmanager
async def lifespan(app: FastAPI):
    load_model_and_vocab()
    load_card_elixir()
    yield


def create_app() -> FastAPI:
    app = FastAPI(
        title="Clash Royale Deck Analytics API",
        description=(
            "REST API for Clash Royale deck analysis, matchup prediction, "
            "and deck evaluation powered by ML synergy models."
        ),
        version=settings.APP_VERSION,
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.add_middleware(
        RateLimitMiddleware,
        max_requests=settings.RATE_LIMIT_MAX,
        window_seconds=settings.RATE_LIMIT_WINDOW,
    )
    app.add_middleware(CacheMiddleware, default_ttl=settings.CACHE_TTL)

    register_routes(app)

    return app


app = create_app()
