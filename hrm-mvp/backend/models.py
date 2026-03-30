import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, Enum, Float, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import BYTEA, UUID
from sqlalchemy.orm import relationship

from database import Base


UserRole = Enum("hr_admin", "recruiter", name="user_role")


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(Text, nullable=False)
    role = Column(UserRole, nullable=False)
    aes_key_ref = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    employees = relationship("Employee", back_populates="creator")
    job_postings = relationship("JobPosting", back_populates="creator")


class Employee(Base):
    __tablename__ = "employees"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    name_enc = Column(BYTEA, nullable=False)
    email_enc = Column(BYTEA, nullable=False)
    position_enc = Column(BYTEA, nullable=False)
    iv = Column(BYTEA, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    creator = relationship("User", back_populates="employees")


class JobPosting(Base):
    __tablename__ = "job_postings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    creator = relationship("User", back_populates="job_postings")
    results = relationship("ResumeResult", back_populates="job_posting")


class ResumeResult(Base):
    __tablename__ = "resume_results"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id = Column(UUID(as_uuid=True), ForeignKey("job_postings.id"), nullable=False)
    candidate_name = Column(Text, nullable=False)
    score = Column(Float, nullable=False)
    file_path = Column(Text, nullable=False)
    ranked_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    job_posting = relationship("JobPosting", back_populates="results")
