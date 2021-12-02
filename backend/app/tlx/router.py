from fastapi import APIRouter, Depends

from dependencies.database import get_db
from tlx.crud import save_tlx
from tlx.models import TLXModel
from tlx.schemas import TLXResults

router = APIRouter(
    prefix="/tlx",
    tags=["Likert Scale Results"],
    responses={404: {"description": "Not found"}},
)


@router.post("/save", response_model=bool)
async def save(tlx: TLXResults, db=Depends(get_db)):
    return save_tlx(db, TLXModel(**tlx.dict()))
