import os

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker


load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def apply_mvp_schema_updates():
    if not DATABASE_URL.startswith("postgresql"):
        return

    with engine.begin() as connection:
        connection.execute(
            text(
                """
                DO $$
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'organization_status') THEN
                        CREATE TYPE organization_status AS ENUM ('active', 'suspended');
                    END IF;
                    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_status') THEN
                        CREATE TYPE job_status AS ENUM ('open', 'closed');
                    END IF;
                    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'candidate_status') THEN
                        CREATE TYPE candidate_status AS ENUM ('applied', 'screening', 'approved', 'rejected');
                    END IF;
                END $$;
                """
            )
        )
        for role in ("super_admin", "org_admin"):
            connection.execute(
                text(
                    f"""
                    ALTER TYPE user_role
                    ADD VALUE IF NOT EXISTS '{role}'
                    """
                )
            )
        connection.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS organizations (
                    id UUID PRIMARY KEY,
                    name VARCHAR UNIQUE NOT NULL,
                    status organization_status NOT NULL DEFAULT 'active',
                    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
                )
                """
            )
        )
        connection.execute(
            text(
                """
                INSERT INTO organizations (id, name, status, created_at)
                SELECT '00000000-0000-4000-8000-000000000001'::uuid, 'Default Organization', 'active', NOW()
                WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE name = 'Default Organization')
                """
            )
        )
        connection.execute(
            text(
                """
                ALTER TABLE users
                ADD COLUMN IF NOT EXISTS organization_id UUID NULL,
                ADD COLUMN IF NOT EXISTS email VARCHAR NULL,
                ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN NOT NULL DEFAULT TRUE,
                ADD COLUMN IF NOT EXISTS email_verification_token TEXT NULL,
                ADD COLUMN IF NOT EXISTS email_verification_expires_at TIMESTAMP WITHOUT TIME ZONE NULL
                """
            )
        )
        connection.execute(
            text(
                """
                UPDATE users
                SET email = username || '@local.hermes'
                WHERE email IS NULL
                """
            )
        )
        connection.execute(
            text(
                """
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1
                        FROM pg_indexes
                        WHERE indexname = 'ix_users_email'
                    ) THEN
                        CREATE UNIQUE INDEX ix_users_email ON users (email);
                    END IF;
                END $$;
                """
            )
        )
        connection.execute(
            text(
                """
                UPDATE users
                SET organization_id = (SELECT id FROM organizations WHERE name = 'Default Organization')
                WHERE organization_id IS NULL AND username != 'super_admin'
                """
            )
        )
        connection.execute(
            text(
                """
                ALTER TABLE jobs
                ADD COLUMN IF NOT EXISTS organization_id UUID NULL,
                ADD COLUMN IF NOT EXISTS status job_status NOT NULL DEFAULT 'open'
                """
            )
        )
        connection.execute(
            text(
                """
                UPDATE jobs
                SET organization_id = (SELECT id FROM organizations WHERE name = 'Default Organization')
                WHERE organization_id IS NULL
                """
            )
        )
        connection.execute(
            text(
                """
                ALTER TABLE candidates
                ADD COLUMN IF NOT EXISTS organization_id UUID NULL,
                ADD COLUMN IF NOT EXISTS employee_id UUID NULL
                """
            )
        )
        connection.execute(
            text(
                """
                ALTER TABLE candidates
                ADD COLUMN IF NOT EXISTS status candidate_status NOT NULL DEFAULT 'applied',
                ADD COLUMN IF NOT EXISTS resume_file_path TEXT NULL,
                ADD COLUMN IF NOT EXISTS candidate_name TEXT NULL,
                ADD COLUMN IF NOT EXISTS candidate_email TEXT NULL,
                ADD COLUMN IF NOT EXISTS candidate_phone TEXT NULL
                """
            )
        )
        connection.execute(
            text(
                """
                UPDATE candidates
                SET organization_id = (SELECT id FROM organizations WHERE name = 'Default Organization')
                WHERE organization_id IS NULL
                """
            )
        )
        connection.execute(
            text(
                """
                ALTER TABLE employees
                ADD COLUMN IF NOT EXISTS organization_id UUID NULL
                """
            )
        )
        connection.execute(
            text(
                """
                UPDATE employees
                SET organization_id = (SELECT id FROM organizations WHERE name = 'Default Organization')
                WHERE organization_id IS NULL
                """
            )
        )
        connection.execute(
            text(
                """
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1
                        FROM pg_constraint
                        WHERE conname = 'candidates_employee_id_fkey'
                    ) THEN
                        ALTER TABLE candidates
                        ADD CONSTRAINT candidates_employee_id_fkey
                        FOREIGN KEY (employee_id) REFERENCES employees(id);
                    END IF;
                END $$;
                """
            )
        )
