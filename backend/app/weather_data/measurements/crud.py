from typing import List

from database.database import SessionLocal
from weather_data.measurements.models import Measurement


def get_measurements(db: SessionLocal) -> List[Measurement]:
    return db.query(Measurement).all()


def get_measurements_for_station(db: SessionLocal, station: str) -> List[Measurement]:
    return db.query(Measurement).filter_by(station=station).all()
