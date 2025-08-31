from celery import Celery
from app.config import settings
import logging

logger = logging.getLogger(__name__)

# Create Celery app
celery_app = Celery(
    "chessforge",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
    include=[
        "app.services.lichess_service",
        "app.services.analysis_service",
        "app.services.insights_service",
    ]
)

# Celery configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes
    task_soft_time_limit=25 * 60,  # 25 minutes
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=1000,
    broker_connection_retry_on_startup=True,
)

# Task routing
celery_app.conf.task_routes = {
    "app.services.lichess_service.*": {"queue": "lichess"},
    "app.services.analysis_service.*": {"queue": "analysis"},
    "app.services.insights_service.*": {"queue": "insights"},
}

# Optional: Configure result backend
if settings.celery_result_backend:
    celery_app.conf.result_backend = settings.celery_result_backend
    celery_app.conf.result_expires = 3600  # 1 hour

logger.info("Celery app configured successfully")
