from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import case, func
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin
from app.db.session import get_db
from app.models.answer import Answer
from app.models.category import Category
from app.models.faculty import Faculty
from app.models.group import Group
from app.models.question import Question
from app.models.subcategory import SubCategory
from app.models.test_answer import TestAnswer
from app.models.test_session import TestSession, TestSessionStatus
from app.models.user import User

router = APIRouter(prefix="/api/admin/analytics", tags=["admin-analytics"])


@router.get("/popular-categories")
def popular_categories(db: Session = Depends(get_db), _: User = Depends(get_current_admin)):
    rows = (
        db.query(Category.id, Category.name, func.count(TestSession.id).label("session_count"))
        .join(SubCategory, SubCategory.category_id == Category.id)
        .join(TestSession, TestSession.subcategory_id == SubCategory.id)
        .group_by(Category.id, Category.name)
        .order_by(func.count(TestSession.id).desc())
        .all()
    )
    return [{"category_id": r[0], "category_name": r[1], "session_count": r[2]} for r in rows]


def _question_stats(db: Session, order_desc_on_correct: bool, limit: int):
    correct_expr = func.sum(case((Answer.is_correct.is_(True), 1), else_=0))
    total_expr = func.count(TestAnswer.id)
    rows = (
        db.query(
            Question.id,
            Question.text,
            SubCategory.name.label("subcategory_name"),
            total_expr.label("total"),
            correct_expr.label("correct"),
        )
        .join(TestAnswer, TestAnswer.question_id == Question.id)
        .outerjoin(Answer, Answer.id == TestAnswer.selected_answer_id)
        .join(SubCategory, SubCategory.id == Question.subcategory_id)
        .filter(TestAnswer.is_timed_out.is_(False))
        .group_by(Question.id, Question.text, SubCategory.name)
        .having(total_expr > 0)
        .all()
    )
    ranked = sorted(
        rows,
        key=lambda r: (r.correct / r.total if r.total else 0),
        reverse=order_desc_on_correct,
    )
    return [
        {
            "question_id": r.id,
            "question_text": r.text,
            "subcategory_name": r.subcategory_name,
            "total_answers": r.total,
            "correct_answers": r.correct,
            "correct_rate_percent": round((r.correct / r.total * 100) if r.total else 0, 2),
        }
        for r in ranked[:limit]
    ]


@router.get("/easy-questions")
def easy_questions(limit: int = Query(default=20, le=100), db: Session = Depends(get_db), _: User = Depends(get_current_admin)):
    return _question_stats(db, order_desc_on_correct=True, limit=limit)


@router.get("/hard-questions")
def hard_questions(limit: int = Query(default=20, le=100), db: Session = Depends(get_db), _: User = Depends(get_current_admin)):
    return _question_stats(db, order_desc_on_correct=False, limit=limit)


def _score_by_user_column(db: Session, id_column, name_column):
    correct_expr = func.sum(case((Answer.is_correct.is_(True), 1), else_=0))
    total_expr = func.count(TestAnswer.id)
    rows = (
        db.query(
            id_column,
            name_column,
            total_expr.label("total"),
            correct_expr.label("correct"),
        )
        .select_from(TestAnswer)
        .join(TestSession, TestSession.id == TestAnswer.session_id)
        .join(User, User.id == TestSession.user_id)
        .join(Faculty, Faculty.id == User.faculty_id)
        .join(Group, Group.id == User.group_id)
        .outerjoin(Answer, Answer.id == TestAnswer.selected_answer_id)
        .filter(TestAnswer.is_timed_out.is_(False))
        .group_by(id_column, name_column)
        .all()
    )
    return [
        {
            "id": r[0],
            "name": r[1],
            "total_answers": r[2],
            "correct_answers": r[3],
            "average_score_percent": round((r[3] / r[2] * 100) if r[2] else 0, 2),
        }
        for r in rows
    ]


@router.get("/faculty-stats")
def faculty_stats(db: Session = Depends(get_db), _: User = Depends(get_current_admin)):
    return _score_by_user_column(db, Faculty.id, Faculty.name)


@router.get("/group-stats")
def group_stats(db: Session = Depends(get_db), _: User = Depends(get_current_admin)):
    return _score_by_user_column(db, Group.id, Group.name)


@router.get("/activity")
def activity(
    period: str = Query(default="daily", pattern="^(daily|weekly|monthly)$"),
    days: int = Query(default=30, le=365),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    since = datetime.now(timezone.utc) - timedelta(days=days)
    if period == "daily":
        bucket = func.date_trunc("day", TestSession.started_at)
    elif period == "weekly":
        bucket = func.date_trunc("week", TestSession.started_at)
    else:
        bucket = func.date_trunc("month", TestSession.started_at)

    rows = (
        db.query(bucket.label("bucket"), func.count(TestSession.id))
        .filter(TestSession.started_at >= since)
        .group_by(bucket)
        .order_by(bucket)
        .all()
    )
    return [{"period": r[0].isoformat(), "sessions": r[1]} for r in rows]


@router.get("/top-users")
def top_users(limit: int = Query(default=20, le=100), db: Session = Depends(get_db), _: User = Depends(get_current_admin)):
    rows = (
        db.query(
            User.id,
            User.first_name,
            User.last_name,
            User.phone,
            func.count(TestSession.id).label("session_count"),
        )
        .join(TestSession, TestSession.user_id == User.id)
        .filter(TestSession.status != TestSessionStatus.in_progress)
        .group_by(User.id, User.first_name, User.last_name, User.phone)
        .order_by(func.count(TestSession.id).desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "user_id": r[0],
            "first_name": r[1],
            "last_name": r[2],
            "phone": r[3],
            "session_count": r[4],
        }
        for r in rows
    ]
