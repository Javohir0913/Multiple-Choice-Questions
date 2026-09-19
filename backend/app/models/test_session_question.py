from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class TestSessionQuestion(Base):
    """Snapshot of one question inside a specific test session: fixes the
    question order and the shuffled answer-option order so that a resumed
    session and the final grading always see exactly what the user saw."""

    __tablename__ = "test_session_questions"

    id: Mapped[int] = mapped_column(primary_key=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("test_sessions.id", ondelete="CASCADE"))
    question_id: Mapped[int] = mapped_column(ForeignKey("questions.id"))

    position: Mapped[int] = mapped_column(Integer, nullable=False)
    answer_order: Mapped[list[int]] = mapped_column(JSON, nullable=False)

    # Set the first time this question is served to the client; used to
    # compute server-side whether the per-question countdown has expired.
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    session: Mapped["TestSession"] = relationship(back_populates="session_questions")
    question: Mapped["Question"] = relationship()
