from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Customer, Transaction, Reward
from app.auth import require_staff  # حماية بالـ JWT

router = APIRouter(prefix="/history", tags=["history"])


@router.get("/{phone}")
def get_history(phone: str, db: Session = Depends(get_db), staff=Depends(require_staff)):
    cust = db.query(Customer).filter(Customer.phone == phone).first()
    if not cust:
        raise HTTPException(status_code=404, detail="Customer not found")

    txs = (
        db.query(Transaction)
        .filter(Transaction.customer_id == cust.id)
        .order_by(Transaction.created_at.desc())
        .limit(20)
        .all()
    )

    rewards = (
        db.query(Reward)
        .filter(Reward.customer_id == cust.id)
        .order_by(Reward.created_at.desc())
        .limit(20)
        .all()
    )

    def staff_dict(obj):
        if hasattr(obj, "staff") and obj.staff:
            return {"id": obj.staff.id, "name": obj.staff.name}
        return None

    return {
        "customer": {
            "id": cust.id,
            "full_name": cust.full_name,
            "phone": cust.phone,
            "points": cust.points,
        },
        "transactions": [
            {
                "id": t.id,
                "amount": float(t.amount),
                "points_earned": t.points_earned,
                "branch": t.branch,
                "receipt_no": t.receipt_no,
                "created_at": str(t.created_at),
                "staff": staff_dict(t),
            }
            for t in txs
        ],
        "rewards": [
            {
                "id": r.id,
                "reward_type": r.reward_type,
                "points_used": r.points_used,
                "created_at": str(r.created_at),
                "staff": staff_dict(r),
            }
            for r in rewards
        ],
    }