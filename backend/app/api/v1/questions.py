from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_current_admin
from app.db.session import get_db
from app.models.answer import Answer
from app.models.question import Question
from app.models.subcategory import SubCategory
from app.models.user import User
from app.schemas.question import ImportResult, QuestionCreate, QuestionOut, QuestionUpdate
from app.services.question_import import import_questions

router = APIRouter(prefix="/api/admin/questions", tags=["admin-questions"])


@router.get("/subcategory/{subcategory_id}", response_model=list[QuestionOut])
def list_questions(
    subcategory_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_admin)
):
    return (
        db.query(Question)
        .options(joinedload(Question.answers))
        .filter(Question.subcategory_id == subcategory_id, Question.is_deleted.is_(False))
        .order_by(Question.created_at.desc())
        .all()
    )


@router.post("", response_model=QuestionOut, status_code=status.HTTP_201_CREATED)
def create_question(payload: QuestionCreate, db: Session = Depends(get_db), _: User = Depends(get_current_admin)):
    sub = db.query(SubCategory).filter(SubCategory.id == payload.subcategory_id, SubCategory.is_deleted.is_(False)).first()
    if sub is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Sub-bo'lim topilmadi")

    question = Question(subcategory_id=payload.subcategory_id, text=payload.text, difficulty=payload.difficulty)
    db.add(question)
    db.flush()
    for a in payload.answers:
        db.add(Answer(question_id=question.id, text=a.text, is_correct=a.is_correct))
    db.commit()
    db.refresh(question)
    return question


@router.put("/{question_id}", response_model=QuestionOut)
def update_question(
    question_id: int, payload: QuestionUpdate, db: Session = Depends(get_db), _: User = Depends(get_current_admin)
):
    question = (
        db.query(Question)
        .options(joinedload(Question.answers))
        .filter(Question.id == question_id, Question.is_deleted.is_(False))
        .first()
    )
    if question is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Savol topilmadi")

    if payload.text is not None:
        question.text = payload.text
    if payload.difficulty is not None:
        question.difficulty = payload.difficulty
    if payload.answers is not None:
        # Update existing Answer rows in place rather than delete-and-recreate:
        # if this question was already answered in a past test session, the old
        # Answer rows are referenced by TestAnswer.selected_answer_id, and
        # deleting them would fail with a foreign-key violation.
        existing_answers = list(question.answers)
        for i, a in enumerate(payload.answers):
            if i < len(existing_answers):
                existing_answers[i].text = a.text
                existing_answers[i].is_correct = a.is_correct
            else:
                db.add(Answer(question_id=question.id, text=a.text, is_correct=a.is_correct))
        for extra in existing_answers[len(payload.answers):]:
            db.delete(extra)

    db.commit()
    db.refresh(question)
    return question


@router.patch("/{question_id}/toggle", response_model=QuestionOut)
def toggle_question(question_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_admin)):
    question = db.query(Question).filter(Question.id == question_id, Question.is_deleted.is_(False)).first()
    if question is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Savol topilmadi")
    question.is_active = not question.is_active
    db.commit()
    db.refresh(question)
    return question


@router.delete("/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_question(question_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_admin)):
    question = db.query(Question).filter(Question.id == question_id, Question.is_deleted.is_(False)).first()
    if question is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Savol topilmadi")
    # Hard delete: ro'yxatlardan yo'qoladi, lekin analitikada TestAnswer orqali iz qoladi
    question.is_deleted = True
    question.is_active = False
    db.commit()


@router.post("/import", response_model=ImportResult)
async def import_questions_endpoint(
    subcategory_id: int,
    file: UploadFile,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    sub = db.query(SubCategory).filter(SubCategory.id == subcategory_id, SubCategory.is_deleted.is_(False)).first()
    if sub is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Sub-bo'lim topilmadi")

    content = await file.read()
    try:
        return import_questions(db, subcategory_id, file.filename or "", content)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
