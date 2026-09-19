from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import analytics, auth, categories, faculties, questions, test, users
from app.core.config import settings

app = FastAPI(title="MCQ Test Platform API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(faculties.router)
app.include_router(categories.router)
app.include_router(questions.router)
app.include_router(test.router)
app.include_router(analytics.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}

