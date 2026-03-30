import base64
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from auth import require_role
from database import get_db
from models import Employee
from schemas import EmployeeCreate, EmployeeOut


router = APIRouter(prefix="/employees", tags=["employees"])


@router.post("", response_model=EmployeeOut, status_code=status.HTTP_201_CREATED)
def create_employee(
    payload: EmployeeCreate,
    db: Session = Depends(get_db),
    user=Depends(require_role(["hr_admin"])),
):
    try:
        name_bytes = base64.b64decode(payload.name_enc)
        email_bytes = base64.b64decode(payload.email_enc)
        position_bytes = base64.b64decode(payload.position_enc)
        iv_bytes = base64.b64decode(payload.iv)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid base64 payload",
        )

    employee = Employee(
        created_by=user.id,
        name_enc=name_bytes,
        email_enc=email_bytes,
        position_enc=position_bytes,
        iv=iv_bytes,
    )
    db.add(employee)
    db.commit()
    db.refresh(employee)
    return EmployeeOut(
        id=employee.id,
        created_by=employee.created_by,
        name_enc=base64.b64encode(employee.name_enc).decode("utf-8"),
        email_enc=base64.b64encode(employee.email_enc).decode("utf-8"),
        position_enc=base64.b64encode(employee.position_enc).decode("utf-8"),
        iv=base64.b64encode(employee.iv).decode("utf-8"),
        created_at=employee.created_at,
    )


@router.get("", response_model=list[EmployeeOut])
def list_employees(
    db: Session = Depends(get_db),
    user=Depends(require_role(["hr_admin"])),
):
    employees = db.query(Employee).order_by(Employee.created_at.desc()).all()
    return [
        EmployeeOut(
            id=emp.id,
            created_by=emp.created_by,
            name_enc=base64.b64encode(emp.name_enc).decode("utf-8"),
            email_enc=base64.b64encode(emp.email_enc).decode("utf-8"),
            position_enc=base64.b64encode(emp.position_enc).decode("utf-8"),
            iv=base64.b64encode(emp.iv).decode("utf-8"),
            created_at=emp.created_at,
        )
        for emp in employees
    ]


@router.get("/{employee_id}", response_model=EmployeeOut)
def get_employee(
    employee_id: str,
    db: Session = Depends(get_db),
    user=Depends(require_role(["hr_admin"])),
):
    try:
        employee_uuid = uuid.UUID(employee_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid ID"
        )

    employee = db.query(Employee).filter(Employee.id == employee_uuid).first()
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found"
        )

    return EmployeeOut(
        id=employee.id,
        created_by=employee.created_by,
        name_enc=base64.b64encode(employee.name_enc).decode("utf-8"),
        email_enc=base64.b64encode(employee.email_enc).decode("utf-8"),
        position_enc=base64.b64encode(employee.position_enc).decode("utf-8"),
        iv=base64.b64encode(employee.iv).decode("utf-8"),
        created_at=employee.created_at,
    )
