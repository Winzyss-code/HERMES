import os
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import func
from sqlalchemy.orm import Session
from uuid import UUID

from auth import require_organization_user, require_role
from database import get_db
from models import Candidate, Employee, Job
from schemas import CandidateOut, CandidateStatusUpdate, EmployeeScreenRequest, JobCreate, JobOut
from services.ai_screening import extract_candidate_profile, extract_text, score_resume


router = APIRouter(prefix="/api", tags=["recruiting"])
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")


@router.post("/jobs", response_model=JobOut, status_code=status.HTTP_201_CREATED)
def create_job(
    payload: JobCreate,
    db: Session = Depends(get_db),
    user=Depends(require_role(["recruiter"])),
):
    require_organization_user(user)
    job = Job(
        organization_id=user.organization_id,
        title=payload.title,
        description=payload.description,
        required_skills=payload.required_skills,
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


@router.get("/jobs", response_model=list[JobOut])
def list_jobs(
    db: Session = Depends(get_db),
    user=Depends(require_role(["hr_admin", "recruiter"])),
):
    require_organization_user(user)
    rows = (
        db.query(Job, func.count(Candidate.id).label("candidates_count"))
        .outerjoin(Candidate, Candidate.job_id == Job.id)
        .filter(Job.organization_id == user.organization_id)
        .group_by(Job.id)
        .order_by(Job.created_at.desc())
        .all()
    )
    return [
        JobOut(
            id=job.id,
            organization_id=job.organization_id,
            title=job.title,
            description=job.description,
            required_skills=job.required_skills,
            status=job.status,
            created_at=job.created_at,
            candidates_count=count,
        )
        for job, count in rows
    ]


@router.post("/jobs/{job_id}/screen", response_model=CandidateOut)
async def screen_resume(
    job_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user=Depends(require_role(["recruiter"])),
):
    require_organization_user(user)
    try:
        job_uuid = UUID(job_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid job ID"
        )

    job = (
        db.query(Job)
        .filter(Job.id == job_uuid, Job.organization_id == user.organization_id)
        .first()
    )
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    content = await file.read()
    try:
        resume_text = extract_text(file.filename or "resume", content)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        )

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    stored_filename = f"{uuid.uuid4()}-{file.filename or 'resume'}"
    file_path = os.path.abspath(os.path.join(UPLOAD_DIR, stored_filename))
    with open(file_path, "wb") as output:
        output.write(content)

    profile = extract_candidate_profile(resume_text, file.filename or "resume")
    score = score_resume(job.description, job.required_skills, resume_text)
    candidate = Candidate(
        organization_id=user.organization_id,
        job_id=job.id,
        status="screening",
        resume_filename=file.filename or "resume",
        resume_file_path=file_path,
        candidate_name=profile.name,
        candidate_email=profile.email,
        candidate_phone=profile.phone,
        final_score=score.final_score,
        cosine_sim=score.cosine_sim,
        explanation=score.explanation,
    )
    db.add(candidate)
    db.commit()
    db.refresh(candidate)
    return candidate


@router.post("/jobs/{job_id}/screen-employee", response_model=CandidateOut)
def screen_employee(
    job_id: str,
    payload: EmployeeScreenRequest,
    db: Session = Depends(get_db),
    user=Depends(require_role(["hr_admin", "recruiter"])),
):
    require_organization_user(user)
    try:
        job_uuid = UUID(job_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid job ID"
        )

    job = (
        db.query(Job)
        .filter(Job.id == job_uuid, Job.organization_id == user.organization_id)
        .first()
    )
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    employee = (
        db.query(Employee)
        .filter(
            Employee.id == payload.employee_id,
            Employee.organization_id == user.organization_id,
        )
        .first()
    )
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found"
        )

    score = score_resume(job.description, job.required_skills, payload.profile_text)
    candidate = Candidate(
        organization_id=user.organization_id,
        job_id=job.id,
        employee_id=employee.id,
        status="screening",
        resume_filename=f"internal-employee-{employee.id}",
        candidate_name=(payload.candidate_name or f"Internal employee {employee.id}").strip(),
        candidate_email=payload.candidate_email,
        candidate_phone=payload.candidate_phone,
        final_score=score.final_score,
        cosine_sim=score.cosine_sim,
        explanation=f"Internal employee screening for {payload.candidate_name or employee.id}. {score.explanation}",
    )
    db.add(candidate)
    db.commit()
    db.refresh(candidate)
    return candidate


@router.patch("/candidates/{candidate_id}/status", response_model=CandidateOut)
def update_candidate_status(
    candidate_id: str,
    payload: CandidateStatusUpdate,
    db: Session = Depends(get_db),
    user=Depends(require_role(["recruiter"])),
):
    require_organization_user(user)
    if payload.status not in {"applied", "screening", "approved", "rejected"}:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid candidate status",
        )

    try:
        candidate_uuid = UUID(candidate_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid candidate ID",
        )

    candidate = (
        db.query(Candidate)
        .filter(
            Candidate.id == candidate_uuid,
            Candidate.organization_id == user.organization_id,
        )
        .first()
    )
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found"
        )

    candidate.status = payload.status
    db.commit()
    db.refresh(candidate)
    return candidate


@router.get("/candidates/approved", response_model=list[CandidateOut])
def list_approved_candidates(
    db: Session = Depends(get_db),
    user=Depends(require_role(["hr_admin"])),
):
    require_organization_user(user)
    return (
        db.query(Candidate)
        .filter(
            Candidate.status == "approved",
            Candidate.organization_id == user.organization_id,
        )
        .order_by(Candidate.final_score.desc())
        .all()
    )


@router.get("/jobs/{job_id}/candidates", response_model=list[CandidateOut])
def list_candidates(
    job_id: str,
    db: Session = Depends(get_db),
    user=Depends(require_role(["recruiter"])),
):
    require_organization_user(user)
    try:
        job_uuid = UUID(job_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid job ID"
        )

    return (
        db.query(Candidate)
        .filter(
            Candidate.job_id == job_uuid,
            Candidate.organization_id == user.organization_id,
        )
        .order_by(Candidate.final_score.desc())
        .all()
    )
