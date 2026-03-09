from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app import crud, schemas
from app.auth import require_staff

router = APIRouter(prefix="/staff", tags=["staff"])


def require_admin(staff=Depends(require_staff)):
    # Admin = أول موظف في النظام (id=1)
    if staff["id"] != 1:
        raise HTTPException(status_code=403, detail="Admin only")
    return staff


@router.get("", response_model=list[schemas.StaffOut])
def list_staff(db: Session = Depends(get_db), _admin=Depends(require_admin)):
    return crud.get_active_staff(db)


@router.post("", response_model=schemas.StaffOut)
def create_staff(payload: schemas.StaffCreate, db: Session = Depends(get_db), _admin=Depends(require_admin)):
    st = crud.create_staff(db, name=payload.name, pin=payload.pin)
    return st


@router.patch("/{staff_id}", response_model=schemas.StaffOut)
def set_staff_active(staff_id: int, payload: schemas.StaffSetActive, db: Session = Depends(get_db), _admin=Depends(require_admin)):
    st = crud.set_staff_active(db, staff_id=staff_id, is_active=payload.is_active)
    return st