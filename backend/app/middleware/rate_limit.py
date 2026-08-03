"""
Simple in-memory rate-limiting middleware.
Tracks request counts per client IP within a sliding window.
"""

import time
from collections import defaultdict
from typing import Callable

from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware

from app.config import settings


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Rate-limit requests per IP address."""

    def __init__(self, app, max_requests: int = 100, window_seconds: int = 60):
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._requests: dict[str, list[float]] = defaultdict(list)

    async def dispatch(self, request: Request, call_next: Callable) -> object:
        client_ip = request.client.host if request.client else "unknown"
        now = time.time()

        # Prune timestamps outside the window
        window_start = now - self.window_seconds
        self._requests[client_ip] = [
            ts for ts in self._requests[client_ip] if ts > window_start
        ]

        if len(self._requests[client_ip]) >= self.max_requests:
            raise HTTPException(
                status_code=429,
                detail=f"Rate limit exceeded. Try again in {self.window_seconds} seconds.",
            )

        self._requests[client_ip].append(now)
        response = await call_next(request)
        return response
