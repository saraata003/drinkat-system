from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


# ======================
# Customers
# ======================

class CustomerCreate(BaseModel):
    full_name: str
    phone: str


class CustomerOut(BaseModel):
    id: int
    full_name: str
    phone: str
    qr_token: Optional[str] = None
    points: int

    class Config:
        from_attributes = True


# ======================
# Transactions
# ======================

class TransactionCreate(BaseModel):
    phone: str
    amount: float
    branch: str
    receipt_no: str


# ======================
# Rewards
# ======================

class RewardRedeem(BaseModel):
    phone: str
    reward_type: str
    points_cost: int = Field(..., ge=1)


# ======================
# Auth
# ======================

class PinLogin(BaseModel):
    pin: str = Field(..., min_length=4, max_length=12)


# ======================
# Staff
# ======================

class StaffCreate(BaseModel):
    name: str
    pin: str = Field(..., min_length=4, max_length=12)


class StaffOut(BaseModel):
    id: int
    name: str
    is_active: bool

    class Config:
        from_attributes = True


class StaffSetActive(BaseModel):
    is_active: bool