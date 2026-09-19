import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class TestSessionStatus(str, enum.Enum):
    in_progress = "in_progress"
    completed = "completed"
    timed_out = "timed_out"
    cancelled = "cancelled"


class TestSession(Base):
    __tablename__ = "test_sessions"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    subcategory_id: Mapped[int] = mapped_column(ForeignKey("subcategories.id"))

    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    status: Mapped[TestSessionStatus] = mapped_column(
        Enum(TestSessionStatus, name="test_session_status_enum"),
        default=TestSessionStatus.in_progress,
        nullable=False,
    )

    # 1-indexed position of the question currently being served. When it
    # exceeds total_questions, the session is finished.
    current_position: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    total_questions: Mapped[int] = mapped_column(Integer, nullable=False)

    user: Mapped["User"] = relationship()
    subcategory: Mapped["SubCategory"] = relationship()
    session_questions: Mapped[list["TestSessionQuestion"]] = relationship(
        back_populates="session", cascade="all, delete-orphan", order_by="TestSessionQuestion.position"
    )
    answers: Mapped[list["TestAnswer"]] = relationship(back_populates="session", cascade="all, delete-orphan")
