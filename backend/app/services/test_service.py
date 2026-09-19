"""Core test-taking logic: random pool selection, shuffling, server-side
per-question countdown enforcement, and resume/grading support.

The whole session lives in Postgres (not Redis) so that a resume works
correctly even across backend restarts/redeploys — Redis in this project is
reserved for the Celery broker, the register rate-limiter and light caching.
"""
import random
from datetime import datetime, timezone

from sqlalchemy.orm import Session, joinedload

from app.models.answer import Answer
from app.models.question import Question
from app.models.subcategory import SubCategory
from app.models.test_answer import TestAnswer
from app.models.test_session import TestSession, TestSessionStatus
from app.models.test_session_question import TestSessionQuestion
from app.schemas.test import AnswerOption, CurrentQuestionOut


class TestStateError(Exception):
    pass


def _now():
    return datetime.now(timezone.utc)


def get_active_in_progress_session(db: Session, user_id: int, subcategory_id: int) -> TestSession | None:
    return (
        db.query(TestSession)
        .filter(
            TestSession.user_id == user_id,
            TestSession.subcategory_id == subcategory_id,
            TestSession.status == TestSessionStatus.in_progress,
        )
        .first()
    )


def start_session(db: Session, user_id: int, subcategory: SubCategory) -> TestSession:
    pool = (
        db.query(Question)
        .options(joinedload(Question.answers))
        .filter(Question.subcategory_id == subcategory.id, Question.is_active.is_(True), Question.is_deleted.is_(False))
        .all()
    )
    if not pool:
        raise TestStateError("Bu sub-bo'limda faol savollar mavjud emas")

    n = min(subcategory.total_questions_per_test, len(pool))
    selected = random.sample(pool, n)

    session = TestSession(
        user_id=user_id,
        subcategory_id=subcategory.id,
        status=TestSessionStatus.in_progress,
        current_position=1,
        total_questions=n,
    )
    db.add(session)
    db.flush()

    for position, question in enumerate(selected, start=1):
        answer_ids = [a.id for a in question.answers]
        random.shuffle(answer_ids)
        sq = TestSessionQuestion(
            session_id=session.id,
            question_id=question.id,
            position=position,
            answer_order=answer_ids,
            started_at=_now() if position == 1 else None,
        )
        db.add(sq)

    db.commit()
    db.refresh(session)
    return session


def _get_session_question(db: Session, session: TestSession, position: int) -> TestSessionQuestion | None:
    return (
        db.query(TestSessionQuestion)
        .filter(TestSessionQuestion.session_id == session.id, TestSessionQuestion.position == position)
        .first()
    )


def _finish_session(db: Session, session: TestSession, status: TestSessionStatus) -> None:
    session.status = status
    session.finished_at = _now()


def advance_expired_questions(db: Session, session: TestSession) -> TestSession:
    """Walks the session forward past any question whose per-question
    countdown has already elapsed, recording it as an unanswered timeout.
    Safe to call on every read — it is what makes resume-after-refresh and
    'come back an hour later' behave like the spec requires."""
    if session.status != TestSessionStatus.in_progress:
        return session

    sub = session.subcategory
    limit = sub.time_per_question_seconds

    while session.status == TestSessionStatus.in_progress:
        sq = _get_session_question(db, session, session.current_position)
        if sq is None:
            _finish_session(db, session, TestSessionStatus.completed)
            break

        if sq.started_at is None:
            sq.started_at = _now()
            break

        elapsed = (_now() - sq.started_at).total_seconds()
        if elapsed < limit:
            break

        # Time is up and no answer was recorded for this question -> timeout.
        already = (
            db.query(TestAnswer)
            .filter(TestAnswer.session_id == session.id, TestAnswer.question_id == sq.question_id)
            .first()
        )
        if already is None:
            db.add(
                TestAnswer(
                    session_id=session.id,
                    question_id=sq.question_id,
                    selected_answer_id=None,
                    is_timed_out=True,
                    answered_at=_now(),
                )
            )

        session.current_position += 1
        if session.current_position > session.total_questions:
            _finish_session(db, session, TestSessionStatus.timed_out)
            break

    db.commit()
    db.refresh(session)
    return session


def build_current_question(db: Session, session: TestSession, resumed: bool) -> CurrentQuestionOut:
    sq = _get_session_question(db, session, session.current_position)
    if sq is None:
        raise TestStateError("Test tugagan")

    question = db.query(Question).filter(Question.id == sq.question_id).first()
    answers_by_id = {a.id: a for a in question.answers}
    options = [AnswerOption(id=aid, text=answers_by_id[aid].text) for aid in sq.answer_order if aid in answers_by_id]

    elapsed = (_now() - sq.started_at).total_seconds() if sq.started_at else 0
    remaining = max(0, int(session.subcategory.time_per_question_seconds - elapsed))

    previous = (
        db.query(TestAnswer)
        .filter(TestAnswer.session_id == session.id, TestAnswer.question_id == sq.question_id)
        .first()
    )

    return CurrentQuestionOut(
        session_id=session.id,
        subcategory_name=session.subcategory.name,
        position=session.current_position,
        total_questions=session.total_questions,
        time_per_question_seconds=session.subcategory.time_per_question_seconds,
        remaining_seconds=remaining,
        allow_back_navigation=session.subcategory.allow_back_navigation,
        resumed=resumed,
        question_id=question.id,
        question_text=question.text,
        options=options,
        previous_selected_answer_id=previous.selected_answer_id if previous else None,
    )


def submit_answer(
    db: Session, session: TestSession, selected_answer_id: int, position: int | None
) -> tuple[bool, TestSession]:
    session = advance_expired_questions(db, session)
    if session.status != TestSessionStatus.in_progress:
        raise TestStateError("Test allaqachon tugagan")

    target_position = position or session.current_position

    if target_position != session.current_position:
        if not session.subcategory.allow_back_navigation:
            raise TestStateError("Bu sub-bo'limda orqaga qaytish mumkin emas")
        if target_position > session.current_position or target_position < 1:
            raise TestStateError("Noto'g'ri savol pozitsiyasi")

    sq = _get_session_question(db, session, target_position)
    if sq is None or selected_answer_id not in sq.answer_order:
        raise TestStateError("Noto'g'ri javob varianti")

    existing = (
        db.query(TestAnswer)
        .filter(TestAnswer.session_id == session.id, TestAnswer.question_id == sq.question_id)
        .first()
    )
    if existing is not None:
        existing.selected_answer_id = selected_answer_id
        existing.is_timed_out = False
        existing.answered_at = _now()
    else:
        db.add(
            TestAnswer(
                session_id=session.id,
                question_id=sq.question_id,
                selected_answer_id=selected_answer_id,
                is_timed_out=False,
                answered_at=_now(),
            )
        )

    finished = False
    if target_position == session.current_position:
        session.current_position += 1
        if session.current_position > session.total_questions:
            _finish_session(db, session, TestSessionStatus.completed)
            finished = True
        else:
            next_sq = _get_session_question(db, session, session.current_position)
            if next_sq is not None and next_sq.started_at is None:
                next_sq.started_at = _now()

    db.commit()
    db.refresh(session)
    return finished, session


def cancel_session(db: Session, session: TestSession) -> TestSession:
    if session.status == TestSessionStatus.in_progress:
        _finish_session(db, session, TestSessionStatus.cancelled)
        db.commit()
        db.refresh(session)
    return session


def finish_session_manually(db: Session, session: TestSession) -> TestSession:
    session = advance_expired_questions(db, session)
    if session.status == TestSessionStatus.in_progress:
        # Mark every remaining unanswered question as timed out.
        for pos in range(session.current_position, session.total_questions + 1):
            sq = _get_session_question(db, session, pos)
            if sq is None:
                continue
            already = (
                db.query(TestAnswer)
                .filter(TestAnswer.session_id == session.id, TestAnswer.question_id == sq.question_id)
                .first()
            )
            if already is None:
                db.add(
                    TestAnswer(
                        session_id=session.id,
                        question_id=sq.question_id,
                        selected_answer_id=None,
                        is_timed_out=True,
                        answered_at=_now(),
                    )
                )
        session.current_position = session.total_questions + 1
        _finish_session(db, session, TestSessionStatus.completed)
        db.commit()
        db.refresh(session)
    return session


def build_result(db: Session, session: TestSession) -> dict:
    session_questions = (
        db.query(TestSessionQuestion)
        .options(joinedload(TestSessionQuestion.question).joinedload(Question.answers))
        .filter(TestSessionQuestion.session_id == session.id)
        .order_by(TestSessionQuestion.position)
        .all()
    )
    test_answers = {
        ta.question_id: ta
        for ta in db.query(TestAnswer).filter(TestAnswer.session_id == session.id).all()
    }

    answers_out = []
    correct_count = 0
    for sq in session_questions:
        question = sq.question
        ta = test_answers.get(question.id)
        is_correct = bool(ta and ta.selected_answer_id and next(
            (a.is_correct for a in question.answers if a.id == ta.selected_answer_id), False
        ))
        if is_correct:
            correct_count += 1

        options = [
            {"id": a.id, "text": a.text, "is_correct": a.is_correct}
            for a in sorted(question.answers, key=lambda a: sq.answer_order.index(a.id) if a.id in sq.answer_order else 0)
        ]

        answers_out.append(
            {
                "question_id": question.id,
                "question_text": question.text,
                "options": options,
                "selected_answer_id": ta.selected_answer_id if ta else None,
                "is_correct": is_correct,
                "is_timed_out": bool(ta.is_timed_out) if ta else True,
            }
        )

    total = session.total_questions
    percent = round(correct_count / total * 100, 2) if total else 0.0

    return {
        "session_id": session.id,
        "subcategory_id": session.subcategory_id,
        "subcategory_name": session.subcategory.name,
        "status": session.status.value,
        "total_questions": total,
        "correct_count": correct_count,
        "percent": percent,
        "answers": answers_out,
    }
