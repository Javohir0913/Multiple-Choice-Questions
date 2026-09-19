from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class CategoryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    # True -> visible to all faculties. False -> only faculty_ids below.
    visible_to_all_faculties: bool = True
    faculty_ids: list[int] = Field(default_factory=list)


class CategoryUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    visible_to_all_faculties: bool | None = None
    faculty_ids: list[int] | None = None


class CategoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    is_active: bool
    is_archived: bool
    visible_to_all_faculties: bool
    faculty_ids: list[int]
    created_at: datetime


class SubCategoryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    category_id: int
    total_questions_per_test: int = Field(default=20, gt=0)
    time_per_question_seconds: int = Field(default=150, gt=0)
    allow_back_navigation: bool = False
    available_from: datetime | None = None
    available_until: datetime | None = None


class SubCategoryUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    total_questions_per_test: int | None = Field(default=None, gt=0)
    time_per_question_seconds: int | None = Field(default=None, gt=0)
    allow_back_navigation: bool | None = None
    available_from: datetime | None = None
    available_until: datetime | None = None


class SubCategoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    category_id: int
    is_active: bool
    is_archived: bool
    total_questions_per_test: int
    time_per_question_seconds: int
    allow_back_navigation: bool
    available_from: datetime | None
    available_until: datetime | None
    created_at: datetime


class DeleteMode(BaseModel):
    hard: bool = False
