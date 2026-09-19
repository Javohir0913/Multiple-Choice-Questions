from datetime import datetime, timezone

from app.db.session import SessionLocal
from app.models.subcategory import SubCategory
from app.models.test_session import TestSession, TestSessionStatus
from app.services.test_service import advance_expired_questions
from app.tasks.celery_app import celery_app


@celery_app.task
def sweep_expired_test_sessions() -> int:
    """Finalizes test sessions whose per-question timer ran out while the
    user was away (closed the tab, lost connection, etc.) so they don't sit
    as 'in_progress' forever and are correctly reflected in history/analytics."""
    db = SessionLocal()
    swept = 0
    try:
        sessions = db.query(TestSession).filter(TestSession.status == TestSessionStatus.in_progress).all()
        for session in sessions:
            before = session.status
            advance_expired_questions(db, session)
            if session.status != before:
                swept += 1
        return swept
    finally:
        db.close()


@celery_app.task
def deactivate_expired_subcategories() -> int:
    """Auto-deactivates subcategories whose available_until has passed, so
    the 'faqat shu oraliqda test ko'rinadi va ishlay oladi' requirement holds
    even if nobody opens the admin panel to toggle it off manually."""
    db = SessionLocal()
    updated = 0
    try:
        now = datetime.now(timezone.utc)
        expired = (
            db.query(SubCategory)
            .filter(
                SubCategory.is_active.is_(True),
                SubCategory.available_until.is_not(None),
                SubCategory.available_until < now,
            )
            .all()
        )
        for sub in expired:
            sub.is_active = False
            updated += 1
        db.commit()
        return updated
    finally:
        db.close()
