from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin
from app.core.security import hash_password
from app.db.session import get_db
from app.models.test_answer import TestAnswer
from app.models.test_session import TestSession, TestSessionStatus
from app.models.user import User
from app.schemas.auth import ChangePasswordByAdmin, SetUserActive, UserOut

router = APIRouter(prefix="/api/admin/users", tags=["admin-users"])


@router.get("", response_model=list[UserOut])
def list_users(
    faculty_id: int | None = None,
    group_id: int | None = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    query = db.query(User).filter(User.is_admin.is_(False))
    if faculty_id is not None:
        query = query.filter(User.faculty_id == faculty_id)
    if group_id is not None:
        query = query.filter(User.group_id == group_id)
    return query.order_by(User.created_at.desc()).all()


@router.get("/{user_id}/stats")
def user_stats(
    user_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Foydalanuvchi topilmadi")

    sessions = db.query(TestSession).filter(TestSession.user_id == user_id).all()
    total_sessions = len(sessions)
    completed_sessions = [s for s in sessions if s.status == TestSessionStatus.completed]

    total_answers = 0
    correct_answers = 0
    if completed_sessions:
        session_ids = [s.id for s in completed_sessions]
        total_answers = (
            db.query(func.count(TestAnswer.id)).filter(TestAnswer.session_id.in_(session_ids)).scalar() or 0
        )
        correct_answers = (
            db.query(func.count(TestAnswer.id))
            .join(TestAnswer.selected_answer)
            .filter(TestAnswer.session_id.in_(session_ids), TestAnswer.selected_answer.has(is_correct=True))
            .scalar()
            or 0
        )

    accuracy = round(correct_answers / total_answers * 100, 2) if total_answers else 0.0

    return {
        "user": UserOut.model_validate(user),
        "total_sessions": total_sessions,
        "completed_sessions": len(completed_sessions),
        "total_answers": total_answers,
        "correct_answers": correct_answers,
        "accuracy_percent": accuracy,
    }


@router.patch("/{user_id}/active", response_model=UserOut)
def set_user_active(
    user_id: int,
    payload: SetUserActive,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    user = db.query(User).filter(User.id == user_id, User.is_admin.is_(False)).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Foydalanuvchi topilmadi")
    user.is_active = payload.is_active
    db.commit()
    db.refresh(user)
    return user


@router.patch("/{user_id}/password", response_model=UserOut)
def change_user_password(
    user_id: int,
    payload: ChangePasswordByAdmin,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    user = db.query(User).filter(User.id == user_id, User.is_admin.is_(False)).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Foydalanuvchi topilmadi")
    user.password_hash = hash_password(payload.new_password)
    db.commit()
    db.refresh(user)
    return user
