import os
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from auth import require_role
from database import get_db
from models import JobPosting, ResumeResult
from schemas import JobCreate, JobOut, ScreeningResultOut, ScreeningUploadResponse
from services.ai_screening import score_resume


router = APIRouter(tags=["screening"])

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")


@router.post("/jobs", response_model=JobOut, status_code=status.HTTP_201_CREATED)
def create_job(
    job_in: JobCreate,
    db: Session = Depends(get_db),
    user=Depends(require_role(["hr_admin", "recruiter"])),
):
    job = JobPosting(
        title=job_in.title,
        description=job_in.description,
        created_by=user.id,
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
    return db.query(JobPosting).order_by(JobPosting.created_at.desc()).all()


@router.post("/screening/upload", response_model=ScreeningUploadResponse)
async def upload_resume(
    job_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user=Depends(require_role(["hr_admin", "recruiter"])),
):
    try:
        job_uuid = uuid.UUID(job_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid job ID"
        )

    job = db.query(JobPosting).filter(JobPosting.id == job_uuid).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Job not found"
        )

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="PDF required"
        )

    pdf_bytes = await file.read()
    candidate_name, score = score_resume(pdf_bytes, job.description)

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    file_id = f"{uuid.uuid4()}.pdf"
    file_path = os.path.join(UPLOAD_DIR, file_id)
    with open(file_path, "wb") as out_file:
        out_file.write(pdf_bytes)

    result = ResumeResult(
        job_id=job.id,
        candidate_name=candidate_name,
        score=score,
        file_path=file_path,
        ranked_at=datetime.utcnow(),
    )
    db.add(result)
    db.commit()
    db.refresh(result)

    return ScreeningUploadResponse(
        candidate_name=candidate_name, score=score, job_title=job.title
    )


@router.get("/screening/results/{job_id}", response_model=list[ScreeningResultOut])
def get_results(
    job_id: str,
    db: Session = Depends(get_db),
    user=Depends(require_role(["hr_admin", "recruiter"])),
):
    try:
        job_uuid = uuid.UUID(job_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid job ID"
        )

    results = (
        db.query(ResumeResult)
        .filter(ResumeResult.job_id == job_uuid)
        .order_by(ResumeResult.score.desc())
        .all()
    )
    return results
