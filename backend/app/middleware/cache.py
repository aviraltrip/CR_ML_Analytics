"""Simple in-memory caching middleware for GET requests."""

import time
from typing import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware


class CacheMiddleware(BaseHTTPMiddleware):
    """Cache GET responses in memory to reduce redundant computation."""

    def __init__(self, app, default_ttl: int = 300):
        super().__init__(app)
        self.default_ttl = default_ttl
        self._cache: dict[str, tuple[float, int, bytes, dict, str]] = {}

    async def dispatch(self, request: Request, call_next: Callable) -> Response:

        if request.url.path == "/health":
            return await call_next(request)


        if request.method != "GET":
            return await call_next(request)

        cache_key = str(request.url)
        now = time.time()


        if cache_key in self._cache:
            cached_at, status_code, body, headers, media_type = self._cache[cache_key]
            if now - cached_at < self.default_ttl:
                return Response(
                    content=body,
                    status_code=status_code,
                    headers=headers,
                    media_type=media_type,
                )

            del self._cache[cache_key]


        response = await call_next(request)


        if response.status_code == 200:

            body = b""
            async for chunk in response.body_iterator:
                body += chunk
            
            headers = dict(response.headers)
            headers.pop("content-length", None)
            
            self._cache[cache_key] = (
                now,
                response.status_code,
                body,
                headers,
                response.media_type,
            )
            return Response(
                content=body,
                status_code=response.status_code,
                headers=headers,
                media_type=response.media_type,
            )

        return response
