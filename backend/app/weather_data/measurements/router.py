from typing import List

from fastapi import APIRouter, Depends

from dependencies.database import get_db
from weather_data.measurements import crud
from weather_data.measurements.schemas import SimpleMeasurement

router = APIRouter(
    prefix="/measurements",
    tags=["measurements"],
    responses={404: {"description": "Not found"}},
)


@router.get("/", response_model=List[SimpleMeasurement])
async def read_arguments(db=Depends(get_db)):
    return crud.get_measurements(db)


@router.get("/{station_id}", response_model=List[SimpleMeasurement])
async def read_arguments(station_id: str, db=Depends(get_db)):
    return crud.get_measurements_for_station(db, station_id)
