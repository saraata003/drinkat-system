from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import datetime, timedelta
import math

from app.models import Customer, Transaction, Reward, Staff
from app.auth import hash_pin, verify_pin


# ======================
# Helpers (points expiry)
# ======================

def _since_6_months():
    # تقريب 6 أشهر = 180 يوم (ممتاز للـ MVP)
    return datetime.utcnow() - timedelta(days=180)

def recompute_customer_points(db: Session, cust: Customer) -> int:
    since = _since_6_months()

    earned = db.query(Transaction).filter(
        Transaction.customer_id == cust.id,
        Transaction.created_at >= since
    ).all()

    used = db.query(Reward).filter(
        Reward.customer_id == cust.id,
        Reward.created_at >= since
    ).all()

    earned_sum = sum(int(t.points_earned or 0) for t in earned)
    used_sum = sum(int(r.points_used or 0) for r in used)

    available = max(0, earned_sum - used_sum)
    cust.points = available  # نخزنها كـ cache
    db.commit()
    db.refresh(cust)
    return available


# ======================
# Customers
# ======================

def get_customer_by_phone(db: Session, phone: str):
    return db.query(Customer).filter(Customer.phone == phone).first()


def create_customer(db: Session, full_name: str, phone: str):
    existing = get_customer_by_phone(db, phone)
    if existing:
        raise HTTPException(status_code=400, detail="Phone already exists")

    cust = Customer(full_name=full_name, phone=phone, points=0)
    db.add(cust)
    db.commit()
    db.refresh(cust)
    return cust


# ======================
# Transactions
# ======================

def add_transaction_and_points(db: Session, data, staff_id: int):
    cust = get_customer_by_phone(db, data.phone)
    if not cust:
        raise HTTPException(status_code=404, detail="Customer not found")

    # منع تكرار الفاتورة
    existing = db.query(Transaction).filter(
        Transaction.branch == data.branch,
        Transaction.receipt_no == data.receipt_no
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Duplicate receipt")

    points = int(math.floor(data.amount))

    tx = Transaction(
        customer_id=cust.id,
        staff_id=staff_id,
        amount=data.amount,
        points_earned=points,
        branch=data.branch,
        receipt_no=data.receipt_no
    )

    db.add(tx)
    db.commit()

    # تحديث نقاط آخر 6 أشهر
    available = recompute_customer_points(db, cust)

    return {"points_added": points, "customer": cust, "available_points": available}


# ======================
# Rewards
# ======================

def redeem_reward(db: Session, data, staff_id: int):
    cust = get_customer_by_phone(db, data.phone)
    if not cust:
        raise HTTPException(status_code=404, detail="Customer not found")

    available = recompute_customer_points(db, cust)
    if available < data.points_cost:
        raise HTTPException(status_code=400, detail="Not enough points")

    reward = Reward(
        customer_id=cust.id,
        staff_id=staff_id,
        reward_type=data.reward_type,
        points_used=data.points_cost
    )

    db.add(reward)
    db.commit()

    # تحديث نقاط آخر 6 أشهر
    available2 = recompute_customer_points(db, cust)

    return {"customer": cust, "reward": reward, "available_points": available2}


# ======================
# Staff
# ======================

def get_staff_by_id(db: Session, staff_id: int):
    return db.query(Staff).filter(Staff.id == staff_id).first()


def get_active_staff(db: Session):
    return db.query(Staff).filter(Staff.is_active == True).all()


def create_staff(db: Session, name: str, pin: str):
    pin_hash = hash_pin(pin)
    staff = Staff(name=name, pin_hash=pin_hash, is_active=True)
    db.add(staff)
    db.commit()
    db.refresh(staff)
    return staff


def set_staff_active(db: Session, staff_id: int, is_active: bool):
    staff = get_staff_by_id(db, staff_id)
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")

    staff.is_active = is_active
    db.commit()
    db.refresh(staff)
    return staff


def staff_login(db: Session, pin: str):
    staff_list = db.query(Staff).filter(Staff.is_active == True).all()
    if not staff_list:
        raise HTTPException(status_code=400, detail="No active staff found. Create staff first.")

    for st in staff_list:
        if verify_pin(pin, st.pin_hash):
            return st

    raise HTTPException(status_code=401, detail="Invalid PIN")