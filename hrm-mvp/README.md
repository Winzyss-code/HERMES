# HERMES MVP

Protected multi-tenant HR administration and AI resume screening prototype.

## Docker Quick Start

From this directory:

```powershell
docker compose up -d
```

Open:

- Frontend: http://localhost:5173
- Backend Swagger: http://localhost:8000/docs
- PostgreSQL: localhost:5432

The first build can take several minutes because the backend installs AI/NLP dependencies.

## Default Seed Accounts

These accounts are created automatically when the backend container starts:

- `super_admin` / `password123`
- `org_admin` / `password123`
- `hr_admin` / `password123`
- `recruiter` / `password123`

For the seeded organization, use this demo master string when viewing encrypted HR data:

```text
HERMES-MVP-MASTER-KEY
```

For a real demo flow, use `/register` to register a new organization. The first user becomes `org_admin`, then creates `hr_admin` and `recruiter` users inside that organization.

## Email Verification / SMTP

New organization registration requires email confirmation. Configure SMTP before running Docker:

```powershell
$env:SMTP_HOST="smtp.example.com"
$env:SMTP_PORT="587"
$env:SMTP_USERNAME="user@example.com"
$env:SMTP_PASSWORD="app-password"
$env:SMTP_FROM="HERMES <user@example.com>"
$env:SMTP_USE_TLS="true"
docker compose up -d
```

If `SMTP_HOST` is empty, HERMES keeps working in demo mode and prints the verification link in backend logs:

```powershell
docker compose logs -f backend
```

## Architecture

- Frontend: React 18, Vite, Tailwind CSS, Web Crypto API
- Backend: FastAPI, SQLAlchemy, JWT RBAC
- Database: PostgreSQL 17
- Screening: `sentence-transformers` with deterministic lexical fallback
- Deployment: Docker Compose with Nginx frontend proxy

## Security Model

HERMES uses a multi-tenant RBAC model:

- `super_admin`: platform-level organization visibility
- `org_admin`: manages users inside one organization
- `hr_admin`: manages encrypted employee records inside one organization
- `recruiter`: manages jobs and AI screening inside one organization

All organization-owned data is filtered by `organization_id` on the backend.

Employee data uses zero-knowledge client-side encryption:

- plaintext employee data is encrypted in the browser using PBKDF2 + AES-GCM;
- backend stores only `encrypted_data` and `iv`;
- the organization master string is never stored by the backend.

## Useful Commands

```powershell
docker compose ps
docker compose logs -f backend
docker compose logs -f frontend
docker compose down
```

Reset all Docker data:

```powershell
docker compose down -v
docker compose up -d --build
```

## Local Development Without Docker

Backend:

```powershell
cd backend
python -m venv venv
.\venv\Scripts\python.exe -m pip install -r requirements.txt
.\venv\Scripts\python.exe seed.py
.\venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000
```

Frontend:

```powershell
cd frontend
npm install
npm run dev
```
