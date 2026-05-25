from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from auth import hash_password, require_role
from database import get_db
from models import Candidate, Employee, Job, Organization, User
from schemas import (
    OrganizationOut,
    OrganizationStatusUpdate,
    PlatformMetricsOut,
    UserCreate,
    UserOut,
    UserPasswordReset,
)


router = APIRouter(prefix="/api", tags=["users"])


@router.get("/platform/metrics", response_model=PlatformMetricsOut)
def platform_metrics(
    db: Session = Depends(get_db),
    _user=Depends(require_role(["super_admin"])),
):
    return PlatformMetricsOut(
        organizations_total=db.query(Organization).count(),
        organizations_active=db.query(Organization).filter(Organization.status == "active").count(),
        organizations_suspended=db.query(Organization).filter(Organization.status == "suspended").count(),
        users_total=db.query(User).count(),
        jobs_total=db.query(Job).count(),
        candidates_total=db.query(Candidate).count(),
        employees_total=db.query(Employee).count(),
    )


@router.get("/organizations", response_model=list[OrganizationOut])
def list_organizations(
    db: Session = Depends(get_db),
    _user=Depends(require_role(["super_admin"])),
):
    return db.query(Organization).order_by(Organization.created_at.desc()).all()


@router.patch("/organizations/{organization_id}/status", response_model=OrganizationOut)
def update_organization_status(
    organization_id: str,
    payload: OrganizationStatusUpdate,
    db: Session = Depends(get_db),
    _user=Depends(require_role(["super_admin"])),
):
    if payload.status not in {"active", "suspended"}:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid organization status",
        )

    organization = db.query(Organization).filter(Organization.id == organization_id).first()
    if not organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        )

    organization.status = payload.status
    db.commit()
    db.refresh(organization)
    return organization


@router.get("/organizations/{organization_id}/users", response_model=list[UserOut])
def list_organization_users(
    organization_id: str,
    db: Session = Depends(get_db),
    _user=Depends(require_role(["super_admin"])),
):
    organization = db.query(Organization).filter(Organization.id == organization_id).first()
    if not organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        )

    return (
        db.query(User)
        .filter(User.organization_id == organization_id)
        .order_by(User.created_at.desc())
        .all()
    )


@router.get("/platform/users", response_model=list[UserOut])
def list_platform_users(
    db: Session = Depends(get_db),
    _user=Depends(require_role(["super_admin"])),
):
    return db.query(User).order_by(User.created_at.desc()).all()


@router.patch("/platform/users/{user_id}/password", response_model=UserOut)
def reset_platform_user_password(
    user_id: str,
    payload: UserPasswordReset,
    db: Session = Depends(get_db),
    admin=Depends(require_role(["super_admin"])),
):
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if target_user.id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Super admin cannot reset their own password here",
        )

    target_user.password_hash = hash_password(payload.password)
    db.commit()
    db.refresh(target_user)
    return target_user


@router.delete("/platform/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_platform_user(
    user_id: str,
    db: Session = Depends(get_db),
    admin=Depends(require_role(["super_admin"])),
):
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if target_user.id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Super admin cannot delete their own account",
        )

    db.delete(target_user)
    db.commit()
    return None


@router.get("/users", response_model=list[UserOut])
def list_users(
    db: Session = Depends(get_db),
    user=Depends(require_role(["org_admin"])),
):
    return (
        db.query(User)
        .filter(User.organization_id == user.organization_id)
        .order_by(User.created_at.desc())
        .all()
    )


@router.post("/users", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    user=Depends(require_role(["org_admin"])),
):
    if payload.role not in {"hr_admin", "recruiter"}:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Org admin can create only hr_admin or recruiter",
        )

    existing = db.query(User).filter(User.username == payload.username).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Username already registered",
        )

    created_user = User(
        username=payload.username,
        password_hash=hash_password(payload.password),
        role=payload.role,
        organization_id=user.organization_id,
    )
    db.add(created_user)
    db.commit()
    db.refresh(created_user)
    return created_user
