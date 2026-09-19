from datetime import datetime

from sqlalchemy import Boolean, DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class Faculty(Base):
    __tablename__ = "faculties"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # passive_deletes=True: let Postgres' ON DELETE CASCADE (see the groups.faculty_id
    # FK) remove dependent groups directly, instead of SQLAlchemy trying to UPDATE
    # groups.faculty_id to NULL first (which would violate its NOT NULL constraint).
    groups: Mapped[list["Group"]] = relationship(back_populates="faculty", passive_deletes=True)
    users: Mapped[list["User"]] = relationship(back_populates="faculty")
