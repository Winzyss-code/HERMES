import base64
import os

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from auth import require_organization_user, require_role
from database import get_db
from models import Candidate, Employee, Job
from schemas import EmployeeCreate, EmployeeOut, EmployeeUpdate


router = APIRouter(prefix="/api/employees", tags=["employees"])


def ensure_base64(value: str, field_name: str) -> None:
    try:
        base64.b64decode(value, validate=True)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"{field_name} must be valid base64",
        )


@router.post("", response_model=EmployeeOut, status_code=status.HTTP_201_CREATED)
def create_employee(
    payload: EmployeeCreate,
    db: Session = Depends(get_db),
    user=Depends(require_role(["hr_admin"])),
):
    require_organization_user(user)
    ensure_base64(payload.encrypted_data, "encrypted_data")
    ensure_base64(payload.iv, "iv")

    payload_data = payload.dict()
    candidate_id = payload_data.pop("candidate_id", None)
    employee = Employee(**payload_data, organization_id=user.organization_id)
    db.add(employee)
    if candidate_id:
        candidate = (
            db.query(Candidate)
            .filter(
                Candidate.id == candidate_id,
                Candidate.status == "approved",
                Candidate.organization_id == user.organization_id,
            )
            .first()
        )
        if not candidate:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Approved candidate not found",
            )

        job = (
            db.query(Job)
            .filter(Job.id == candidate.job_id, Job.organization_id == user.organization_id)
            .first()
        )
        if job:
            job.status = "closed"

        if candidate.resume_file_path and os.path.exists(candidate.resume_file_path):
            os.remove(candidate.resume_file_path)

        db.delete(candidate)

    db.commit()
    db.refresh(employee)
    return employee


@router.get("", response_model=list[EmployeeOut])
def list_employees(
    db: Session = Depends(get_db),
    user=Depends(require_role(["hr_admin"])),
):
    require_organization_user(user)
    return (
        db.query(Employee)
        .filter(Employee.organization_id == user.organization_id)
        .order_by(Employee.created_at.desc())
        .all()
    )


@router.put("/{employee_id}", response_model=EmployeeOut)
def update_employee(
    employee_id: str,
    payload: EmployeeUpdate,
    db: Session = Depends(get_db),
    user=Depends(require_role(["hr_admin"])),
):
    require_organization_user(user)
    ensure_base64(payload.encrypted_data, "encrypted_data")
    ensure_base64(payload.iv, "iv")

    employee = (
        db.query(Employee)
        .filter(
            Employee.id == employee_id,
            Employee.organization_id == user.organization_id,
        )
        .first()
    )
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found",
        )

    employee.department_id = payload.department_id
    employee.status = payload.status
    employee.encrypted_data = payload.encrypted_data
    employee.iv = payload.iv
    db.commit()
    db.refresh(employee)
    return employee


@router.delete("/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_employee(
    employee_id: str,
    db: Session = Depends(get_db),
    user=Depends(require_role(["hr_admin"])),
):
    require_organization_user(user)
    employee = (
        db.query(Employee)
        .filter(
            Employee.id == employee_id,
            Employee.organization_id == user.organization_id,
        )
        .first()
    )
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found",
        )

    (
        db.query(Candidate)
        .filter(
            Candidate.employee_id == employee.id,
            Candidate.organization_id == user.organization_id,
        )
        .update({Candidate.employee_id: None}, synchronize_session=False)
    )
    db.delete(employee)
    db.commit()
    return None
