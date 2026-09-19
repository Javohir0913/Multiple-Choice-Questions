from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.subcategory import SubCategory
from app.models.test_session import TestSession, TestSessionStatus
from app.models.user import User
from app.schemas.test import (
    CurrentQuestionOut,
    HistoryItemOut,
    ResultOut,
    StartTestRequest,
    SubmitAnswerRequest,
    SubmitAnswerResponse,
)
from app.services import test_service
from app.services.test_service import TestStateError

router = APIRouter(prefix="/api/test", tags=["test"])


def _load_session(db: Session, session_id: int, user: User) -> TestSession:
    session = (
        db.query(TestSession)
        .options(joinedload(TestSession.subcategory))
        .filter(TestSession.id == session_id, TestSession.user_id == user.id)
        .first()
    )
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Test sessiyasi topilmadi")
    return session


@router.post("/start", response_model=CurrentQuestionOut)
def start_test(
    payload: StartTestRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    sub = (
        db.query(SubCategory)
        .filter(
            SubCategory.id == payload.subcategory_id,
            SubCategory.is_active.is_(True),
            SubCategory.is_deleted.is_(False),
        )
        .first()
    )
    if sub is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sub-bo'lim topilmadi")

    existing = test_service.get_active_in_progress_session(db, current_user.id, sub.id)
    if existing is not None:
        existing = test_service.advance_expired_questions(db, existing)
        if existing.status == TestSessionStatus.in_progress:
            return test_service.build_current_question(db, existing, resumed=True)

    try:
        session = test_service.start_session(db, current_user.id, sub)
    except TestStateError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    return test_service.build_current_question(db, session, resumed=False)


@router.get("/session/{session_id}/resume", response_model=CurrentQuestionOut)
def resume_test(session_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    session = _load_session(db, session_id, current_user)
    session = test_service.advance_expired_questions(db, session)
    if session.status != TestSessionStatus.in_progress:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Test tugagan, natijani ko'ring")
    return test_service.build_current_question(db, session, resumed=True)


@router.post("/session/{session_id}/cancel")
def cancel_test(session_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    session = _load_session(db, session_id, current_user)
    session = test_service.cancel_session(db, session)
    return {"session_id": session.id, "status": session.status.value}


@router.post("/answer", response_model=SubmitAnswerResponse)
def submit_answer(
    payload: SubmitAnswerRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    session = _load_session(db, payload.session_id, current_user)
    try:
        finished, session = test_service.submit_answer(
            db, session, payload.selected_answer_id, payload.position
        )
    except TestStateError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    next_question = None
    if not finished:
        next_question = test_service.build_current_question(db, session, resumed=False)
    return SubmitAnswerResponse(finished=finished, next_question=next_question)


@router.post("/finish")
def finish_test(session_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    session = _load_session(db, session_id, current_user)
    session = test_service.finish_session_manually(db, session)
    return {"session_id": session.id, "status": session.status.value}


@router.get("/session/{session_id}/result", response_model=ResultOut)
def get_result(session_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    session = _load_session(db, session_id, current_user)
    if session.status == TestSessionStatus.in_progress:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Test hali tugamagan")
    return test_service.build_result(db, session)


@router.get("/history", response_model=list[HistoryItemOut])
def get_history(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    sessions = (
        db.query(TestSession)
        .options(joinedload(TestSession.subcategory))
        .filter(TestSession.user_id == current_user.id, TestSession.status != TestSessionStatus.in_progress)
        .order_by(TestSession.started_at.desc())
        .all()
    )
    items = []
    for s in sessions:
        result = test_service.build_result(db, s)
        items.append(
            HistoryItemOut(
                session_id=s.id,
                subcategory_id=s.subcategory_id,
                subcategory_name=s.subcategory.name,
                started_at=s.started_at,
                finished_at=s.finished_at,
                status=s.status.value,
                total_questions=result["total_questions"],
                correct_count=result["correct_count"],
                percent=result["percent"],
            )
        )
    return items
