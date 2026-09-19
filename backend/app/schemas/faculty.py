from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class FacultyCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)


class FacultyUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    is_active: bool | None = None


class FacultyOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    is_active: bool
    created_at: datetime


class GroupCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    faculty_id: int


class GroupUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    faculty_id: int | None = None
    is_active: bool | None = None


class GroupOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    faculty_id: int
    is_active: bool
    created_at: datetime
