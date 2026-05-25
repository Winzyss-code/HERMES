import secrets
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from auth import create_access_token, hash_password, verify_password
from database import get_db
from models import Organization, User
from schemas import EmailVerificationOut, LoginRequest, RegisterOrganizationRequest, TokenOut
from services.email_service import send_verification_email


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
    response_model=EmailVerificationOut,
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

    existing_email = db.query(User).filter(User.email == payload.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Email already registered",
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

    verification_token = secrets.token_urlsafe(32)
    user = User(
        username=payload.username,
        email=payload.email,
        password_hash=hash_password(payload.password),
        role="org_admin",
        organization_id=organization.id,
        is_email_verified=False,
        email_verification_token=verification_token,
        email_verification_expires_at=datetime.utcnow() + timedelta(hours=24),
    )
    db.add(user)
    db.commit()

    try:
        send_verification_email(payload.email, payload.organization_name, verification_token)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Organization created, but verification email could not be sent",
        )

    return EmailVerificationOut(
        message="Organization registered. Check email to confirm account before login."
    )


@router.get("/verify-email", response_model=EmailVerificationOut)
def verify_email(
    token: str = Query(min_length=16),
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .filter(User.email_verification_token == token)
        .first()
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Verification token not found",
        )

    if not user.email_verification_expires_at or user.email_verification_expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Verification token expired",
        )

    user.is_email_verified = True
    user.email_verification_token = None
    user.email_verification_expires_at = None
    db.commit()

    return EmailVerificationOut(message="Email confirmed. You can now login.")


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

    if not user.is_email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email is not verified",
        )

    return token_for_user(user)
