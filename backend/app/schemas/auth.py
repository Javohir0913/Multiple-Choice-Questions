from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class UserRegister(BaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    phone: str = Field(min_length=7, max_length=20)
    password: str = Field(min_length=6, max_length=128)
    faculty_id: int
    group_id: int


class UserLogin(BaseModel):
    phone: str
    password: str


class AdminLogin(BaseModel):
    phone: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    first_name: str
    last_name: str
    phone: str
    faculty_id: int | None
    group_id: int | None
    is_admin: bool
    is_active: bool
    created_at: datetime


class ChangePasswordByAdmin(BaseModel):
    new_password: str = Field(min_length=6, max_length=128)


class SetUserActive(BaseModel):
    is_active: bool
