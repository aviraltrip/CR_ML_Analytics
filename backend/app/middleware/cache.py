"""
Simple in-memory caching middleware.
Caches GET responses keyed by the full request URL for a configurable TTL.
"""

import time
from typing import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from app.config import settings


class CacheMiddleware(BaseHTTPMiddleware):
    """Cache GET responses in memory to reduce redundant computation."""

    def __init__(self, app, default_ttl: int = 300):
        super().__init__(app)
        self.default_ttl = default_ttl
        self._cache: dict[str, tuple[float, Response]] = {}

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Only cache GET requests
        if request.method != "GET":
            return await call_next(request)

        cache_key = str(request.url)
        now = time.time()

        # Check for cached response
        if cache_key in self._cache:
            cached_at, cached_response = self._cache[cache_key]
            if now - cached_at < self.default_ttl:
                return cached_response
            # Expired — remove it
            del self._cache[cache_key]

        # Fetch fresh response
        response = await call_next(request)

        # Only cache successful responses
        if response.status_code == 200:
            # Clone the response body for caching
            body = b""
            async for chunk in response.body_iterator:
                body += chunk
            # Reconstruct response with cached body
            cached_response = Response(
                content=body,
                status_code=response.status_code,
                headers=dict(response.headers),
                media_type=response.media_type,
            )
            self._cache[cache_key] = (now, cached_response)
            return cached_response

        return response
