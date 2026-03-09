from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db import engine, Base
from app import models  # مهم: عشان الجداول تنعمل

from app.routes.customers import router as customers_router
from app.routes.transactions import router as transactions_router
from app.routes.rewards import router as rewards_router
from app.routes.auth import router as auth_router
from app.routes.staff import router as staff_router
from app.routes.history import router as history_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Drinkat Loyalty API")

# ✅ CORS (يسمح للـ Frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(customers_router)
app.include_router(transactions_router)
app.include_router(rewards_router)
app.include_router(auth_router)
app.include_router(staff_router)
app.include_router(history_router)

@app.get("/health")
def health():
    return {"ok": True}