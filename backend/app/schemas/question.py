from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.question import Difficulty


class AnswerIn(BaseModel):
    text: str = Field(min_length=1)
    is_correct: bool = False


class AnswerOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    text: str
    is_correct: bool


class QuestionCreate(BaseModel):
    subcategory_id: int
    text: str = Field(min_length=1)
    difficulty: Difficulty = Difficulty.medium
    answers: list[AnswerIn] = Field(min_length=4, max_length=4)

    @field_validator("answers")
    @classmethod
    def exactly_one_correct(cls, answers: list[AnswerIn]) -> list[AnswerIn]:
        if sum(1 for a in answers if a.is_correct) != 1:
            raise ValueError("Aynan bitta to'g'ri javob belgilanishi kerak")
        return answers


class QuestionUpdate(BaseModel):
    text: str | None = Field(default=None, min_length=1)
    difficulty: Difficulty | None = None
    answers: list[AnswerIn] | None = Field(default=None, min_length=4, max_length=4)

    @field_validator("answers")
    @classmethod
    def exactly_one_correct(cls, answers: list[AnswerIn] | None) -> list[AnswerIn] | None:
        if answers is not None and sum(1 for a in answers if a.is_correct) != 1:
            raise ValueError("Aynan bitta to'g'ri javob belgilanishi kerak")
        return answers


class QuestionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    subcategory_id: int
    text: str
    difficulty: Difficulty
    is_active: bool
    created_at: datetime
    answers: list[AnswerOut]


class ImportResult(BaseModel):
    imported: int
    errors: list[str]
