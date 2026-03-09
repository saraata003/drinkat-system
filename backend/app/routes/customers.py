from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db import get_db
from app import crud
from app.schemas import CustomerCreate, CustomerOut

router = APIRouter(prefix="/customers", tags=["customers"])

@router.post("", response_model=CustomerOut)
def create_customer(payload: CustomerCreate, db: Session = Depends(get_db)):
    if crud.get_customer_by_phone(db, payload.phone):
        raise HTTPException(status_code=409, detail="Phone already exists")
    return crud.create_customer(db, payload)

@router.get("/by-phone/{phone}", response_model=CustomerOut)
def get_by_phone(phone: str, db: Session = Depends(get_db)):
    cust = crud.get_customer_by_phone(db, phone)
    if not cust:
        raise HTTPException(status_code=404, detail="Customer not found")
    return cust