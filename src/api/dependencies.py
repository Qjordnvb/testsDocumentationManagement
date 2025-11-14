"""
FastAPI dependencies for dependency injection
"""
from src.integrations import GeminiClient
from src.config import settings


def get_gemini_client() -> GeminiClient:
    """Get Gemini client instance"""
    return GeminiClient(api_key=settings.gemini_api_key)
