from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas import RewardRedeem, CustomerOut
from app import crud
from app.auth import require_staff

router = APIRouter(prefix="/rewards", tags=["rewards"])

@router.post("/redeem")
def redeem(
    payload: RewardRedeem,
    db: Session = Depends(get_db),
    staff=Depends(require_staff),
):
    res = crud.redeem_reward(db, payload)
    return {
        "customer": CustomerOut.model_validate(res["customer"]),
        "reward": {
            "id": res["reward"].id,
            "reward_type": res["reward"].reward_type,
            "points_used": res["reward"].points_used
        },
        "staff": staff,
    }