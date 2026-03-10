from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db import engine, Base
from app.routes import auth

# إنشاء التطبيق
app = FastAPI(title="Drinkat Loyalty API")

# CORS للسماح للفرونت بالاتصال
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# إنشاء الجداول في قاعدة البيانات
Base.metadata.create_all(bind=engine)

# إضافة الـ routes
app.include_router(auth.router)


# Route بسيط للتجربة
@app.get("/")
def root():
    return {"message": "Drinkat API is running"}