"""Clash Royale Deck Analytics — FastAPI application factory."""

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import settings
from .dependencies import load_card_elixir, load_model_and_vocab
from .middleware.cache import CacheMiddleware
from .middleware.rate_limit import RateLimitMiddleware
from .routes import register_routes
from .services.errors import ApiError


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
        allow_credentials="*" not in settings.CORS_ORIGINS,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.add_middleware(
        RateLimitMiddleware,
        max_requests=settings.RATE_LIMIT_MAX,
        window_seconds=settings.RATE_LIMIT_WINDOW,
    )
    app.add_middleware(CacheMiddleware, default_ttl=settings.CACHE_TTL)

    @app.exception_handler(ApiError)
    async def api_error_handler(_: Request, exc: ApiError) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": {"code": exc.code, "message": exc.message}},
        )

    @app.exception_handler(Exception)
    async def generic_exception_handler(_: Request, exc: Exception) -> JSONResponse:
        return JSONResponse(
            status_code=500,
            content={"error": {"code": "INTERNAL_SERVER_ERROR", "message": str(exc)}},
        )

    register_routes(app)

    return app


app = create_app()
