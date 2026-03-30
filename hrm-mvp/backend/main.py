from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine
from routers.auth_router import router as auth_router
from routers.employees_router import router as employees_router
from routers.screening_router import router as screening_router


Base.metadata.create_all(bind=engine)

app = FastAPI(title="Secure HRM MVP")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(employees_router)
app.include_router(screening_router)
