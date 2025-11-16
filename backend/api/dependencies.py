"""
FastAPI dependencies for dependency injection
"""
from backend.integrations import GeminiClient
from backend.config import settings


def get_gemini_client() -> GeminiClient:
    """Get Gemini client instance"""
    return GeminiClient(api_key=settings.gemini_api_key)
