from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from auth import hash_password, require_role
from database import get_db
from models import Organization, User
from schemas import OrganizationOut, UserCreate, UserOut


router = APIRouter(prefix="/api", tags=["users"])


@router.get("/organizations", response_model=list[OrganizationOut])
def list_organizations(
    db: Session = Depends(get_db),
    _user=Depends(require_role(["super_admin"])),
):
    return db.query(Organization).order_by(Organization.created_at.desc()).all()


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
