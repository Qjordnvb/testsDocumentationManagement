"""
Configuration management for QA Documentation Automation
"""
from pydantic_settings import BaseSettings
from pydantic import Field
from typing import Optional
import os
from pathlib import Path

# Get the project root directory (parent of backend/)
PROJECT_ROOT = Path(__file__).parent.parent


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    # Application
    app_name: str = Field(default="QA Documentation Automation", env="APP_NAME")
    app_version: str = Field(default="1.0.0", env="APP_VERSION")
    debug: bool = Field(default=False, env="DEBUG")

    # Security (JWT Authentication)
    SECRET_KEY: str = Field(..., env="SECRET_KEY")

    # AI Configuration
    gemini_api_key: str = Field(..., env="GEMINI_API_KEY")

    # Database
    database_url: str = Field(default="sqlite:///./data/qa_automation.db", env="DATABASE_URL")

    # File Upload
    max_upload_size_mb: int = Field(default=10, env="MAX_UPLOAD_SIZE_MB")
    allowed_extensions: str = Field(default="xlsx,csv", env="ALLOWED_EXTENSIONS")

    # Directories
    output_dir: str = Field(default="./output", env="OUTPUT_DIR")
    upload_dir: str = Field(default="./uploads", env="UPLOAD_DIR")

    class Config:
        env_file = str(PROJECT_ROOT / ".env")  # Busca .env en la raíz del proyecto
        env_file_encoding = "utf-8"
        case_sensitive = False
        extra = "ignore"

    def get_allowed_extensions_list(self) -> list[str]:
        """Get list of allowed file extensions"""
        return [ext.strip() for ext in self.allowed_extensions.split(",")]

    def ensure_directories(self):
        """Ensure required directories exist"""
        os.makedirs(self.output_dir, exist_ok=True)
        os.makedirs(self.upload_dir, exist_ok=True)
        os.makedirs("./data", exist_ok=True)


# Global settings instance
settings = Settings()
