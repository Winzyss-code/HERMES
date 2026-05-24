from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from auth import create_access_token, hash_password, verify_password
from database import get_db
from models import Organization, User
from schemas import LoginRequest, RegisterOrganizationRequest, TokenOut


router = APIRouter(prefix="/api/auth", tags=["auth"])


def token_for_user(user: User) -> TokenOut:
    return TokenOut(
        access_token=create_access_token(user.id, user.role, user.organization_id),
        role=user.role,
        username=user.username,
        organization_id=user.organization_id,
        organization_name=user.organization.name if user.organization else None,
    )


@router.post(
    "/register-organization",
    response_model=TokenOut,
    status_code=status.HTTP_201_CREATED,
)
def register_organization(
    payload: RegisterOrganizationRequest,
    db: Session = Depends(get_db),
):
    existing_user = db.query(User).filter(User.username == payload.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Username already registered",
        )

    existing_org = (
        db.query(Organization)
        .filter(Organization.name == payload.organization_name)
        .first()
    )
    if existing_org:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Organization already registered",
        )

    organization = Organization(name=payload.organization_name, status="active")
    db.add(organization)
    db.flush()

    user = User(
        username=payload.username,
        password_hash=hash_password(payload.password),
        role="org_admin",
        organization_id=organization.id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return token_for_user(user)


@router.post("/login", response_model=TokenOut)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == payload.username).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    if user.organization and user.organization.status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Organization is not active",
        )

    return token_for_user(user)
