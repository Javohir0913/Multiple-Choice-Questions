from celery import Celery
from celery.schedules import crontab

from app.core.config import settings

celery_app = Celery(
    "mcq_platform",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=["app.tasks.scheduled"],
)

celery_app.conf.timezone = "UTC"
celery_app.conf.beat_schedule = {
    "sweep-expired-test-sessions": {
        "task": "app.tasks.scheduled.sweep_expired_test_sessions",
        "schedule": 60.0,  # every minute
    },
    "deactivate-expired-subcategories": {
        "task": "app.tasks.scheduled.deactivate_expired_subcategories",
        "schedule": crontab(minute="*/5"),
    },
}
