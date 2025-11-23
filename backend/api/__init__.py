"""
FastAPI routes and dependencies
"""
from .routes2 import router
from .dependencies import get_gemini_client

__all__ = ["router", "get_gemini_client"]
