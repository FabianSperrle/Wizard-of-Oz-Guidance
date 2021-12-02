from fastapi import APIRouter, Depends

from dependencies.database import get_db
from likert.crud import save_likert
from likert.models import LikertScaleResult
from likert.schemas import LikertScaleResults

router = APIRouter(
    prefix="/likert",
    tags=["Likert Scale Results"],
    responses={404: {"description": "Not found"}},
)


@router.post("/save", response_model=bool)
async def save(likert: LikertScaleResults, db=Depends(get_db)):
    return save_likert(db, LikertScaleResult(**likert.dict()))
