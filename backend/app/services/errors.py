from fastapi import HTTPException


class ApiError(Exception):
    """Base exception for API-level failures."""

    def __init__(self, message: str, code: str = "API_ERROR") -> None:
        self.message = message
        self.code = code
        super().__init__(message)


def raise_http_error(status_code: int, message: str, code: str) -> None:
    raise HTTPException(status_code=status_code, detail={"error": {"code": code, "message": message}})
