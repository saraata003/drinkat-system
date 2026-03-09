from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app import crud, schemas
from app.auth import require_staff

router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.post("")
def create_transaction(
    payload: schemas.TransactionCreate,
    db: Session = Depends(get_db),
    staff=Depends(require_staff),
):
    result = crud.add_transaction_and_points(
        db, payload, staff_id=staff["id"]
    )

    return {
        "points_added": result["points_added"],
        "customer": result["customer"],
        "staff": {"id": staff["id"], "name": staff["name"]},
        "available_points": result["available_points"],
    }