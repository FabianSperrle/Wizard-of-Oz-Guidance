from fastapi import APIRouter, Depends

from candidates.crud import save_candidates
from candidates.models import CandidatesModel
from candidates.schemas import Candidates
from dependencies.database import get_db

router = APIRouter(
    prefix="/candidates",
    tags=["Store remaining result candidates after a task is completed"],
    responses={404: {"description": "Not found"}},
)


@router.post("/save", response_model=bool)
async def save(candidates: Candidates, db=Depends(get_db)):
    return save_candidates(db, CandidatesModel(**candidates.dict()))
