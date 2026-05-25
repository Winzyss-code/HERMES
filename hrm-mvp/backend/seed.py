from sqlalchemy.orm import Session

from auth import hash_password
from database import Base, SessionLocal, apply_mvp_schema_updates, engine
from models import Organization, User


def seed_users(db: Session):
    default_org = (
        db.query(Organization).filter(Organization.name == "Default Organization").first()
    )
    if not default_org:
        default_org = Organization(name="Default Organization", status="active")
        db.add(default_org)
        db.flush()

    defaults = [
        ("super_admin", "super_admin@local.hermes", "password123", "super_admin", None),
        ("org_admin", "org_admin@local.hermes", "password123", "org_admin", default_org.id),
        ("hr_admin", "hr_admin@local.hermes", "password123", "hr_admin", default_org.id),
        ("recruiter", "recruiter@local.hermes", "password123", "recruiter", default_org.id),
    ]
    for username, email, password, role, organization_id in defaults:
        existing = db.query(User).filter(User.username == username).first()
        if existing:
            if not existing.email:
                existing.email = email
            existing.is_email_verified = True
            continue
        db.add(
            User(
                username=username,
                email=email,
                password_hash=hash_password(password),
                role=role,
                organization_id=organization_id,
                is_email_verified=True,
            )
        )
    db.commit()


if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    apply_mvp_schema_updates()
    db = SessionLocal()
    try:
        seed_users(db)
        print(
            "Seeded users: super_admin/password123, org_admin/password123, hr_admin/password123, recruiter/password123"
        )
    finally:
        db.close()
