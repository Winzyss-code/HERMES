from datetime import datetime
from typing import List
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    role: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)


class UserOut(BaseModel):
    id: UUID
    email: EmailStr
    role: str
    aes_key_ref: str
    created_at: datetime

    class Config:
        from_attributes = True


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class EmployeeCreate(BaseModel):
    name_enc: str
    email_enc: str
    position_enc: str
    iv: str


class EmployeeOut(BaseModel):
    id: UUID
    created_by: UUID
    name_enc: str
    email_enc: str
    position_enc: str
    iv: str
    created_at: datetime


class JobCreate(BaseModel):
    title: str
    description: str


class JobOut(BaseModel):
    id: UUID
    title: str
    description: str
    created_by: UUID
    created_at: datetime

    class Config:
        from_attributes = True


class ScreeningResultOut(BaseModel):
    id: UUID
    job_id: UUID
    candidate_name: str
    score: float
    file_path: str
    ranked_at: datetime

    class Config:
        from_attributes = True


class ScreeningUploadResponse(BaseModel):
    candidate_name: str
    score: float
    job_title: str


class ScreeningResultsList(BaseModel):
    results: List[ScreeningResultOut]
