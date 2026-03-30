# Secure HRM MVP

Secure HRM System MVP with application-level encryption for employee data and AI-driven resume screening. The backend never decrypts employee fields; decryption happens only in the browser using Web Crypto API.

## Objective

- Protect employee PII with client-side AES-GCM encryption
- Provide JWT-based access control with two roles (hr_admin, recruiter)
- Enable AI-driven resume screening with anonymization and similarity scoring

## Tech Stack

- Backend: FastAPI, SQLAlchemy, PostgreSQL
- Frontend: React 18, Vite, Tailwind CSS
- Crypto: Web Crypto API (AES-GCM + PBKDF2)
- AI: sentence-transformers + cosine similarity

## Project Structure

```
hrm-mvp/
├── backend/
│   ├── main.py
│   ├── database.py
│   ├── models.py
│   ├── schemas.py
│   ├── auth.py
│   ├── routers/
│   ├── services/
│   └── seed.py
└── frontend/
    └── src/
```

## Setup

### Backend

```bash
cd backend
pip install -r requirements.txt
```

Create database:

```bash
createdb hrm_mvp
```

If `createdb` is not on PATH (Windows):

```powershell
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -h 127.0.0.1 -c "CREATE DATABASE hrm_mvp;"
```

Run the server:

```bash
uvicorn main:app --reload --port 8000
```

Seed default users:

```bash
python seed.py
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Environment

Create `backend/.env`:

```
DATABASE_URL=postgresql://postgres:password@localhost:5432/hrm_mvp
JWT_SECRET=replace_with_random_secret_string
JWT_ALGORITHM=HS256
```

## API Overview

- `POST /auth/register`
- `POST /auth/login`
- `POST /employees` (hr_admin only)
- `GET /employees` (hr_admin only)
- `GET /employees/{id}` (hr_admin only)
- `POST /jobs` (both roles)
- `GET /jobs` (both roles)
- `POST /screening/upload` (both roles)
- `GET /screening/results/{job_id}` (both roles)

## Data

- PostgreSQL stores encrypted employee fields as BYTEA
- AES keys are derived in-browser using PBKDF2 and never leave the client
- Resume PDFs are stored on disk for MVP traceability and referenced in `resume_results`

## Security Notes (MVP)

- Employee data is encrypted client-side; server never decrypts
- JWT and CryptoKey are stored in memory only
- Keys are derived from user password + email salt (PBKDF2)

## Limitations

- No refresh token or persistent session storage (memory-only auth)
- Minimal validation and error handling for MVP scope
- Resume anonymization uses regex heuristics and may miss edge cases

## Default Test Accounts

- `hr_admin@test.com` / `password123` (role: hr_admin)
- `recruiter@test.com` / `password123` (role: recruiter)

## Troubleshooting

- `email-validator is not installed` → `pip install -r requirements.txt`
- `bcrypt` errors → `pip install -r requirements.txt --upgrade`
- `users table does not exist` → run `python seed.py` after DB is created
