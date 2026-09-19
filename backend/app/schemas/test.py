from datetime import datetime

from pydantic import BaseModel


class StartTestRequest(BaseModel):
    subcategory_id: int


class AnswerOption(BaseModel):
    id: int
    text: str


class CurrentQuestionOut(BaseModel):
    session_id: int
    subcategory_name: str
    position: int
    total_questions: int
    time_per_question_seconds: int
    remaining_seconds: int
    allow_back_navigation: bool
    resumed: bool
    question_id: int
    question_text: str
    options: list[AnswerOption]
    previous_selected_answer_id: int | None = None


class SessionFinishedOut(BaseModel):
    session_id: int
    status: str
    message: str


class SubmitAnswerRequest(BaseModel):
    session_id: int
    selected_answer_id: int
    position: int | None = None


class SubmitAnswerResponse(BaseModel):
    finished: bool
    next_question: CurrentQuestionOut | None = None


class ResultAnswerOut(BaseModel):
    question_id: int
    question_text: str
    options: list[dict]
    selected_answer_id: int | None
    is_correct: bool
    is_timed_out: bool


class ResultOut(BaseModel):
    session_id: int
    subcategory_id: int
    subcategory_name: str
    status: str
    total_questions: int
    correct_count: int
    percent: float
    answers: list[ResultAnswerOut]


class HistoryItemOut(BaseModel):
    session_id: int
    subcategory_id: int
    subcategory_name: str
    started_at: datetime
    finished_at: datetime | None
    status: str
    total_questions: int
    correct_count: int
    percent: float
