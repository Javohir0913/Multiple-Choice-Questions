from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String, Table, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base

category_faculty = Table(
    "category_faculty",
    Base.metadata,
    Column("category_id", ForeignKey("categories.id", ondelete="CASCADE"), primary_key=True),
    Column("faculty_id", ForeignKey("faculties.id", ondelete="CASCADE"), primary_key=True),
)


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_archived: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # True -> visible to users of every faculty. False -> restricted to the
    # faculties listed in `faculties` (the category_faculty association table).
    visible_to_all_faculties: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    faculties: Mapped[list["Faculty"]] = relationship(secondary=category_faculty)
    subcategories: Mapped[list["SubCategory"]] = relationship(back_populates="category", passive_deletes=True)
