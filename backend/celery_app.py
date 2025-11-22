"""
Celery application configuration for background tasks
"""
from celery import Celery
import os
from backend.config import Settings

# Load settings
settings = Settings()

# Redis URL from environment or default
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# Create Celery app
celery_app = Celery(
    "qa_tasks",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["backend.tasks"]  # Import tasks module
)

# Celery configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=600,  # 10 minutes max per task
    worker_prefetch_multiplier=1,  # One task at a time per worker
    worker_max_tasks_per_child=50,  # Restart worker after 50 tasks (memory cleanup)
)

# Optional: Configure result expiration
celery_app.conf.result_expires = 3600  # Results expire after 1 hour
