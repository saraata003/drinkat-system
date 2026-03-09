from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, UniqueConstraint, func
from app.db import Base


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100), nullable=False)
    phone = Column(String(20), unique=True, nullable=False)
    qr_token = Column(String(100), nullable=True)
    points = Column(Integer, default=0)  # رح نخليها "كاش" بتتحدث تلقائياً
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Staff(Base):
    __tablename__ = "staff"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), default="Admin", nullable=False)
    pin_hash = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    staff_id = Column(Integer, ForeignKey("staff.id"), nullable=True)

    amount = Column(Float, nullable=False)
    points_earned = Column(Integer, nullable=False)
    branch = Column(String(100), nullable=False)
    receipt_no = Column(String(100), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("branch", "receipt_no", name="uix_branch_receipt"),
    )


class Reward(Base):
    __tablename__ = "rewards"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    staff_id = Column(Integer, ForeignKey("staff.id"), nullable=True)

    reward_type = Column(String(50), nullable=False)
    points_used = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())