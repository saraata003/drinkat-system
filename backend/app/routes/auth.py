from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app import crud
from app.auth import create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/dev/create-first-staff")
def dev_create_first_staff(db: Session = Depends(get_db)):
    # إذا فيه موظف أصلاً، ما نعيد إنشاء
    staff_list = crud.get_active_staff(db)
    if staff_list:
        return {"ok": True, "detail": "Staff already exists"}

    st = crud.create_staff(db, name="Admin", pin="1234")
    return {"ok": True, "detail": "Created Admin with PIN 1234", "staff_id": st.id}


@router.post("/login")
def login(payload: dict, db: Session = Depends(get_db)):
    # payload = {"pin": "..."}
    pin = payload.get("pin")
    st = crud.staff_login(db, pin)

    token = create_access_token(staff_id=st.id, staff_name=st.name)
    return {"access_token": token, "token_type": "bearer"}