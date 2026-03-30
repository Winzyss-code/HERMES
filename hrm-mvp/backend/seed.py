from sqlalchemy.orm import Session

from auth import hash_password
from database import Base, SessionLocal, engine
from models import User
from services.key_store import generate_key_ref


def seed_users(db: Session):
    defaults = [
        ("hr_admin@test.com", "password123", "hr_admin"),
        ("recruiter@test.com", "password123", "recruiter"),
    ]
    for email, password, role in defaults:
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            continue
        user = User(
            email=email,
            password_hash=hash_password(password),
            role=role,
            aes_key_ref=generate_key_ref(),
        )
        db.add(user)
    db.commit()


if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_users(db)
    finally:
        db.close()
