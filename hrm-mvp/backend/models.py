import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Enum, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from database import Base


UserRole = Enum("super_admin", "org_admin", "hr_admin", "recruiter", name="user_role")
OrganizationStatus = Enum("active", "suspended", name="organization_status")
JobStatus = Enum("open", "closed", name="job_status")
CandidateStatus = Enum("applied", "screening", "approved", "rejected", name="candidate_status")


class Organization(Base):
    __tablename__ = "organizations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, unique=True, index=True, nullable=False)
    status = Column(OrganizationStatus, nullable=False, default="active")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    users = relationship("User", back_populates="organization")


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=True)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=True)
    password_hash = Column(Text, nullable=False)
    role = Column(UserRole, nullable=False)
    is_email_verified = Column(Boolean, nullable=False, default=True)
    email_verification_token = Column(Text, nullable=True)
    email_verification_expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    organization = relationship("Organization", back_populates="users")


class Employee(Base):
    __tablename__ = "employees"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    department_id = Column(Integer, nullable=False)
    status = Column(String, nullable=False, default="active")
    encrypted_data = Column(Text, nullable=False)
    iv = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class Job(Base):
    __tablename__ = "jobs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    required_skills = Column(JSON().with_variant(JSONB, "postgresql"), nullable=False, default=list)
    status = Column(JobStatus, nullable=False, default="open")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    candidates = relationship(
        "Candidate", back_populates="job", cascade="all, delete-orphan"
    )


class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.id"), nullable=False)
    employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.id"), nullable=True)
    status = Column(CandidateStatus, nullable=False, default="applied")
    resume_filename = Column(Text, nullable=False)
    resume_file_path = Column(Text, nullable=True)
    candidate_name = Column(Text, nullable=True)
    candidate_email = Column(Text, nullable=True)
    candidate_phone = Column(Text, nullable=True)
    final_score = Column(Float, nullable=False)
    cosine_sim = Column(Float, nullable=False)
    explanation = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    job = relationship("Job", back_populates="candidates")
    employee = relationship("Employee")
