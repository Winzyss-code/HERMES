from datetime import datetime
from typing import List
from uuid import UUID

from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    username: str = Field(min_length=2)
    password: str = Field(min_length=6)


class RegisterRequest(LoginRequest):
    role: str


class RegisterOrganizationRequest(LoginRequest):
    organization_name: str = Field(min_length=2)
    email: str = Field(min_length=5)


class EmailVerificationOut(BaseModel):
    message: str


class TokenOut(BaseModel):
    access_token: str
    role: str
    username: str
    organization_id: UUID | None = None
    organization_name: str | None = None
    token_type: str = "bearer"


class OrganizationOut(BaseModel):
    id: UUID
    name: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class OrganizationStatusUpdate(BaseModel):
    status: str


class PlatformMetricsOut(BaseModel):
    organizations_total: int
    organizations_active: int
    organizations_suspended: int
    users_total: int
    jobs_total: int
    candidates_total: int
    employees_total: int


class UserCreate(BaseModel):
    username: str = Field(min_length=2)
    password: str = Field(min_length=6)
    role: str


class UserPasswordReset(BaseModel):
    password: str = Field(min_length=6)


class UserOut(BaseModel):
    id: UUID
    username: str
    email: str | None = None
    role: str
    organization_id: UUID | None = None
    is_email_verified: bool = True
    created_at: datetime

    class Config:
        from_attributes = True


class EmployeeCreate(BaseModel):
    department_id: int
    status: str = "active"
    encrypted_data: str
    iv: str
    candidate_id: UUID | None = None


class EmployeeUpdate(BaseModel):
    department_id: int
    status: str = "active"
    encrypted_data: str
    iv: str


class EmployeeOut(EmployeeCreate):
    id: UUID
    organization_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


class JobCreate(BaseModel):
    title: str
    description: str
    required_skills: List[str] = Field(default_factory=list)


class JobOut(JobCreate):
    id: UUID
    organization_id: UUID
    status: str
    candidates_count: int = 0
    created_at: datetime

    class Config:
        from_attributes = True


class CandidateOut(BaseModel):
    id: UUID
    organization_id: UUID
    job_id: UUID
    employee_id: UUID | None = None
    status: str
    resume_filename: str
    candidate_name: str | None = None
    candidate_email: str | None = None
    candidate_phone: str | None = None
    final_score: float
    cosine_sim: float
    explanation: str
    created_at: datetime

    class Config:
        from_attributes = True


class EmployeeScreenRequest(BaseModel):
    employee_id: UUID
    profile_text: str = Field(min_length=1)
    candidate_name: str | None = None
    candidate_email: str | None = None
    candidate_phone: str | None = None


class CandidateStatusUpdate(BaseModel):
    status: str
